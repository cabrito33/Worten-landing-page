import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  seedCatalogIfEmpty,
  getActiveCatalogItems,
  getAllCatalogItems,
  getPropostaByToken,
  getAllPedidos,
  getAllPropostas,
  updateCatalogItem,
  adminAuth,
  CatalogItem,
} from './src/server/firebaseAdmin.ts';
import { processNovoPedido } from './src/server/aiProposalService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Immediate healthcheck for Google Cloud Run probes
app.get('/healthz', (_req, res) => res.status(200).send('OK'));
app.get('/health', (_req, res) => res.status(200).send('OK'));

// In-memory bookings store
export interface StoredBooking {
  id: string;
  name: string;
  email: string;
  startTime: string;
  notes: string;
  phone?: string;
  createdAt: string;
  calBooking?: Record<string, unknown> | null;
  calError?: string | null;
  calendarPayload: Record<string, unknown>;
}

const bookingsStore: StoredBooking[] = [];

// Gemini GenAI Client Initialization (safe against missing or undefined env vars)
let ai: GoogleGenAI | null = null;
try {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey !== 'MY_GEMINI_API_KEY' && geminiKey.trim() !== '') {
    ai = new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
} catch (aiInitError) {
  console.warn('[Gemini AI] Initialization warning (fallback chatbot will be active):', aiInitError);
  ai = null;
}

// Function Declaration for create_booking (receives name, email, startTime, notes)
const createBookingDeclaration = {
  name: 'create_booking',
  description:
    'Regista e agenda uma reunião ou visita técnica da equipa Worten Resolve enviando o agendamento diretamente para a API do Cal.com (v2). OBRIGATÓRIO acionar esta ferramenta assim que tiveres todos os dados necessários (name, email, startTime e notes). A data e hora (startTime) DEVE ser estritamente no FUTURO com um mínimo de 2 horas a contar da hora atual do sistema, ou no dia útil seguinte, em dias úteis (2ª a 6ª feira) entre as 09:00 e as 19:00 (fuso horário Europe/Lisbon). NUNCA inventes confirmação de texto sem acionar esta função.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: 'Nome completo do cliente.',
      },
      email: {
        type: Type.STRING,
        description: 'Email de contacto válido do cliente para confirmação e envio dos detalhes.',
      },
      startTime: {
        type: Type.STRING,
        description:
          'Data e hora de início no formato ISO 8601 (ex: "2026-09-29T10:00:00Z"). OBRIGATÓRIO ser uma data e hora no FUTURO com pelo menos 2 horas a contar da hora atual do sistema, ou no dia útil seguinte, em dias úteis (2ª a 6ª feira) entre as 09:00 e as 19:00 (fuso horário Europe/Lisbon). NUNCA fornecer uma data/hora no passado para evitar o erro "Attempting to book a meeting in the past" da API do Cal.com.',
      },
      notes: {
        type: Type.STRING,
        description:
          'Notas ou motivo detalhado do serviço, avaria, instalação ou assistência técnica Worten Resolve.',
      },
    },
    required: ['name', 'email', 'startTime', 'notes'],
  },
};

/**
 * Returns a guaranteed valid ISO 8601 future slot (minimum 2 hours ahead of now),
 * falling on a weekday (Monday-Friday) between 09:00 and 19:00 (Europe/Lisbon).
 */
export function ensureFutureSlot(requestedStartTime?: string): string {
  const now = new Date();
  // Buffer: at least 2 hours from current system time
  const minAllowedTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  let targetDate = new Date(minAllowedTime.getTime());

  if (requestedStartTime) {
    try {
      const parsed = new Date(requestedStartTime);
      if (!isNaN(parsed.getTime())) {
        if (parsed.getTime() >= minAllowedTime.getTime()) {
          targetDate = parsed;
        }
      }
    } catch {
      // keep targetDate as minAllowedTime
    }
  }

  // Adjust for business days: Monday (1) to Friday (5)
  // Sunday is 0, Saturday is 6
  const currentDay = targetDate.getUTCDay();
  if (currentDay === 6) {
    // Saturday -> jump to Monday (+2 days)
    targetDate.setUTCDate(targetDate.getUTCDate() + 2);
    targetDate.setUTCHours(10, 0, 0, 0);
  } else if (currentDay === 0) {
    // Sunday -> jump to Monday (+1 day)
    targetDate.setUTCDate(targetDate.getUTCDate() + 1);
    targetDate.setUTCHours(10, 0, 0, 0);
  }

  // Business hours: 09:00 to 19:00 Lisbon time
  const currentHours = targetDate.getUTCHours();
  if (currentHours < 9) {
    targetDate.setUTCHours(10, 0, 0, 0);
  } else if (currentHours >= 18) {
    // Past 18:00 UTC / 19:00 Lisbon -> schedule for next business day at 10:00
    targetDate.setUTCDate(targetDate.getUTCDate() + 1);
    targetDate.setUTCHours(10, 0, 0, 0);
    if (targetDate.getUTCDay() === 6) {
      targetDate.setUTCDate(targetDate.getUTCDate() + 2);
    } else if (targetDate.getUTCDay() === 0) {
      targetDate.setUTCDate(targetDate.getUTCDate() + 1);
    }
  }

  // Final check: must be strictly in the future (minimum 2 hours)
  if (targetDate.getTime() < minAllowedTime.getTime()) {
    targetDate = new Date(minAllowedTime.getTime() + 30 * 60 * 1000);
  }

  return targetDate.toISOString();
}

function getLisbonCurrentTimeString(): string {
  try {
    return new Intl.DateTimeFormat('pt-PT', {
      timeZone: 'Europe/Lisbon',
      dateStyle: 'full',
      timeStyle: 'medium',
    }).format(new Date());
  } catch {
    return new Date().toISOString();
  }
}

