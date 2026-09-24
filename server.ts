import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Cal.com API Key configuration
const CAL_API_KEY = process.env.CAL_API_KEY || 'cal_live_cd3ae2c637bf2c13ca8c9d2f28b3ff0f';

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

// Gemini GenAI Client Initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Function Declaration for create_booking (receives name, email, startTime, notes)
const createBookingDeclaration: FunctionDeclaration = {
  name: 'create_booking',
  description:
    'Regista e agenda uma reunião ou visita técnica da equipa Worten Resolve enviando o agendamento diretamente para a API do Cal.com (v2). OBRIGATÓRIO acionar esta ferramenta assim que tiveres todos os dados necessários (name, email, startTime e notes). NUNCA inventes confirmação de texto sem acionar esta função.',
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
          'Data e hora de início no formato ISO 8601 (ex: "2026-09-28T10:00:00Z" ou "2026-09-28T10:00:00") para um dia útil (2ª a 6ª feira) entre as 09:00 e as 19:00 (fuso horário Europe/Lisbon).',
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

const WORTEN_SYSTEM_INSTRUCTION = `És o assistente virtual oficial da Worten Portugal (Worten Resolve).
Tratas o cliente sempre por "tu" de forma ágil, empática e amigável.
Respondes com clareza e precisão a dúvidas comuns:
- Entregas grátis em compras superiores a 35€ em pequenos formatos expedidos pela Worten (Click & Collect sempre grátis em qualquer loja física).
- Devoluções em 14 dias em loja física ou com recolha ao domicílio (artigos na embalagem original, com todos os acessórios e respetiva fatura).
- Reparações e assistência técnica Worten Resolve (substituição de ecrãs e baterias na hora para smartphones, reparação ao domicílio de grandes eletrodomésticos, manutenção, limpeza e upgrade de computadores).

QUANDO O UTILIZADOR QUISER AGENDAR UMA REUNIÃO OU VISITA TÉCNICA:
1. Pede o nome completo ('name'), o email de contacto ('email') e as notas ou motivo do serviço ('notes').
2. Pede a data e hora pretendida ('startTime', convertida para formato ISO 8601 ex: 2026-09-28T10:00:00Z em dias úteis entre as 09:00 e as 19:00). Se o cliente sugerir um horário fora desse intervalo, esclarece amigavelmente o horário de funcionamento e sugere uma alternativa.
3. Assim que tiveres todos os dados (name, email, startTime, notes), NÃO inventes uma confirmação de texto. Deves OBRIGATORIAMENTE acionar a ferramenta 'create_booking'.`;

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
  statusCode?: number;
}

