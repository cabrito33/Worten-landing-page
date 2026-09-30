import { GoogleGenAI, Type } from '@google/genai';
import crypto from 'crypto';
import {
  getActiveCatalogItems,
  savePedido,
  saveProposta,
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
    quantidade: number;
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
      description: 'Lista de serviços do catálogo correspondentes ao pedido.',
      items: {
        type: Type.OBJECT,
        properties: {
          catalogId: {
            type: Type.STRING,
            description: 'O ID exato do item conforme listado no catálogo fornecido.',
          },
          quantidade: {
            type: Type.INTEGER,
            description: 'Quantidade necessária do serviço (pelo menos 1).',
          },
          evidencia: {
            type: Type.STRING,
            description: 'Frase ou excerto do pedido do cliente que justifica a escolha deste serviço.',
          },
        },
        required: ['catalogId', 'quantidade', 'evidencia'],
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
 * Heuristic fallback interpreter if Gemini key is missing or fails
 */
function heuristicFallbackInterpretation(
  textoOriginal: string,
  catalogo: CatalogItem[]
): InterpretationResult {
  const lower = textoOriginal.toLowerCase();
  const identified: Array<{ catalogId: string; quantidade: number; evidencia: string }> = [];

  for (const item of catalogo) {
    const itemLower = item.nome.toLowerCase();
    const id = item.id.toLowerCase();

    let matched = false;
    let evidencia = '';

    if (id.includes('ecra') && (lower.includes('ecrã') || lower.includes('ecra') || lower.includes('partido') || lower.includes('smartphone') || lower.includes('telemovel') || lower.includes('iphone'))) {
      matched = true;
      evidencia = 'Menção a telemóvel/smartphone com ecrã danificado.';
    } else if (id.includes('ar-condicionado') && (lower.includes('ar condicionado') || lower.includes('clima') || lower.includes('ac ') || lower.includes('instalação de ar'))) {
      matched = true;
      evidencia = 'Pedido de instalação/assistência a ar condicionado.';
    } else if (
      (id.includes('computador') || id.includes('diagnostico') || id.includes('pc')) &&
      (lower.includes('computador') ||
        lower.includes('pc') ||
        lower.includes('portátil') ||
        lower.includes('portatil') ||
        lower.includes('disco') ||
        lower.includes('windows') ||
        lower.includes('mac') ||
        lower.includes('lento') ||
        lower.includes('bloquear'))
    ) {
      matched = true;
      evidencia = 'Problema ou pedido de diagnóstico para computador/portátil.';
    } else if (id.includes('frigorifico') && (lower.includes('frigorífico') || lower.includes('frigorifico') || lower.includes('congelador') || lower.includes('arca') || lower.includes('frio'))) {
      matched = true;
      evidencia = 'Avaria ou manutenção em eletrodoméstico de refrigeração.';
    } else if (id.includes('tv') && (lower.includes('tv') || lower.includes('televis') || lower.includes('parede') || lower.includes('suporte'))) {
      matched = true;
      evidencia = 'Pedido de montagem ou fixação de televisor na parede.';
    } else if (lower.includes(itemLower)) {
      matched = true;
      evidencia = `Correspondência com termo do catálogo: "${item.nome}".`;
    }

    if (matched) {
      identified.push({
        catalogId: item.id,
        quantidade: 1,
        evidencia,
      });
    }
  }

  // If nothing matched, use general diagnostic
  if (identified.length === 0) {
    const defaultItem =
      catalogo.find(
        (i) =>
          i.id === 'diagnostico-portatil' ||
          i.id === 'diagnostico-pc' ||
          i.id === 'diagnostico-computador'
      ) || catalogo[0];
    if (defaultItem) {
      identified.push({
        catalogId: defaultItem.id,
        quantidade: 1,
        evidencia: 'Enquadramento inicial preventivo para análise técnica em bancada.',
      });
    }
    return {
      resumo: `Pedido de assistência geral: "${textoOriginal.slice(0, 100)}..."`,
      itensIdentificados: identified,
      informacaoEmFalta: 'Marca, modelo exato e circunstâncias detalhadas da anomalia.',
      necessitaRevisao: true,
      motivoRevisao: 'A descrição do cliente não aponta diretamente para um serviço pré-tabelado e requer validação de um técnico sénior.',
    };
  }

  return {
    resumo: `Pedido de intervenção técnica: ${identified.map((i) => i.catalogId).join(', ')}.`,
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
          `- ID: "${c.id}" | Nome: "${c.nome}" | Categoria: "${c.categoria}" | Descrição: "${c.descricao}"`
      )
      .join('\n');

    const prompt = `Analisa o seguinte pedido de assistência técnica de um cliente da Worten Resolve e cruza estritamente com os serviços do catálogo ativo.

CATÁLOGO ATIVO DA WORTEN RESOLVE:
${catalogoPrompt}

TEXTO DO PEDIDO DO CLIENTE:
"""
${textoOriginal}
"""

REGRAS OBRIGATÓRIAS:
1. Identifica apenas serviços que correspondam verdadeiramente ao pedido dentro do catálogo ativo.
2. Não inventes itens nem preços. Apenas retorna os catalogIds correspondentes, as quantidades lógicas e a evidência textual.
3. Se o pedido for vago ou ambíguo, ativa 'necessitaRevisao = true' e explica em 'motivoRevisao'.
4. Identifica em 'informacaoEmFalta' se faltam dados como marca, modelo, fotos, acessibilidade.
5. Devolve estritamente o JSON estruturado conforme o schema.`;

    let response: any = null;
    const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest'];

    for (const modelName of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: geminiOutputSchema,
            systemInstruction:
              'És o motor de triagem técnica e orçamentação automatizada da Worten Resolve Portugal. O teu papel é analisar o texto do cliente e mapeá-lo com rigor e sem alucinações para os serviços do catálogo da Worten.',
          },
        });
        if (response?.text) break;
      } catch (err: any) {
        console.warn(`[Gemini Info] Tentativa com ${modelName}:`, err?.message || err);
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
      console.warn('[Gemini Structured Output] Nenhum item válido encontrado no output da IA, a aplicar heurística.');
      return heuristicFallbackInterpretation(textoOriginal, catalogo);
    }

    return {
      resumo: parsed.resumo || 'Intervenção técnica Worten Resolve',
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
  proposta: PropostaRecord;
  propostaUrl: string;
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

  for (const identified of interpretacao.itensIdentificados) {
    const catalogItem = catalogMap.get(identified.catalogId);
    if (catalogItem) {
      const quantidade = Math.max(1, identified.quantidade || 1);
      const precoUnitarioCentimos = catalogItem.precoCentimos;
      const totalItemCentimos = precoUnitarioCentimos * quantidade;

      totalSemIvaCentimos += totalItemCentimos;

      itensProposta.push({
        catalogId: catalogItem.id,
        nome: catalogItem.nome,
        categoria: catalogItem.categoria,
        quantidade,
        precoUnitarioCentimos,
        totalItemCentimos,
        evidencia: identified.evidencia,
      });
    }
  }

  // If no items could be mapped, fallback to first catalog item
  if (itensProposta.length === 0 && catalogoAtivo.length > 0) {
    const fallbackItem = catalogoAtivo[0];
    const precoUnitarioCentimos = fallbackItem.precoCentimos;
    totalSemIvaCentimos = precoUnitarioCentimos;
    itensProposta.push({
      catalogId: fallbackItem.id,
      nome: fallbackItem.nome,
      categoria: fallbackItem.categoria,
      quantidade: 1,
      precoUnitarioCentimos,
      totalItemCentimos: precoUnitarioCentimos,
      evidencia: 'Serviço base recomendado para triagem.',
    });
  }

  // IVA em Portugal: 23%
  const totalComIvaCentimos = Math.round(totalSemIvaCentimos * 1.23);

  // 4. Generate unique Proposal Token & IDs
  const token = crypto.randomUUID();
  const pedidoId = `ped-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const propostaId = `prop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const numeroProposta = `WR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Validade de 15 dias conforme requisito 2.c
  const dataValidade = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
  const nowISO = new Date().toISOString();

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
    estadoNotificacao: 'modo_aula_aluno_notificado',
    interpretacaoResumo: interpretacao.resumo,
    informacaoEmFalta: interpretacao.informacaoEmFalta,
    necessitaRevisao: interpretacao.necessitaRevisao,
    motivoRevisao: interpretacao.motivoRevisao,
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

  // 5. Save in Firestore ('pedidos' e 'propostas')
  await savePedido(pedidoRecord);
  await saveProposta(propostaRecord);

  // 6. Direct proposal URL
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const propostaUrl = `${cleanBaseUrl}/proposta/${token}`;

  // 7. Send notification via Resend (strictly internal to student EMAIL_ALUNO; client is NOT emailed)
  await sendProposalNotificationEmail({
    proposta: propostaRecord,
    propostaUrl,
    resumoIA: interpretacao.resumo,
  });

  return {
    pedido: pedidoRecord,
    proposta: propostaRecord,
    propostaUrl,
  };
}