export function buildWortenSystemInstruction(): string {
  const lisbonNow = getLisbonCurrentTimeString();
  const minFutureDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const minFutureISO = minFutureDate.toISOString();
  const recommendedSlotISO = ensureFutureSlot();

  return `És o assistente virtual oficial da Worten Portugal (Worten Resolve).
Tratas o cliente sempre por "tu" de forma ágil, empática e amigável.
Respondes com clareza e precisão a dúvidas comuns:
- Entregas grátis em compras superiores a 35€ em pequenos formatos expedidos pela Worten (Click & Collect sempre grátis em qualquer loja física).
- Devoluções em 30 dias em loja física ou com recolha ao domicílio (artigos na embalagem original, com todos os acessórios e respetiva fatura).
- Reparações e assistência técnica Worten Resolve (substituição de ecrãs e baterias na hora para smartphones, reparação ao domicílio de grandes eletrodomésticos, manutenção, limpeza e upgrade de computadores).

HORÁRIO E DATA ATUAL DO SISTEMA:
- Momento atual em Portugal (Europe/Lisbon): ${lisbonNow}
- Próximo horário útil elegível para agendamento: ${recommendedSlotISO}

REGRA CRÍTICA DE AGENDAMENTO NO FUTURO (EVITAR ERRO "Attempting to book a meeting in the past"):
1. QUALQUER AGENDAMENTO DEVE SER SEMPRE FEITO PARA UMA DATA E HORA NO FUTURO (nunca no passado ou na hora atual).
2. O horário de início ('startTime') DEVE ter OBRIGATORIAMENTE um MÍNIMO DE 2 HORAS a contar da hora atual do sistema (nunca antes de ${minFutureISO}), ou ser agendado para o DIA ÚTIL SEGUINTE caso já estejamos no fim da tarde ou fora de horas.
3. Os agendamentos ocorrem exclusivamente em DIAS ÚTEIS (segunda a sexta-feira) entre as 09:00 e as 19:00 (fuso horário Europe/Lisbon).
4. Se o utilizador sugerir uma data/hora no passado, no próprio momento ou com menos de 2 horas de antecedência, ou num fim de semana / fora do horário útil, DEVES esclarecer amigavelmente e sugerir proativamente a data e hora no FUTURO válida mais próxima (ex: daqui a 2 horas ou às 10:00 do dia útil seguinte como "${recommendedSlotISO}").
5. NUNCA aciones a ferramenta 'create_booking' com datas passadas ou com menos de 2 horas de antecedência. Isso evita categoricamente que a API do Cal.com devolva o erro "Attempting to book a meeting in the past".

QUANDO O UTILIZADOR QUISER AGENDAR UMA REUNIÃO OU VISITA TÉCNICA:
1. Pede o nome completo ('name'), o email de contacto ('email') e as notas ou motivo do serviço ('notes').
2. Pede a data e hora pretendida ('startTime', convertida para formato ISO 8601 ex: "${recommendedSlotISO}"), garantindo que cumpre a regra do FUTURO (mínimo 2 horas a contar da hora atual ou no dia útil seguinte, dias úteis 09:00 às 19:00).
3. Assim que tiveres todos os dados (name, email, startTime, notes), NÃO inventes uma confirmação de texto. Deves OBRIGATORIAMENTE acionar a ferramenta 'create_booking'.`;
}

const WORTEN_SYSTEM_INSTRUCTION = buildWortenSystemInstruction();

// Cal.com v2 API Integration Helper
export interface CalBookingParams {
  name: string;
  email: string;
  startTime: string;
  notes: string;
}

export interface CalBookingResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  errorReason?: string;
  userAdvice?: string;
  statusCode?: number;
}

/**
 * Translates Cal.com error codes/messages into user-friendly explanations and actionable advice in Portuguese.
 */
export function explainBookingError(errorMsg?: string, resJson?: any): { reason: string; userAdvice: string } {
  const raw = `${errorMsg || ''} ${JSON.stringify(resJson || {})}`.toLowerCase();

  // 1. Minimum notice / too soon
  if (raw.includes('minimum booking notice') || raw.includes('too soon')) {
    return {
      reason: 'A hora indicada não cumpre a antecedência mínima necessária para este tipo de assistência técnica (aviso prévio obrigatório).',
      userAdvice: 'Sugestão: Por favor escolhe um horário com maior antecedência (com pelo menos 2 a 4 horas de margem) ou agenda para o dia útil seguinte.',
    };
  }

  // 2. Conflict: slot already booked or host not available
  if (
    raw.includes('conflict') ||
    raw.includes('already has booking') ||
    raw.includes('not available') ||
    raw.includes('slot is unavailable') ||
    raw.includes('busy') ||
    raw.includes('overlapping')
  ) {
    return {
      reason: 'O horário selecionado já se encontra ocupado por outra marcação na agenda do técnico.',
      userAdvice: 'Sugestão: Escolhe outro horário (por exemplo, 30 minutos ou 1 hora mais tarde) ou noutro dia útil entre as 09:00 e as 19:00.',
    };
  }

  // 3. Past date or buffer requirement
  if (raw.includes('past') || raw.includes('attempting to book a meeting in the past')) {
    return {
      reason: 'A data e hora indicadas são no passado ou não cumprem o tempo mínimo de antecedência de 2 horas.',
      userAdvice: 'Sugestão: Os agendamentos devem ser marcados com pelo menos 2 horas a contar da hora atual do sistema ou para o próximo dia útil.',
    };
  }

  // 4. Outside scheduling window (too far)
  if (raw.includes('scheduling window') || raw.includes('too far in the future')) {
    return {
      reason: 'A data escolhida ultrapassa a janela de agendamento autorizada (demasiado distante no futuro).',
      userAdvice: 'Sugestão: Por favor escolhe uma data mais próxima nos próximos 14 a 30 dias úteis.',
    };
  }

  // 5. Weekend or outside working hours
  if (
    raw.includes('outside working') ||
    raw.includes('working_hours') ||
    raw.includes('weekend') ||
    raw.includes('fim de semana')
  ) {
    return {
      reason: 'A data ou hora solicitada recai num fim de semana ou fora do horário de expediente da equipa Worten Resolve.',
      userAdvice: 'Sugestão: As marcações presenciais e virtuais realizam-se em dias úteis (2ª a 6ª feira) entre as 09:00 e as 19:00.',
    };
  }

  // 6. Invalid email or attendee format
  if (raw.includes('email') || raw.includes('attendee') || raw.includes('invalid_string')) {
    return {
      reason: 'O endereço de email fornecido parece ser inválido ou incompleto.',
      userAdvice: 'Sugestão: Por favor confirma o teu email de contacto (ex: utilizador@dominio.com) para receberes os detalhes da confirmação.',
    };
  }

  // 7. Rate limit
  if (raw.includes('rate_limit') || raw.includes('too many') || raw.includes('429')) {
    return {
      reason: 'O serviço de agendamentos atingiu momentaneamente o limite de pedidos simultâneos.',
      userAdvice: 'Sugestão: Aguarda alguns segundos e tenta novamente ou contacta diretamente a loja.',
    };
  }

  // 8. Fallback / generic API error
  return {
    reason: errorMsg && errorMsg.trim() ? `A API do Cal.com reportou: "${errorMsg}".` : 'Não foi possível confirmar a disponibilidade da vaga na agenda neste momento.',
    userAdvice: 'Sugestão: Podes tentar um horário diferente em dias úteis (09:00 às 19:00) ou contactar a equipa Worten Resolve.',
  };
}

