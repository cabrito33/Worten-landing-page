import { GoogleGenAI, Type } from '@google/genai';
import crypto from 'crypto';
import {
  getActiveCatalogItems,
  savePedido,
  saveProposta,
  updatePropostaNotificacao,
} from './firebaseAdmin.ts';
import type {
  CatalogItem,
  PedidoRecord,
  PropostaRecord,
  ProposalItem,
} from './firebaseAdmin.ts';
import { sendProposalNotificationEmail } from './resendService.ts';

export interface InterpretationResult {
  resumo: string;
  itensIdentificados: Array<{
    catalogId: string;
    quantidade: number | null;
    evidencia: string;
  }>;
  informacaoEmFalta: string;
  necessitaRevisao: boolean;
  motivoRevisao: string;
}

const geminiOutputSchema = {
  type: Type.OBJECT,
  properties: {
    resumo: {
      type: Type.STRING,
      description: 'Resumo conciso da necessidade ou avaria indicada pelo cliente.',
    },
    itensIdentificados: {
      type: Type.ARRAY,
      description: 'Lista de serviços ou produtos do catálogo correspondentes ao pedido.',
      items: {
        type: Type.OBJECT,
        properties: {
          catalogId: {
            type: Type.STRING,
            description: 'O ID exato do item conforme listado no catálogo fornecido.',
          },
          quantidade: {
            type: Type.INTEGER,
            description: 'Quantidade solicitada pelo cliente (ex: "50 iPhones" = 50, "1 bateria" = 1). Se a quantidade não for clara no texto, usa null.',
            nullable: true,
          },
          evidencia: {
            type: Type.STRING,
            description: 'Frase ou excerto do pedido do cliente que justifica a escolha deste item.',
          },
        },
        required: ['catalogId', 'evidencia'],
      },
    },
    informacaoEmFalta: {
      type: Type.STRING,
      description: 'Detalhes adicionais em falta (marca, modelo, acessibilidade do local, etc.), ou vazio se estiver tudo claro.',
    },
    necessitaRevisao: {
      type: Type.BOOLEAN,
      description: 'true se for necessário um técnico rever antes de aprovar (ex: serviços complexos, falta de dados críticos, etc.).',
    },
    motivoRevisao: {
      type: Type.STRING,
      description: 'Motivo específico pelo qual necessita de revisão humana, ou vazio se for imediato.',
    },
  },
  required: ['resumo', 'itensIdentificados', 'informacaoEmFalta', 'necessitaRevisao', 'motivoRevisao'],
};

/**
 * Extrai a quantidade explícita associada a um termo do pedido (ex: "50 iphones", "1 bateria")
 */
function extractQuantityFromText(text: string, keywords: string[]): number | null {
  const lower = text.toLowerCase();
  for (const kw of keywords) {
    // 1. Número antes da palavra (ex: "50 iphones", "1 bateria", "20 unidades de iphone")
    const beforeRegex = new RegExp(`(\\d+)\\s*(?:unidades?\\s*(?:de\\s*)?)?${kw}`, 'i');
    const beforeMatch = lower.match(beforeRegex);
    if (beforeMatch && beforeMatch[1]) {
      const n = parseInt(beforeMatch[1], 10);
      if (!isNaN(n) && n > 0) return n;
    }

    // 2. Número depois da palavra (ex: "iphones: 50", "baterias x 3", "iphone qtd 50")
    const afterRegex = new RegExp(`${kw}\\s*(?:qtd|quantidade|x|:|=)?\\s*(\\d+)`, 'i');
    const afterMatch = lower.match(afterRegex);
    if (afterMatch && afterMatch[1]) {
      const n = parseInt(afterMatch[1], 10);
      if (!isNaN(n) && n > 0) return n;
    }

    // 3. Palavras em português como "um iphone", "uma bateria"
    const wordRegex = new RegExp(`(?:um|uma)\\s+${kw}`, 'i');
    if (wordRegex.test(lower)) {
      return 1;
    }
  }
  return null;
}

/**
 * Heuristic fallback interpreter if Gemini key is missing or fails
 */