async function sendBookingToCalCom(params: CalBookingParams): Promise<CalBookingResult> {
  try {
    let isoStartTime: string;
    try {
      const parsedDate = new Date(params.startTime);
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Data inválida');
      }
      isoStartTime = parsedDate.toISOString();
    } catch {
      isoStartTime = '2026-09-28T10:00:00.000Z';
    }

    const payload = {
      start: isoStartTime,
      eventTypeId: 7177694, // Reunião de 30 min (Afonso Pedro - Worten Resolve)
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

    console.log('[Cal.com v2] Enviando agendamento para https://api.cal.com/v2/bookings...', {
      start: payload.start,
      name: params.name,
      email: params.email,
    });

    const response = await fetch('https://api.cal.com/v2/bookings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CAL_API_KEY}`,
        'Content-Type': 'application/json',
        'cal-api-version': '2024-08-13',
      },
      body: JSON.stringify(payload),
    });

    const resJson = (await response.json()) as any;

    if (!response.ok || resJson.status === 'error') {
      const errorMsg =
        resJson?.error?.message ||
        resJson?.message ||
        `Erro Cal.com (HTTP ${response.status})`;
      console.warn('[Cal.com v2] Resposta com erro:', errorMsg, resJson);
      return {
        success: false,
        error: errorMsg,
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
    return {
      success: false,
      error: err?.message || 'Falha ao contactar a API do Cal.com',
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
  let startDate = '2026-09-28';
  let startTimeFormatted = '10:00';
  let endFormatted = '11:00';
  let startISO = `${startDate}T10:00:00+01:00`;
  let endISO = `${startDate}T11:00:00+01:00`;

  try {
    const parsed = new Date(data.startTime);
    if (!isNaN(parsed.getTime())) {
      startDate = parsed.toISOString().slice(0, 10);
      const hours = parsed.getHours();
      const minutes = parsed.getMinutes();
      const pad = (n: number) => n.toString().padStart(2, '0');
      startTimeFormatted = `${pad(hours)}:${pad(minutes)}`;
      endFormatted = `${pad(hours + 1)}:${pad(minutes)}`;
      startISO = parsed.toISOString();
      const endD = new Date(parsed.getTime() + 30 * 60000);
      endISO = endD.toISOString();
    }
  } catch {
    // fallback defaults
  }

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
  if (q.includes('devol') || q.includes('troca') || q.includes('reembols') || q.includes('14 dias') || q.includes('desistir')) {
    return {
      text: 'Podes devolver qualquer artigo no prazo de **14 dias** a contar da entrega, tanto diretamente em qualquer uma das nossas lojas físicas Worten como solicitando recolha ao domicílio na tua área de cliente online.\n\nO produto apenas precisa de estar completo, na embalagem original, com todos os manuais/acessórios e com a fatura de compra.',
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
  const dateMatch = userMessage.match(/\b(202[6-9]-[0-1][0-9]-[0-3][0-9]|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\b/);
  const timeMatch = userMessage.match(/\b([01]?[0-9]|2[0-3]):[0-5][0-9]\b/);

  // If user triggered scheduling
  if (q.includes('agend') || q.includes('marcar') || q.includes('visita') || q.includes('reuni') || emailMatch) {
    if (emailMatch && (dateMatch || q.includes('2026') || timeMatch)) {
      const email = emailMatch[0];
      const date = dateMatch ? dateMatch[0].replace(/\//g, '-') : '2026-09-28';
      const time = timeMatch ? timeMatch[0] : '10:00';
      const name = userMessage.split(/[,;\n]/)[0].replace(/(agendar|para|sou o|chamo-me|nome:?)/gi, '').trim() || 'Afonso Pedro';
      const notes = 'Reparação / Assistência Técnica Worten Resolve';
      const startTime = `${date}T${time}:00Z`;

      const calResult = await sendBookingToCalCom({
        name,
        email,
        startTime,
        notes,
      });

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
        calError: calResult.error,
        calendarPayload,
      };
      bookingsStore.push(bookingRecord);

      const calSuccessText = calResult.success
        ? `\n\n🎉 **Sincronizado na API do Cal.com (v2)!**\n• **ID da Reserva:** \`${(calResult.data as any)?.id || 'Confirmado'}\`\n• **UID:** \`${(calResult.data as any)?.uid || ''}\`\n• **Link da Reunião:** ${(calResult.data as any)?.meetingUrl || 'Acesso Cal.com Ativo'}`
        : '';

      return {
        text: `Excelente! Acabei de acionar a ferramenta **create_booking** para formalizar o teu agendamento na Worten Resolve.\n\n` +
          `• **Nome:** ${name}\n` +
          `• **Email:** ${email}\n` +
          `• **Notas do Serviço:** ${notes}\n` +
          `• **Início (startTime):** ${startTime} (horário útil 09:00 - 19:00)` +
          calSuccessText +
          `\n\nPodes também sincronizar com o teu Google Calendar ou descarregar o convite .ics abaixo.`,
        bookingCreated: true,
        calBooking: calResult.data,
        calSuccess: calResult.success,
        calError: calResult.error,
        bookingData: bookingRecord,
        calendarPayload,
      };
    }

    return {
      text: 'Com certeza! Para procedermos ao agendamento da tua reunião ou visita técnica com a equipa da **Worten Resolve**, preciso de recolher os seguintes dados:\n\n' +
        '1. **Nome completo** (`name`) e o teu **email de contacto** (`email`);\n' +
        '2. **Notas ou motivo detalhado do serviço** (`notes`);\n' +
        '3. A **data e hora pretendida** (`startTime`), em dias úteis entre as 09:00 e as 19:00.\n\n' +
        'Assim que me deres estas informações, a ferramenta `create_booking` enviará o agendamento diretamente para a API do Cal.com!',
      bookingCreated: false,
    };
  }

  return {
    text: 'Olá! Sou o assistente virtual da **Worten Portugal (Worten Resolve)**. Posso ajudar-te com informações sobre entregas grátis (>35€), devoluções em 14 dias em loja ou reparações técnicas. Se precisares, posso também agendar uma visita técnica ou reunião entre as 09:00 e as 19:00 em dias úteis com envio direto para o Cal.com!',
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

    // Check if API key is available
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: formattedContents,
          config: {
            systemInstruction: WORTEN_SYSTEM_INSTRUCTION,
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
          const name = args.name || args.fullName || 'Afonso Pedro';
          const email = args.email || 'afonso06pedro@gmail.com';
          const notes = args.notes || args.serviceReason || 'Assistência Técnica Worten Resolve';
          let startTime = args.startTime;

          if (!startTime) {
            const date = args.bookingDate || '2026-09-28';
            const time = args.bookingTime || '10:00';
            startTime = `${date}T${time}:00Z`;
          }

          // Call Cal.com API v2
          const calResult = await sendBookingToCalCom({
            name,
            email,
            startTime,
            notes,
          });

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
            calError: calResult.error,
            calendarPayload,
          };
          bookingsStore.push(bookingRecord);

          const calInfo = calResult.data as any;
          const calSuccessText = calResult.success
            ? `\n\n✅ **Enviado com sucesso para a API do Cal.com (v2)!**\n` +
              `• **ID do Agendamento:** \`${calInfo?.id || '200'}\`\n` +
              `• **UID da Reunião:** \`${calInfo?.uid || ''}\`\n` +
              (calInfo?.meetingUrl ? `• **Link de Acesso:** [Entrar na Reunião](${calInfo.meetingUrl})\n` : '') +
              `• **Fuso Horário:** Europe/Lisbon`
            : calResult.error
            ? `\n\n⚠️ **Nota Cal.com:** ${calResult.error}`
            : '';

          return res.json({
            text: `Perfeito! A ferramenta **create_booking** foi acionada com sucesso pela IA do Gemini para formalizar o teu agendamento da **Worten Resolve**:\n\n` +
              `• **Nome:** ${name}\n` +
              `• **Email:** ${email}\n` +
              `• **Notas:** ${notes}\n` +
              `• **Início (startTime):** ${startTime} (Dias úteis, 09:00 - 19:00)` +
              calSuccessText +
              `\n\nPodes agora adicionar o evento ao Google Calendar ou descarregar o ficheiro .ics abaixo.`,
            bookingCreated: true,
            calSuccess: calResult.success,
            calBooking: calResult.data,
            calError: calResult.error,
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

    // Call Cal.com API v2
    const calResult = await sendBookingToCalCom({
      name,
      email,
      startTime,
      notes,
    });

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
      calError: calResult.error,
      calendarPayload,
    };
    bookingsStore.push(bookingRecord);

    return res.status(201).json({
      success: true,
      message: calResult.success
        ? 'Agendamento criado com sucesso no Cal.com (v2) via create_booking!'
        : 'Agendamento registado localmente (Cal.com retornou aviso).',
      calSuccess: calResult.success,
      calBooking: calResult.data,
      calError: calResult.error,
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

// Setup Vite Middlewares in development or static serve in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Worten Portugal Assistant Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