async function sendBookingToCalCom(params: CalBookingParams): Promise<CalBookingResult> {
  try {
    const isoStartTime = ensureFutureSlot(params.startTime);

    const payload = {
      start: isoStartTime,
      eventTypeId: 7177694, // Reunião de 30 min (Worten Resolve)
      attendee: {
        name: params.name,
        email: params.email,
        timeZone: 'Europe/Lisbon',
      },
      metadata: {
        notes: params.notes,
        source: 'Assistente Virtual Worten.pt (Worten Resolve)',
      },
    };

    const apiKey = process.env.CAL_API_KEY?.trim();
    if (!apiKey) {
      console.warn('[Cal.com v2] CAL_API_KEY não configurada nas variáveis de ambiente.');
      return {
        success: false,
        error: 'CAL_API_KEY não configurada',
        errorReason: 'A integração com o Cal.com requer a chave CAL_API_KEY configurada nas variáveis de ambiente.',
        userAdvice: 'Por favor, configura a variável CAL_API_KEY no painel de Secrets.',
        statusCode: 503,
      };
    }

    console.log('[Cal.com v2] Enviando agendamento para https://api.cal.com/v2/bookings...', {
      start: payload.start,
      name: params.name,
      email: params.email,
    });

    const response = await fetch('https://api.cal.com/v2/bookings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'cal-api-version': '2024-08-13',
      },
      body: JSON.stringify(payload),
    });

    const resJson = (await response.json()) as any;

    if (!response.ok || resJson.status === 'error') {
      const detailsMsg =
        resJson?.error?.details?.message ||
        (typeof resJson?.error?.details === 'string' ? resJson?.error?.details : undefined);
      const rawErrorMsg =
        detailsMsg ||
        resJson?.error?.message ||
        resJson?.message ||
        `Erro Cal.com (HTTP ${response.status})`;

      const { reason, userAdvice } = explainBookingError(rawErrorMsg, resJson);

      console.warn('[Cal.com v2] Resposta com erro:', rawErrorMsg, resJson);
      return {
        success: false,
        error: rawErrorMsg,
        errorReason: reason,
        userAdvice,
        statusCode: response.status,
        data: resJson,
      };
    }

    console.log('[Cal.com v2] Agendamento criado com sucesso! UID:', resJson?.data?.uid);
    return {
      success: true,
      data: resJson.data || resJson,
      statusCode: response.status,
    };
  } catch (err: any) {
    console.error('[Cal.com v2] Exceção ao comunicar com Cal.com:', err);
    const { reason, userAdvice } = explainBookingError(err?.message);
    return {
      success: false,
      error: err?.message || 'Falha ao contactar a API do Cal.com',
      errorReason: reason,
      userAdvice,
    };
  }
}

// Helper to generate Google Calendar event payload
function generateCalendarEventPayload(data: {
  name: string;
  email: string;
  notes: string;
  startTime: string;
  phone?: string;
}) {
  const safeFutureISO = ensureFutureSlot(data.startTime);
  const parsed = new Date(safeFutureISO);
  const startDate = parsed.toISOString().slice(0, 10);
  const hours = parsed.getHours();
  const minutes = parsed.getMinutes();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const startTimeFormatted = `${pad(hours)}:${pad(minutes)}`;
  const endFormatted = `${pad(hours + 1)}:${pad(minutes)}`;
  const startISO = parsed.toISOString();
  const endD = new Date(parsed.getTime() + 30 * 60000);
  const endISO = endD.toISOString();

  return {
    action: 'create_calendar_event',
    calendar_id: 'primary',
    event_details: {
      summary: `Worten Resolve: ${data.notes} - ${data.name}`,
      description: `Agendamento oficial de assistência técnica Worten Resolve (Sincronizado via Cal.com v2).\n\n` +
        `• Cliente: ${data.name}\n` +
        `• Email: ${data.email}\n` +
        `• Contacto telefónico: ${data.phone || 'Não indicado'}\n` +
        `• Motivo / Notas: ${data.notes}\n` +
        `• Data e Hora de Início: ${data.startTime}\n` +
        `• Origem: Assistente Virtual Worten.pt`,
      start: {
        dateTime: startISO,
        timeZone: 'Europe/Lisbon',
      },
      end: {
        dateTime: endISO,
        timeZone: 'Europe/Lisbon',
      },
      attendees: [
        { email: data.email },
        { email: 'resolve@worten.pt' },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 1440 },
          { method: 'popup', minutes: 60 },
        ],
      },
    },
  };
}