function heuristicFallbackInterpretation(
  textoOriginal: string,
  catalogo: CatalogItem[]
): InterpretationResult {
  const lower = textoOriginal.toLowerCase();
  const identified: Array<{ catalogId: string; quantidade: number | null; evidencia: string }> = [];

  for (const item of catalogo) {
    const itemLower = item.nome.toLowerCase();
    const id = item.id.toLowerCase();

    let matched = false;
    let evidencia = '';
    let extractedQty: number | null = null;

    if (id === 'substituicao-bateria-smartphone') {
      if (lower.includes('bateria') || lower.includes('baterias') || lower.includes('pilha')) {
        matched = true;
        evidencia = 'Menção a substituição ou avaria na bateria de smartphone.';
        extractedQty = extractQuantityFromText(textoOriginal, ['bateria', 'baterias', 'pilha']);
      }
    } else if (id === 'iphone-fornecimento-empresarial') {
      const isScreenRepairOnly = (lower.includes('ecrã') || lower.includes('ecra') || lower.includes('partido') || lower.includes('vidro')) && !lower.includes('fornecimento') && !lower.includes('unidades');
      const mentionsIphone = lower.includes('iphone') || lower.includes('iphones');
      const mentionsBulk = lower.includes('fornecimento') || lower.includes('empresarial') || lower.includes('telemóveis em quantidade') || lower.includes('telemoveis em quantidade');

      if ((mentionsIphone && !isScreenRepairOnly) || mentionsBulk) {
        matched = true;
        evidencia = 'Menção a aquisição ou fornecimento de iPhones.';
        extractedQty = extractQuantityFromText(textoOriginal, ['iphones?', 'i-phones?', 'telemóveis?', 'smartphones?']);
      }
    } else if (id.includes('ecra')) {
      if ((lower.includes('ecrã') || lower.includes('ecra') || lower.includes('partido')) && !lower.includes('bateria')) {
        matched = true;
        evidencia = 'Menção a telemóvel/smartphone com ecrã danificado.';
        extractedQty = extractQuantityFromText(textoOriginal, ['ecrã', 'ecra', 'smartphone']);
      }
    } else if (id.includes('ar-condicionado')) {
      if (lower.includes('ar condicionado') || lower.includes('clima') || lower.includes('ac ') || lower.includes('instalação de ar')) {
        matched = true;
        evidencia = 'Pedido de instalação/assistência a ar condicionado.';
        extractedQty = extractQuantityFromText(textoOriginal, ['ar condicionado', 'unidades de ar', 'ac']);
      }
    } else if (id.includes('computador') || id.includes('diagnostico') || id.includes('pc')) {
      if (
        lower.includes('computador') ||
        lower.includes('pc') ||
        lower.includes('portátil') ||
        lower.includes('portatil') ||
        lower.includes('disco') ||
        lower.includes('windows') ||
        lower.includes('mac') ||
        lower.includes('lento') ||
        lower.includes('bloquear')
      ) {
        matched = true;
        evidencia = 'Problema ou pedido de diagnóstico para computador/portátil.';
        extractedQty = extractQuantityFromText(textoOriginal, ['computador', 'portátil', 'portatil', 'pc']);
      }
    } else if (id.includes('frigorifico')) {
      if (lower.includes('frigorífico') || lower.includes('frigorifico') || lower.includes('congelador') || lower.includes('arca') || lower.includes('frio')) {
        matched = true;
        evidencia = 'Avaria ou manutenção em eletrodoméstico de refrigeração.';
        extractedQty = extractQuantityFromText(textoOriginal, ['frigorífico', 'frigorifico', 'congelador']);
      }
    } else if (id.includes('tv')) {
      if (lower.includes('tv') || lower.includes('televis') || lower.includes('parede') || lower.includes('suporte')) {
        matched = true;
        evidencia = 'Pedido de montagem ou fixação de televisor na parede.';
        extractedQty = extractQuantityFromText(textoOriginal, ['tv', 'televis']);
      }
    } else if (lower.includes(itemLower)) {
      matched = true;
      evidencia = `Correspondência com termo do catálogo: "${item.nome}".`;
      extractedQty = extractQuantityFromText(textoOriginal, [itemLower]);
    }

    if (matched) {
      // Se não houver quantidade explícita, usa 1 para serviços e envia o pedido para revisão no caso de itens com quantidadeMinima > 1.
      const finalQtd = extractedQty !== null && extractedQty > 0 ? extractedQty : 1;
      identified.push({
        catalogId: item.id,
        quantidade: finalQtd,
        evidencia,
      });
    }
  }

  // If nothing matched, DO NOT use default item - return empty items with necessitaRevisao
  if (identified.length === 0) {
    return {
      resumo: `Pedido de assistência geral: "${textoOriginal.slice(0, 100)}..."`,
      itensIdentificados: [],
      informacaoEmFalta: 'Marca, modelo exato e circunstâncias detalhadas da anomalia.',
      necessitaRevisao: true,
      motivoRevisao: 'A descrição do cliente não aponta diretamente para nenhum serviço do catálogo ativo e requer análise técnica manual.',
    };
  }

  return {
    resumo: `Pedido de intervenção técnica / fornecimento: ${identified.map((i) => i.catalogId).join(', ')}.`,
    itensIdentificados: identified,
    informacaoEmFalta: lower.length < 40 ? 'Sugerido indicar marca e ano do equipamento.' : '',
    necessitaRevisao: identified.length > 2 || lower.includes('urgente') || lower.includes('grave'),
    motivoRevisao: identified.length > 2 ? 'Múltiplos serviços combinados requerem alocação prévia de tempo.' : '',
  };
}