// Fallback logic in case GEMINI_API_KEY is not configured or network error occurs
async function handleFallbackBot(userMessage: string, history: Array<{ role: string; text: string }>) {
  const q = userMessage.toLowerCase();

  // Check if user is asking about shipping
  if (q.includes('porte') || q.includes('entrega') || q.includes('envio') || q.includes('grátis') || q.includes('gratis')) {
    return {
      text: 'Na Worten tens **portes grátis** para encomendas superiores a **35€** em artigos de pequenos formatos expedidos pela Worten! Além disso, o levantamento em loja física (**Click & Collect**) é sempre **100% gratuito** em qualquer loja de Portugal Continental e Ilhas.\n\nPrecisas de apoio com mais alguma questão ou queres agendar algum serviço?',
      bookingCreated: false,
    };
  }

  // Check if user is asking about returns
  if (q.includes('devol') || q.includes('troca') || q.includes('reembols') || q.includes('14 dias') || q.includes('30 dias') || q.includes('desistir')) {
    return {
      text: 'Podes devolver qualquer artigo no prazo de **30 dias** a contar da entrega, tanto diretamente em qualquer uma das nossas lojas físicas Worten como solicitando recolha ao domicílio na tua área de cliente online.\n\nO produto apenas precisa de estar completo, na embalagem original, com todos os manuais/acessórios e com a fatura de compra.',
      bookingCreated: false,
    };
  }

  // Check if user is asking about Worten Resolve in general
  if ((q.includes('repara') || q.includes('resolve') || q.includes('ecrã') || q.includes('bateria') || q.includes('arranja')) && !q.includes('agendar') && !q.includes('@')) {
    return {
      text: 'A **Worten Resolve** disponibiliza assistência técnica especializada para telemóveis, computadores e eletrodomésticos:\n• Substituição de ecrãs e baterias na hora para smartphones;\n• Reparação e diagnóstico de grandes eletrodomésticos ao domicílio;\n• Manutenção, limpeza e reparação de portáteis e computadores.\n\nQueres que agendemos uma reunião ou visita técnica com um dos nossos especialistas?',
      bookingCreated: false,
    };
  }

  // Check if user provided scheduling info
  const emailMatch = userMessage.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const isoMatch = userMessage.match(/202[6-9]-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9](?::[0-5][0-9])?(?:Z|[+-][0-9]{2}:?[0-9]{2})?/i);
  const dateMatch = userMessage.match(/202[6-9]-[0-1][0-9]-[0-3][0-9]|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/);
  const timeMatch = userMessage.match(/\b([01]?[0-9]|2[0-3]):[0-5][0-9]\b/);

  // If user triggered scheduling
  if (q.includes('agend') || q.includes('marcar') || q.includes('visita') || q.includes('reuni') || emailMatch) {
    if (emailMatch && (isoMatch || dateMatch || q.includes('2026') || timeMatch || q.includes('amanh') || q.includes('hoje'))) {
      const email = emailMatch[0];
      
      let rawStartTime = '';
      if (isoMatch) {
        rawStartTime = isoMatch[0].includes('Z') || isoMatch[0].includes('+') ? isoMatch[0] : `${isoMatch[0]}Z`;
      } else if (dateMatch) {
        const rawDate = dateMatch[0].replace(/\//g, '-');
        const rawTime = timeMatch ? timeMatch[0] : '10:00';
        rawStartTime = `${rawDate}T${rawTime}:00Z`;
      } else if (timeMatch) {
        rawStartTime = `${new Date().toISOString().slice(0, 10)}T${timeMatch[0]}:00Z`;
      }
      const startTime = ensureFutureSlot(rawStartTime);

      // Name extraction
      const nameMatch = userMessage.match(/(?:nome(?:\s+é|:)?|sou o|chamo-me)\s+([A-ZÀ-Úa-zà-ú\s]{2,30})/i);
      const name = nameMatch ? nameMatch[1].trim() : 'Cliente';

      // Notes extraction
      const notesMatch = userMessage.match(/(?:motivo|serviço|notas?|avaria|problema|para)\s+([^,.;\n]+)/i);
      const notes = notesMatch ? notesMatch[1].trim() : 'Reparação / Assistência Técnica Worten Resolve';

      const calResult = await sendBookingToCalCom({
        name,
        email,
        startTime,
        notes,
      });

      if (!calResult.success) {
        const explanation = calResult.errorReason || 'O horário selecionado não pôde ser agendado.';
        const advice = calResult.userAdvice || 'Por favor escolhe um horário alternativo em dias úteis entre as 09:00 e as 19:00.';

        return {
          text: `⚠️ **Não foi possível concluir o agendamento para ${startTime}:**\n\n` +
            `• **Motivo do erro:** ${explanation}\n` +
            (calResult.error ? `• **Detalhe técnico (Cal.com):** \`${calResult.error}\`\n\n` : '\n') +
            `💡 **Como resolver:** ${advice}\n\n` +
            `Diz-me qual o outro horário ou dia útil (2ª a 6ª feira, das 09:00 às 19:00) de tua preferência que tento logo nova reserva!`,
          bookingCreated: false,
          calSuccess: false,
          calError: calResult.error,
          calErrorReason: explanation,
          calUserAdvice: advice,
          calBooking: calResult.data,
        };
      }

      const calendarPayload = generateCalendarEventPayload({
        name,
        email,
        notes,
        startTime,
      });

      const bookingRecord: StoredBooking = {
        id: `book-${Date.now()}`,
        name,
        email,
        notes,
        startTime,
        createdAt: new Date().toISOString(),
        calBooking: calResult.data,
        calError: null,
        calendarPayload,
      };
      bookingsStore.push(bookingRecord);

      const calSuccessText =
        `\n\n🎉 **Confirmado com sucesso na API do Cal.com (v2)!**\n` +
        `• **ID da Reserva:** \`${(calResult.data as any)?.id || 'Confirmado'}\`\n` +
        `• **UID:** \`${(calResult.data as any)?.uid || ''}\`\n` +
        `• **Link da Reunião:** ${(calResult.data as any)?.meetingUrl || 'Acesso Cal.com Ativo'}`;

      return {
        text: `Excelente! O teu agendamento da **Worten Resolve** foi confirmado com sucesso na agenda:\n\n` +
          `• **Nome:** ${name}\n` +
          `• **Email:** ${email}\n` +
          `• **Notas do Serviço:** ${notes}\n` +
          `• **Início (startTime no futuro):** ${startTime} (horário útil 09:00 - 19:00)` +
          calSuccessText +
          `\n\nPodes também sincronizar com o teu Google Calendar ou descarregar o convite .ics abaixo.`,
        bookingCreated: true,
        uid: (calResult.data as any)?.uid || null,
        calBooking: calResult.data,
        calSuccess: true,
        bookingData: bookingRecord,
        calendarPayload,
      };
    }

    return {
      text: 'Com certeza! Para procedermos ao agendamento da tua reunião ou visita técnica com a equipa da **Worten Resolve**, preciso de recolher os seguintes dados:\n\n' +
        '1. **Nome completo** (`name`) e o teu **email de contacto** (`email`);\n' +
        '2. **Notas ou motivo detalhado do serviço** (`notes`);\n' +
        '3. A **data e hora pretendida** (`startTime`), obrigatoriamente no **FUTURO** (com antecedência mínima de 2 horas a contar da hora atual do sistema, ou no dia útil seguinte), em dias úteis entre as 09:00 e as 19:00.\n\n' +
        'Assim que me deres estas informações, a ferramenta `create_booking` enviará o agendamento diretamente para a API do Cal.com!',
      bookingCreated: false,
    };
  }

  return {
    text: 'Olá! Sou o assistente virtual da **Worten Portugal (Worten Resolve)**. Posso ajudar-te com informações sobre entregas grátis (>35€), devoluções em 30 dias em loja ou reparações técnicas. Se precisares, posso também agendar uma visita técnica ou reunião no futuro (com mínimo de 2 horas de antecedência ou no dia útil seguinte, dias úteis 09:00 às 19:00) com envio direto para o Cal.com!',
    bookingCreated: false,
  };
}

// API Route: Chat with Worten Assistant & function calling
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Mensagem inválida.' });
    }

    // Format chat history for Gemini SDK
    const formattedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      for (const item of history) {
        if (item.sender === 'user' || item.role === 'user') {
          formattedContents.push({
            role: 'user',
            parts: [{ text: item.text || item.content || '' }],
          });
        } else if (item.sender === 'assistant' || item.role === 'model') {
          formattedContents.push({
            role: 'model',
            parts: [{ text: item.text || item.content || '' }],
          });
        }
      }
    }

    // Add current user prompt
    formattedContents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    // Check if Gemini AI client is initialized
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: formattedContents,
          config: {
            systemInstruction: buildWortenSystemInstruction(),
            tools: [{ functionDeclarations: [createBookingDeclaration] }],
            temperature: 0.6,
          },
        });

        // Check if model called create_booking function
        const functionCalls = response.functionCalls;
        if (functionCalls && functionCalls.length > 0) {
          const bookingCall = functionCalls.find((c) => c.name === 'create_booking') || functionCalls[0];
          const args = (bookingCall.args || {}) as {
            name?: string;
            fullName?: string;
            email?: string;
            startTime?: string;
            bookingDate?: string;
            bookingTime?: string;
            notes?: string;
            serviceReason?: string;
            phone?: string;
          };

          // Sanitize parameters as requested: name, email, startTime, notes
          const name = args.name || args.fullName || 'Cliente Worten';
          const email = args.email || process.env.EMAIL_ALUNO || '';
          const notes = args.notes || args.serviceReason || 'Assistência Técnica Worten Resolve';
          let startTime = args.startTime;

          if (!startTime) {
            const date = args.bookingDate;
            const time = args.bookingTime || '10:00';
            startTime = date ? `${date}T${time}:00Z` : ensureFutureSlot();
          }
          startTime = ensureFutureSlot(startTime);

          // Call Cal.com API v2
          const calResult = await sendBookingToCalCom({
            name,
            email,
            startTime,
            notes,
          });

          if (!calResult.success) {
            const explanation = calResult.errorReason || 'O horário selecionado não pôde ser agendado na plataforma Cal.com.';
            const advice = calResult.userAdvice || 'Por favor indica outro horário em dias úteis entre as 09:00 e as 19:00.';

            return res.json({
              text: `⚠️ **Não foi possível concluir o agendamento para o horário solicitado (${startTime}):**\n\n` +
                `• **Motivo do erro:** ${explanation}\n` +
                (calResult.error ? `• **Detalhe técnico (Cal.com):** \`${calResult.error}\`\n\n` : '\n') +
                `💡 **Como resolver:** ${advice}\n\n` +
                `Indica-me qual a nova hora ou dia útil (2ª a 6ª feira, das 09:00 às 19:00) que preferes, e eu procedo de imediato à reserva!`,
              bookingCreated: false,
              calSuccess: false,
              calError: calResult.error,
              calErrorReason: explanation,
              calUserAdvice: advice,
              calBooking: calResult.data,
            });
          }

          const calendarPayload = generateCalendarEventPayload({
            name,
            email,
            notes,
            startTime,
            phone: args.phone,
          });

          const bookingRecord: StoredBooking = {
            id: `book-${Date.now()}`,
            name,
            email,
            notes,
            startTime,
            phone: args.phone,
            createdAt: new Date().toISOString(),
            calBooking: calResult.data,
            calError: null,
            calendarPayload,
          };
          bookingsStore.push(bookingRecord);

          const calInfo = calResult.data as any;
          const calSuccessText =
            `\n\n✅ **Enviado e confirmado na API do Cal.com (v2)!**\n` +
            `• **ID do Agendamento:** \`${calInfo?.id || '200'}\`\n` +
            `• **UID da Reunião:** \`${calInfo?.uid || ''}\`\n` +
            (calInfo?.meetingUrl ? `• **Link de Acesso:** [Entrar na Reunião](${calInfo.meetingUrl})\n` : '') +
            `• **Fuso Horário:** Europe/Lisbon`;

          return res.json({
            text: `Perfeito! O teu agendamento da **Worten Resolve** foi confirmado com sucesso na agenda:\n\n` +
              `• **Nome:** ${name}\n` +
              `• **Email:** ${email}\n` +
              `• **Notas:** ${notes}\n` +
              `• **Início (startTime):** ${startTime} (Dias úteis, 09:00 - 19:00)` +
              calSuccessText +
              `\n\nPodes agora adicionar o evento ao Google Calendar ou descarregar o ficheiro .ics abaixo.`,
            bookingCreated: true,
            uid: calInfo?.uid || null,
            calSuccess: true,
            calBooking: calResult.data,
            bookingData: bookingRecord,
            calendarPayload,
          });
        }

        // Standard text reply from model
        const replyText = response.text || 'Olá! Como posso ajudar-te hoje na Worten Portugal?';
        return res.json({
          text: replyText,
          bookingCreated: false,
        });
      } catch (geminiError) {
        console.warn('Gemini API call failed, using intelligent fallback engine:', geminiError);
      }
    }

    // Fallback if API key missing or call failed
    const fallbackResult = await handleFallbackBot(
      message,
      formattedContents.map((c) => ({ role: c.role, text: c.parts[0]?.text || '' }))
    );
    return res.json(fallbackResult);
  } catch (err: unknown) {
    console.error('Error handling /api/chat:', err);
    res.status(500).json({
      error: 'Ocorreu um erro ao comunicar com o assistente.',
      text: 'Peço desculpa, ocorreu uma instabilidade temporária. Podes tentar novamente ou utilizar o formulário de agendamento direto.',
    });
  }
});