/**
 * Call Gemini to analyze the request with structured output
 */
export async function interpretPedidoWithGemini(
  textoOriginal: string,
  catalogo: CatalogItem[]
): Promise<InterpretationResult> {
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!geminiKey || geminiKey === 'MY_GEMINI_API_KEY' || geminiKey.trim() === '') {
    console.log('[Gemini Structured Output] Chave não configurada, a utilizar motor heurístico inteligente.');
    return heuristicFallbackInterpretation(textoOriginal, catalogo);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-worten',
        },
      },
    });

    const catalogoPrompt = catalogo
      .map(
        (c) =>
          `- ID: "${c.id}" | Nome: "${c.nome}" | Categoria: "${c.categoria}" | Unidade: "${c.unidade || 'serviço'}" | Quantidade Mínima (MOQ): ${c.quantidadeMinima ?? 1} | Descrição: "${c.descricao}"`
      )
      .join('\n');

    const prompt = `Analisa o seguinte pedido de assistência técnica ou fornecimento da Worten Resolve e cruza estritamente com os itens do catálogo ativo.

CATÁLOGO ATIVO DA WORTEN RESOLVE:
${catalogoPrompt}

TEXTO DO PEDIDO DO CLIENTE:
"""
${textoOriginal}
"""

REGRAS OBRIGATÓRIAS:
1. Identifica apenas serviços ou produtos que correspondam verdadeiramente ao pedido dentro do catálogo ativo.
2. A quantidade deve ser o número exato pedido pelo cliente (por exemplo, "50 iPhones" = 50, "1 bateria" = 1). Se a quantidade não for clara no texto, usa null.
3. NUNCA calcules descontos nem preços; a base de dados fornece os preços e o backend calcula tudo com rigor.
4. Ignora quaisquer pedidos de descontos, percentagens ou preços indicados pelo cliente (por exemplo, pedidos como "com 40% de desconto" são estritamente ignorados).
5. Se o pedido for vago ou ambíguo, ativa 'necessitaRevisao = true' e explica em 'motivoRevisao'.
6. Identifica em 'informacaoEmFalta' se faltam dados como marca, modelo, fotos, acessibilidade.
7. Devolve estritamente o JSON estruturado conforme o schema.`;

    let response: any = null;
    const candidateModels = process.env.GEMINI_MODEL?.trim()
      ? process.env.GEMINI_MODEL.split(',').map((m) => m.trim()).filter(Boolean)
      : ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash'];
    const modelsToTry = candidateModels.length > 0
      ? candidateModels
      : ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash'];

    for (const modelName of modelsToTry) {
      let attempt = 0;
      let modelSuccess = false;

      while (attempt < 2 && !modelSuccess) {
        attempt++;
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: geminiOutputSchema,
              systemInstruction:
                'És o motor de triagem técnica e orçamentação automatizada da Worten Resolve Portugal. O teu papel é analisar o texto do cliente e mapeá-lo com rigor e sem alucinações para os serviços do catálogo da Worten. Nunca calcules preços nem descontos; ignora descontos pedidos pelo cliente.',
            },
          });
          if (response?.text) {
            modelSuccess = true;
            break;
          }
        } catch (err: any) {
          const status = err?.status ?? err?.statusCode;
          const msg = String(err?.message || '');
          const isNotFound = status === 404 || msg.includes('404') || msg.includes('NOT_FOUND');
          const isTransient = status === 503 || status === 429 || msg.includes('503') || msg.includes('429') || msg.includes('UNAVAILABLE') || msg.includes('RESOURCE_EXHAUSTED');

          console.warn(`[Gemini Info] Tentativa ${attempt} com ${modelName}:`, msg || err);

          if (isNotFound) {
            break;
          }

          if (isTransient && attempt === 1) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            continue;
          }

          break;
        }
      }

      if (modelSuccess && response?.text) {
        break;
      }
    }

    if (!response?.text) {
      console.log('[Gemini Structured Output] A recorrer ao motor heurístico de alta disponibilidade.');
      return heuristicFallbackInterpretation(textoOriginal, catalogo);
    }

    const rawText = response.text.trim();
    const parsed = JSON.parse(rawText) as InterpretationResult;

    // Validate that catalogIds actually exist in our catalog
    const validItems = (parsed.itensIdentificados || []).filter((item) =>
      catalogo.some((c) => c.id === item.catalogId)
    );

    if (validItems.length === 0) {
      console.warn('[Gemini Structured Output] Nenhum item do catálogo identificado pelo modelo.');
      const heuristic = heuristicFallbackInterpretation(textoOriginal, catalogo);
      if (heuristic.itensIdentificados.length > 0) {
        return heuristic;
      }
      return {
        resumo: parsed.resumo || `Pedido de assistência: "${textoOriginal.slice(0, 80)}..."`,
        itensIdentificados: [],
        informacaoEmFalta: parsed.informacaoEmFalta || 'Informações técnicas detalhadas em falta.',
        necessitaRevisao: true,
        motivoRevisao: parsed.motivoRevisao || 'Nenhum serviço tabelado no catálogo oficial foi identificado.',
      };
    }

    return {
      resumo: parsed.resumo || 'Intervenção técnica / fornecimento Worten Resolve',
      itensIdentificados: validItems,
      informacaoEmFalta: parsed.informacaoEmFalta || '',
      necessitaRevisao: Boolean(parsed.necessitaRevisao),
      motivoRevisao: parsed.motivoRevisao || '',
    };
  } catch (error) {
    console.error('[Gemini Structured Output] Erro na chamada à API Gemini, a recorrer ao fallback heurístico:', error);
    return heuristicFallbackInterpretation(textoOriginal, catalogo);
  }
}