// API Route: Direct create_booking endpoint (receives name, email, startTime, notes)
app.post('/api/bookings', async (req, res) => {
  try {
    const name = req.body.name || req.body.fullName;
    const email = req.body.email;
    const notes = req.body.notes || req.body.serviceReason;
    let startTime = req.body.startTime;

    if (!startTime && req.body.bookingDate && req.body.bookingTime) {
      startTime = `${req.body.bookingDate}T${req.body.bookingTime}:00Z`;
    }

    if (!name || !email || !startTime || !notes) {
      return res.status(400).json({
        error: 'Todos os campos obrigatórios devem ser preenchidos: name, email, startTime e notes.',
      });
    }

    startTime = ensureFutureSlot(startTime);

    // Call Cal.com API v2
    const calResult = await sendBookingToCalCom({
      name,
      email,
      startTime,
      notes,
    });

    if (!calResult.success) {
      const statusCode = calResult.statusCode || (calResult.error === 'CAL_API_KEY não configurada' ? 503 : 409);
      return res.status(statusCode).json({
        success: false,
        calSuccess: false,
        error: calResult.error,
        errorReason: calResult.errorReason,
        userAdvice: calResult.userAdvice,
        message: `Não foi possível agendar: ${calResult.errorReason || calResult.error}`,
        calBooking: calResult.data,
      });
    }

    const calendarPayload = generateCalendarEventPayload({
      name,
      email,
      notes,
      startTime,
      phone: req.body.phone,
    });

    const bookingRecord: StoredBooking = {
      id: `book-${Date.now()}`,
      name,
      email,
      notes,
      startTime,
      phone: req.body.phone,
      createdAt: new Date().toISOString(),
      calBooking: calResult.data,
      calError: null,
      calendarPayload,
    };
    bookingsStore.push(bookingRecord);

    const calInfo = (calResult.data || {}) as any;
    const bookingUid = calInfo?.uid || '';

    return res.status(201).json({
      success: true,
      message: `Agendamento criado com sucesso no Cal.com (v2) via create_booking! UID: ${bookingUid}`,
      uid: bookingUid || null,
      calSuccess: true,
      calBooking: calResult.data,
      booking: bookingRecord,
      calendarPayload,
    });
  } catch (err) {
    console.error('Error in /api/bookings:', err);
    res.status(500).json({ error: 'Erro ao registar agendamento.' });
  }
});

// API Route: List stored bookings
app.get('/api/bookings', (_req, res) => {
  res.json({
    total: bookingsStore.length,
    bookings: bookingsStore,
  });
});

// Seed catalog on server startup
seedCatalogIfEmpty().catch((err) => {
  console.error('[Firestore Erro] Falha no arranque ao semear catalogo:', err);
});

// ==========================================
// PROTÓTIPO 2: PEDIDOS, PROPOSTAS & CATÁLOGO
// ==========================================

// 1. GET /api/catalogo - Lista serviços ativos do catálogo
app.get('/api/catalogo', async (_req, res) => {
  try {
    const catalogo = await getActiveCatalogItems();
    res.json({ success: true, catalogo });
  } catch (error: any) {
    console.error('[Firestore Erro] Erro em GET /api/catalogo:', error);
    res.status(500).json({ error: 'Erro ao carregar catálogo de serviços.' });
  }
});

// 2. POST /api/pedidos - Submissão do pedido na Landing Page com IA Gemini
app.post('/api/pedidos', async (req, res) => {
  const nome = (req.body.nome || req.body.name || '').trim();
  const email = (req.body.email || '').trim();
  const textoOriginal = (req.body.textoOriginal || req.body.pedido || req.body.notes || '').trim();

  // Validação dos 3 campos obrigatórios: Nome, Email e Pedido
  if (!nome || !email || !textoOriginal) {
    return res.status(400).json({
      success: false,
      error: 'Todos os campos são obrigatórios: Nome, Email e Pedido.',
    });
  }

  // Validação básica de email
  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).json({
      success: false,
      error: 'Por favor, introduza um endereço de email válido.',
    });
  }

  const host = req.get('host') || `localhost:${PORT}`;
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const baseUrl = process.env.APP_BASE_URL || process.env.APP_URL || `${protocol}://${host}`;

  try {
    // Processamento do pedido com gravação resiliente
    const result = await processNovoPedido({
      nome,
      email,
      textoOriginal,
      baseUrl,
    });

    if (!result.proposta) {
      return res.status(201).json({
        success: true,
        message: 'O seu pedido foi recebido com sucesso.',
        pedido: result.pedido,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'O seu pedido foi recebido com sucesso.',
      token: result.proposta.token,
      propostaUrl: result.propostaUrl,
      proposta: result.proposta,
      pedido: result.pedido,
    });
  } catch (error: any) {
    console.error('[Processamento Pedido Erro]:', error);
    return res.status(500).json({
      success: false,
      error: 'Ocorreu um erro ao processar o seu pedido. Por favor, tente novamente.',
    });
  }
});

// 3. GET /api/propostas/:token - Consulta pública de proposta individual por token
app.get('/api/propostas/:token', async (req, res) => {
  // Impede a indexação por motores de busca (CORREÇÃO 4)
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  try {
    const token = req.params.token;
    if (!token) {
      return res.status(400).json({ error: 'Token de proposta não fornecido.' });
    }

    const proposta = await getPropostaByToken(token);
    if (!proposta) {
      return res.status(404).json({ error: 'Proposta não encontrada ou link expirado.' });
    }

    // Verifica a validade no backend: se dataValidade já passou, responde 410 (CORREÇÃO 4)
    const agora = Date.now();
    const dataValidadeMs = new Date(proposta.dataValidade).getTime();
    if (!isNaN(dataValidadeMs) && dataValidadeMs < agora) {
      return res.status(410).json({
        success: false,
        error: 'Esta proposta expirou.',
        expirada: true,
      });
    }

    // Privacidade da proposta: omite clienteEmail, textoOriginal, notas internas e revisão (CORREÇÃO 4)
    const publicProposta = {
      id: proposta.id,
      numeroProposta: proposta.numeroProposta,
      token: proposta.token,
      clienteNome: proposta.clienteNome,
      itens: proposta.itens,
      totalSemIvaCentimos: proposta.totalSemIvaCentimos,
      totalSemIva: proposta.totalSemIva,
      totalComIvaCentimos: proposta.totalComIvaCentimos,
      totalComIva: proposta.totalComIva,
      dataValidade: proposta.dataValidade,
      validadeDias: proposta.validadeDias,
      createdAt: proposta.createdAt,
      status: proposta.status,
      interpretacaoResumo: proposta.interpretacaoResumo,
    };

    return res.json({ success: true, proposta: publicProposta });
  } catch (error: any) {
    console.error('Erro em GET /api/propostas/:token:', error);
    return res.status(500).json({ error: 'Erro ao carregar os detalhes da proposta.' });
  }
});

// Middleware de verificação de permissão Admin com validação de Firebase ID Token (CORREÇÃO 3)
const verifyAdminAccess = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const configuredAdminUid = process.env.ADMIN_UID?.trim();

  // Se ADMIN_UID não estiver definido, nega o acesso (403) e explica o que configurar
  if (!configuredAdminUid) {
    return res.status(403).json({
      error: 'Acesso negado: ADMIN_UID não está configurado nas variáveis de ambiente do servidor.',
      hint: 'Configure a variável ADMIN_UID com o UID do administrador no painel de Secrets.',
    });
  }

  const authHeader = (req.headers.authorization || (req.headers['authorization'] as string))?.trim();
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Acesso restrito. Cabeçalho Authorization: Bearer <ID token> em falta.',
    });
  }

  const idToken = authHeader.split('Bearer ')[1]?.trim();
  if (!idToken) {
    return res.status(401).json({
      error: 'Acesso restrito. Token de autenticação em falta.',
    });
  }

  try {
    if (!adminAuth) {
      return res.status(503).json({
        error: 'Serviço de autenticação de administração temporariamente indisponível.',
      });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    if (!decodedToken || decodedToken.uid !== configuredAdminUid) {
      console.warn(`[Admin Auth] Tentativa de acesso não autorizado: UID ${decodedToken?.uid} não coincide com ADMIN_UID.`);
      return res.status(403).json({
        error: 'Acesso negado: O utilizador autenticado não tem permissões de administrador.',
      });
    }

    (req as any).adminUser = decodedToken;
    return next();
  } catch (authErr: any) {
    console.warn('[Admin Auth] Falha na validação do token Firebase:', authErr?.message || authErr);
    return res.status(401).json({
      error: 'Sessão inválida ou expirada. Por favor, volte a iniciar sessão com a sua conta Google.',
    });
  }
};

// 4. GET /api/admin/config - Retorna apenas indicadores booleanos de configuração (sem expor UIDs ou emails) (CORREÇÃO 3)
app.get('/api/admin/config', (_req, res) => {
  res.json({
    adminUidConfigured: Boolean(process.env.ADMIN_UID?.trim()),
    emailAlunoConfigured: Boolean(process.env.EMAIL_ALUNO?.trim()),
  });
});