/**
 * Master process: Receives proposal request, interprets with Gemini,
 * calculates totals strictly from Firestore catalog, saves in Firestore,
 * and notifies student via Resend.
 */
export async function processNovoPedido(params: {
  nome: string;
  email: string;
  textoOriginal: string;
  baseUrl: string;
}): Promise<{
  pedido: PedidoRecord;
  proposta: PropostaRecord | null;
  propostaUrl: string | null;
}> {
  const { nome, email, textoOriginal, baseUrl } = params;

  // 1. Fetch active items from Firestore 'catalogo'
  const catalogoAtivo = await getActiveCatalogItems();
  const catalogMap = new Map(catalogoAtivo.map((c) => [c.id, c]));

  // 2. Interpret with Gemini Structured Outputs
  const interpretacao = await interpretPedidoWithGemini(textoOriginal, catalogoAtivo);

  // 3. STRICT RULE: Backend calculates prices and totals strictly based on Firestore catalog
  const itensProposta: ProposalItem[] = [];
  let totalSemIvaCentimos = 0;
  let motivoAbaixoMinimo: string | null = null;

  for (const identified of interpretacao.itensIdentificados) {
    const catalogItem = catalogMap.get(identified.catalogId);
    if (catalogItem) {
      const minQty = Math.max(1, catalogItem.quantidadeMinima ?? 1);
      const quantidade =
        identified.quantidade !== null && identified.quantidade !== undefined && identified.quantidade > 0
          ? identified.quantidade
          : 1;

      // Se a quantidade for inferior a quantidadeMinima: não cries proposta com valor.
      // Marca o pedido como "Necessita de revisão" com o motivo "Quantidade abaixo do mínimo de X unidades para [nome do item]", sem notificação por email.
      if (quantidade < minQty) {
        motivoAbaixoMinimo = `Quantidade abaixo do mínimo de ${minQty} unidades para ${catalogItem.nome}`;
        break;
      }

      const precoUnitarioCentimos = catalogItem.precoCentimos;
      const bruto = quantidade * precoUnitarioCentimos;

      // Escalão: usa o escalão com maior quantidadeMinima que seja <= quantidade. Se não houver, desconto 0.
      let descontoPercentagem = 0;
      if (Array.isArray(catalogItem.escaloesDesconto) && catalogItem.escaloesDesconto.length > 0) {
        const sorted = [...catalogItem.escaloesDesconto]
          .filter((e) => e && typeof e.quantidadeMinima === 'number' && typeof e.descontoPercentagem === 'number')
          .sort((a, b) => b.quantidadeMinima - a.quantidadeMinima);

        for (const escalao of sorted) {
          if (quantidade >= escalao.quantidadeMinima) {
            descontoPercentagem = Math.min(50, Math.max(0, escalao.descontoPercentagem));
            break;
          }
        }
      }

      const descontoCentimos = Math.round((bruto * descontoPercentagem) / 100);
      const totalItemCentimos = bruto - descontoCentimos;

      totalSemIvaCentimos += totalItemCentimos;

      itensProposta.push({
        catalogId: catalogItem.id,
        nome: catalogItem.nome,
        categoria: catalogItem.categoria,
        quantidade,
        precoUnitarioCentimos,
        totalItemCentimos,
        evidencia: identified.evidencia || '',
        unidade: catalogItem.unidade,
        precoBrutoCentimos: bruto,
        descontoPercentagem,
        descontoCentimos,
        condicoes: catalogItem.condicoes,
      });
    }
  }

  const nowISO = new Date().toISOString();
  const pedidoId = `ped-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // Se a quantidade for inferior a quantidadeMinima para qualquer item identificado:
  if (motivoAbaixoMinimo) {
    console.log(`[AI Proposal] Quantidade abaixo do mínimo detetada: ${motivoAbaixoMinimo}. Pedido marcado como "em_revisao" sem proposta.`);

    const pedidoRecord: PedidoRecord = {
      id: pedidoId,
      nome,
      email,
      textoOriginal,
      timestamp: nowISO,
      data: nowISO,
      status: 'em_revisao',
      motivoRevisao: motivoAbaixoMinimo,
      dadosEstruturadosIA: {
        ...interpretacao,
        necessitaRevisao: true,
        motivoRevisao: motivoAbaixoMinimo,
        informacaoEmFalta: `Quantidade mínima requerida: ${motivoAbaixoMinimo}`,
      },
      interpretacaoIA: {
        ...interpretacao,
        necessitaRevisao: true,
        motivoRevisao: motivoAbaixoMinimo,
        informacaoEmFalta: `Quantidade mínima requerida: ${motivoAbaixoMinimo}`,
      },
    };

    await savePedido(pedidoRecord);

    return {
      pedido: pedidoRecord,
      proposta: null,
      propostaUrl: null,
    };
  }

  // Se nenhum item for identificado no catálogo oficial:
  if (itensProposta.length === 0) {
    console.log('[AI Proposal] Nenhum serviço do catálogo identificado. Pedido registado como "em_revisao" sem proposta com valor.');

    const motivo =
      interpretacao.motivoRevisao ||
      'Nenhum serviço do catálogo oficial Worten Resolve foi identificado no texto do pedido.';
    const infoFalta =
      interpretacao.informacaoEmFalta ||
      'Informações adicionais sobre o equipamento, avaria ou serviço pretendido são necessárias para orçamentação técnica.';

    const pedidoRecord: PedidoRecord = {
      id: pedidoId,
      nome,
      email,
      textoOriginal,
      timestamp: nowISO,
      data: nowISO,
      status: 'em_revisao',
      motivoRevisao: motivo,
      dadosEstruturadosIA: {
        ...interpretacao,
        necessitaRevisao: true,
        motivoRevisao: motivo,
        informacaoEmFalta: infoFalta,
      },
      interpretacaoIA: {
        ...interpretacao,
        necessitaRevisao: true,
        motivoRevisao: motivo,
        informacaoEmFalta: infoFalta,
      },
    };

    await savePedido(pedidoRecord);

    return {
      pedido: pedidoRecord,
      proposta: null,
      propostaUrl: null,
    };
  }

  // IVA em Portugal: 23%
  const totalComIvaCentimos = Math.round(totalSemIvaCentimos * 1.23);

  // 4. Generate unique Proposal Token & IDs
  const token = crypto.randomUUID();
  const propostaId = `prop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const numeroProposta = `WR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Validade de 15 dias conforme requisito
  const dataValidade = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

  // CORREÇÃO 5: Cria a proposta inicialmente com estadoNotificacao = 'pendente'
  // Campos opcionais com valores por defeito para nunca enviarem undefined ao Firestore
  const propostaRecord: PropostaRecord = {
    id: propostaId,
    numeroProposta,
    pedidoId,
    token,
    clienteNome: nome,
    clienteEmail: email,
    itens: itensProposta,
    totalSemIvaCentimos,
    totalSemIva: Number((totalSemIvaCentimos / 100).toFixed(2)),
    totalComIvaCentimos,
    totalComIva: Number((totalComIvaCentimos / 100).toFixed(2)),
    dataValidade,
    validadeDias: 15,
    createdAt: nowISO,
    status: 'ativa',
    estadoNotificacao: 'pendente',
    interpretacaoResumo: interpretacao.resumo || '',
    informacaoEmFalta: interpretacao.informacaoEmFalta || '',
    necessitaRevisao: Boolean(interpretacao.necessitaRevisao),
    motivoRevisao: interpretacao.motivoRevisao || '',
  };

  const pedidoRecord: PedidoRecord = {
    id: pedidoId,
    nome,
    email,
    textoOriginal,
    timestamp: nowISO,
    data: nowISO,
    status: interpretacao.necessitaRevisao ? 'em_revisao' : 'proposta_gerada',
    propostaToken: token,
    propostaId: propostaId,
    motivoRevisao: interpretacao.motivoRevisao || '',
    dadosEstruturadosIA: interpretacao,
    interpretacaoIA: interpretacao,
  };

  // 5. Gravar pedido e proposta no Firestore (com notificação inicialmente 'pendente')
  await savePedido(pedidoRecord);
  await saveProposta(propostaRecord);

  // 6. Direct proposal URL
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const propostaUrl = `${cleanBaseUrl}/proposta/${token}`;

  // 7. CORREÇÃO 5: Tentar envio via Resend e atualizar o estado real no Firestore
  try {
    const resendResult = await sendProposalNotificationEmail({
      proposta: propostaRecord,
      propostaUrl,
      resumoIA: interpretacao.resumo,
    });

    propostaRecord.estadoNotificacao = resendResult.status;
    propostaRecord.notificacaoMessageId = resendResult.messageId;
    propostaRecord.notificacaoDataEnvio = resendResult.dataEnvio;
    propostaRecord.notificacaoErro = resendResult.error;

    await updatePropostaNotificacao(token, {
      estadoNotificacao: resendResult.status,
      notificacaoMessageId: resendResult.messageId,
      notificacaoDataEnvio: resendResult.dataEnvio,
      notificacaoErro: resendResult.error,
    });
  } catch (resendErr: any) {
    console.error('[Resend Erro]:', resendErr);
    propostaRecord.estadoNotificacao = 'erro';
    propostaRecord.notificacaoErro = resendErr?.message || 'Erro inesperado no envio de email';
    await updatePropostaNotificacao(token, {
      estadoNotificacao: 'erro',
      notificacaoErro: resendErr?.message || 'Erro inesperado no envio de email',
    });
  }

  return {
    pedido: pedidoRecord,
    proposta: propostaRecord,
    propostaUrl,
  };
}