// 5. GET /api/admin/pedidos - Lista de todos os pedidos para o admin
app.get('/api/admin/pedidos', verifyAdminAccess, async (_req, res) => {
  try {
    const pedidos = await getAllPedidos();
    res.json({ success: true, pedidos });
  } catch (error: any) {
    console.error('Erro em GET /api/admin/pedidos:', error);
    res.status(500).json({ error: 'Erro ao obter lista de pedidos.' });
  }
});

// 6. GET /api/admin/propostas - Lista de todas as propostas para o admin
app.get('/api/admin/propostas', verifyAdminAccess, async (_req, res) => {
  try {
    const propostas = await getAllPropostas();
    res.json({ success: true, propostas });
  } catch (error: any) {
    console.error('Erro em GET /api/admin/propostas:', error);
    res.status(500).json({ error: 'Erro ao obter lista de propostas.' });
  }
});

// 7. GET /api/admin/catalogo - Lista catálogo completo (incluindo inativos) (CORREÇÃO 3)
app.get('/api/admin/catalogo', verifyAdminAccess, async (_req, res) => {
  try {
    const catalogo = await getAllCatalogItems();
    res.json({ success: true, catalogo });
  } catch (error: any) {
    console.error('Erro em GET /api/admin/catalogo:', error);
    res.status(500).json({ error: 'Erro ao obter catálogo de administração.' });
  }
});

// 8. PUT /api/admin/catalogo/:id - Editar serviço do catálogo com validação estrita (CORREÇÃO 3)
app.put('/api/admin/catalogo/:id', verifyAdminAccess, async (req, res) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string' || id.length > 100) {
      return res.status(400).json({ error: 'Identificador de serviço inválido.' });
    }

    const { precoCentimos, ativo, nome, categoria, descricao, moeda } = req.body;
    const validatedUpdates: Partial<CatalogItem> = {};

    if (precoCentimos !== undefined) {
      if (typeof precoCentimos !== 'number' || !Number.isInteger(precoCentimos) || precoCentimos < 0) {
        return res.status(400).json({
          error: 'precoCentimos deve ser um número inteiro maior ou igual a 0.',
        });
      }
      validatedUpdates.precoCentimos = precoCentimos;
    }

    if (ativo !== undefined) {
      if (typeof ativo !== 'boolean') {
        return res.status(400).json({
          error: 'ativo deve ser um valor booleano (true ou false).',
        });
      }
      validatedUpdates.ativo = ativo;
    }

    if (nome !== undefined) {
      if (typeof nome !== 'string' || nome.trim().length === 0 || nome.length > 150) {
        return res.status(400).json({
          error: 'nome deve ser uma string com no máximo 150 caracteres.',
        });
      }
      validatedUpdates.nome = nome.trim();
    }

    if (categoria !== undefined) {
      if (typeof categoria !== 'string' || categoria.trim().length === 0 || categoria.length > 80) {
        return res.status(400).json({
          error: 'categoria deve ser uma string com no máximo 80 caracteres.',
        });
      }
      validatedUpdates.categoria = categoria.trim();
    }

    if (descricao !== undefined) {
      if (typeof descricao !== 'string' || descricao.length > 1000) {
        return res.status(400).json({
          error: 'descricao deve ter no máximo 1000 caracteres.',
        });
      }
      validatedUpdates.descricao = descricao.trim();
    }

    if (moeda !== undefined) {
      if (typeof moeda !== 'string' || moeda.length > 10) {
        return res.status(400).json({ error: 'moeda inválida.' });
      }
      validatedUpdates.moeda = moeda.trim();
    }

    const updated = await updateCatalogItem(id, validatedUpdates);
    res.json({ success: true, item: updated });
  } catch (error: any) {
    console.error('Erro em PUT /api/admin/catalogo/:id:', error);
    res.status(500).json({ error: 'Erro ao atualizar serviço no catálogo.' });
  }
});

// Health check endpoint for Cloud Run
app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

// Favicon oficial Worten servido diretamente pelo Express
app.get(['/favicon.ico', '/favicon.svg'], (_req, res) => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='14' fill='%23DF0000'/><text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' fill='%23FFFFFF' font-family='Arial, sans-serif' font-weight='900' font-size='38'>W</text></svg>`;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(svg);
});

// Middleware para impedir indexação por motores de busca em páginas e APIs de propostas (CORREÇÃO 4)
app.use((req, res, next) => {
  if (req.path.startsWith('/proposta') || req.path.startsWith('/api/propostas')) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  }
  next();
});

// Start listening immediately on host 0.0.0.0 and PORT without waiting for Vite or disk operations
const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

server.on('error', (listenError: any) => {
  console.error('Server listen error:', listenError);
});

// Setup Vite Middlewares in development or static serve in production (non-blocking)
async function setupFrontendMiddleware() {
  try {
    const distPath = path.resolve(__dirname, 'dist');
    const hasDist = fs.existsSync(distPath);

    if (process.env.NODE_ENV === 'production' || hasDist) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        const indexPath = path.resolve(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.send('App is running. Frontend build in progress.');
        }
      });
    } else {
      try {
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: 'spa',
        });
        app.use(vite.middlewares);
      } catch (viteError) {
        console.warn('Vite dev server failed to start, falling back to static files:', viteError);
        if (hasDist) {
          app.use(express.static(distPath));
          app.get('*', (_req, res) => {
            res.sendFile(path.resolve(distPath, 'index.html'));
          });
        }
      }
    }
  } catch (setupError) {
    console.warn('Warning during server middleware setup:', setupError);
  }
}

setupFrontendMiddleware().catch((fatalErr) => {
  console.warn('Non-fatal error setting up frontend middleware:', fatalErr);
});
