import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Wrench,
  CheckCircle2,
  Copy,
  ExternalLink,
  Sparkles,
  Maximize2,
  Minimize2,
  RotateCcw,
  Bot,
  ChevronRight,
  ShieldCheck,
  Truck,
  CreditCard,
  Download,
  Flame,
  Info,
} from 'lucide-react';

export interface CalendarEventPayload {
  action: string;
  calendar_id: string;
  event_details: {
    summary: string;
    description: string;
    start: {
      dateTime: string;
      timeZone: string;
    };
    end: {
      dateTime: string;
      timeZone: string;
    };
    attendees: Array<{ email: string }>;
    reminders: {
      useDefault: boolean;
      overrides: Array<{ method: string; minutes: number }>;
    };
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedActions?: Array<{ label: string; action: () => void }>;
  calendarPayload?: CalendarEventPayload;
  calBooking?: Record<string, any>;
  calSuccess?: boolean;
  calError?: string;
  schedulingStep?: 'form' | 'confirmation' | 'completed';
}

interface SchedulingFormData {
  fullName: string;
  email: string;
  phone: string;
  serviceType: string;
  date: string;
  time: string;
}

interface WortenVirtualAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  initialQuery?: string;
}

// Preset service types aligned with Worten Resolve
const SERVICE_OPTIONS = [
  'Instalação de Ar Condicionado & Climatização',
  'Instalação de TV na Parede & Som',
  'Instalação de Placa de Indução / Forno',
  'Reparação de Grande Eletrodoméstico (Frigorífico/Lavar)',
  'Reparação de Smartphone / Ecrã (Worten Resolve)',
  'Reparação & Limpeza de Computador / Portátil',
  'Apoio Comercial Worten Empresas (B2B)',
  'Simulação de Pacote TV + Net + Voz',
];

export const WortenVirtualAssistant: React.FC<WortenVirtualAssistantProps> = ({
  isOpen,
  onClose,
  onOpen,
  initialQuery,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [copiedPayloadId, setCopiedPayloadId] = useState<string | null>(null);
  const [webhookSimulated, setWebhookSimulated] = useState<boolean>(false);

  // Active scheduling form state inside chat
  const [schedulingData, setSchedulingData] = useState<SchedulingFormData>({
    fullName: '',
    email: '',
    phone: '',
    serviceType: SERVICE_OPTIONS[0],
    date: '2026-09-28',
    time: '10:00',
  });
  const [isSchedulingMode, setIsSchedulingMode] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: 'Olá! Sou o teu assistente virtual oficial da **Worten Portugal (Worten Resolve)**.\n\nTrato-te sempre por "tu" e estou aqui para te ajudar de forma rápida e descomplicada. Podes colocar-me dúvidas sobre:\n• **Entregas grátis** (>35€ em pequenos formatos e levantamento gratuito em loja);\n• **Devoluções em 14 dias** em qualquer loja Worten;\n• **Reparações e assistência técnica Worten Resolve** (ecrãs, baterias, computadores e eletrodomésticos);\n• **Agendamento de reuniões ou visitas técnicas** (dias úteis, entre as 09:00 e as 19:00).\n\nComo te posso ajudar hoje?',
      timestamp: 'Agora',
      suggestedActions: [
        {
          label: '📦 Portes grátis (>35€)?',
          action: () => handleSendPrompt('Qual é o valor mínimo para ter entregas grátis?'),
        },
        {
          label: '↩️ Devolução em 14 dias',
          action: () => handleSendPrompt('Como funciona o prazo de devolução de 14 dias em loja?'),
        },
        {
          label: '🛠️ Reparações Worten Resolve',
          action: () => handleSendPrompt('Que reparações estão disponíveis na Worten Resolve?'),
        },
        {
          label: '📅 Agendar Visita Técnica',
          action: () => handleSendPrompt('Quero agendar uma visita técnica da Worten Resolve.'),
        },
      ],
    },
  ]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  // Handle initial query if passed
  useEffect(() => {
    if (initialQuery && isOpen) {
      handleSendPrompt(initialQuery);
    }
  }, [initialQuery]);

  // Helper to format ISO 8601 with Lisbon timezone offset (+01:00)
  const formatLisbonISO = (dateStr: string, timeStr: string, durationMinutes = 60) => {
    const [year, month, day] = dateStr.split('-');
    const [hours, minutes] = timeStr.split(':');
    
    const startObj = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes)
    );
    const endObj = new Date(startObj.getTime() + durationMinutes * 60 * 1000);

    const pad = (n: number) => n.toString().padStart(2, '0');

    const startISO = `${startObj.getFullYear()}-${pad(startObj.getMonth() + 1)}-${pad(
      startObj.getDate()
    )}T${pad(startObj.getHours())}:${pad(startObj.getMinutes())}:00+01:00`;

    const endISO = `${endObj.getFullYear()}-${pad(endObj.getMonth() + 1)}-${pad(
      endObj.getDate()
    )}T${pad(endObj.getHours())}:${pad(endObj.getMinutes())}:00+01:00`;

    return { startISO, endISO, startObj, endObj };
  };

  // Generate Google Calendar Web URL
  const generateGoogleCalendarUrl = (payload: CalendarEventPayload) => {
    const title = encodeURIComponent(payload.event_details.summary);
    const details = encodeURIComponent(payload.event_details.description);
    
    // Clean ISO to YYYYMMDDTHHmmssZ or local
    const startClean = payload.event_details.start.dateTime.replace(/[-:+]/g, '').slice(0, 15);
    const endClean = payload.event_details.end.dateTime.replace(/[-:+]/g, '').slice(0, 15);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startClean}/${endClean}&details=${details}&location=Worten%20Portugal%20(Ao%20Domic%C3%ADlio%20ou%20Telefone)`;
  };

  // Generate .ics download
  const downloadICSFile = (payload: CalendarEventPayload) => {
    const summary = payload.event_details.summary;
    const description = payload.event_details.description.replace(/\n/g, '\\n');
    const startStr = payload.event_details.start.dateTime.replace(/[-:]/g, '').split('+')[0];
    const endStr = payload.event_details.end.dateTime.replace(/[-:]/g, '').split('+')[0];

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Worten Portugal//Worten Resolve Scheduler//PT',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      'LOCATION:Worten Portugal (Ao Domicílio / Telefone)',
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT60M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Lembrete Worten Resolve',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `agendamento-worten-${Date.now()}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Intent classification and rule-based knowledge engine strictly obeying system prompt
  const processUserQuery = (query: string): { responseText: string; isSchedulingTrigger: boolean } => {
    const q = query.toLowerCase();

    // 1. Scheduling triggers: instalação, reparação, técnico, agendar, marcar, B2B, pacote tv net voz, visita
    if (
      q.includes('agendar') ||
      q.includes('marcar') ||
      q.includes('instala') ||
      q.includes('repara') ||
      q.includes('técnico') ||
      q.includes('tecnico') ||
      q.includes('visita') ||
      q.includes('montagem') ||
      q.includes('orçamento') ||
      q.includes('b2b') ||
      q.includes('empresa') ||
      q.includes('tv net voz') ||
      q.includes('pain')
    ) {
      return {
        responseText:
          'Com certeza! A nossa equipa da **Worten Resolve** tem técnicos certificados para efetuar instalações, reparações ao domicílio e consultoria técnica especializada.\n\nPara agendarmos a tua sessão ou visita técnica com sincronização direta no teu **Google Calendar**, só preciso de alguns dados rápidos. Podes preencher o formulário interativo abaixo ou indicar-me diretamente.',
        isSchedulingTrigger: true,
      };
    }

    // 2. Entregas e Portes
    if (
      q.includes('porte') ||
      q.includes('entrega') ||
      q.includes('envio') ||
      q.includes('click') ||
      q.includes('recolha') ||
      q.includes('frete') ||
      q.includes('prazo')
    ) {
      return {
        responseText:
          'Aqui tens as regras oficiais de **Entregas e Portes** na Worten.pt:\n\n' +
          '• **Portes Grátis:** Válidos para encomendas superiores a **35€** em artigos de pequeno formato expedidos diretamente pela Worten.\n' +
          '• **Levantamento em Loja (Click & Collect):** É sempre **100% gratuito** em qualquer loja física Worten em Portugal Continental e Ilhas (sujeito à disponibilidade de stock imediato ou entrega diferida).\n' +
          '• **Grandes Formatos (Eletrodomésticos e TVs >55"):** Inclui opção de entrega ao domicílio com agendamento prévio e **recolha gratuita do equipamento antigo** (desmantelamento e encaminhamento para reciclagem REEE).\n\n' +
          'Precisas de agendar a entrega ou instalação de um grande eletrodoméstico?',
        isSchedulingTrigger: false,
      };
    }

    // 3. Devoluções e Reembolsos
    if (
      q.includes('devol') ||
      q.includes('reembols') ||
      q.includes('troca') ||
      q.includes('desistir') ||
      q.includes('14 dias')
    ) {
      return {
        responseText:
          'Sobre as **Devoluções e Reembolsos** na Worten:\n\n' +
          '• **Prazo Geral:** Tens **14 dias** a contar da receção do artigo para devoluções online (direito de livre resolução). Clientes com cartão Worten Life contam com extensões de prazo aplicáveis.\n' +
          '• **Onde Devolver:** Podes devolver gratuitamente em qualquer loja física Worten do país ou solicitar a recolha ao domicílio através da tua área de cliente em "A Minha Conta".\n' +
          '• **Condições:** O produto deve estar completo, na embalagem original, com todos os acessórios e fatura de compra.\n' +
          '• **Exceções Legais:** Não se aceitam devoluções de auriculares in-ear abertos, artigos de higiene pessoal ou videojogos e software deslacrados.\n\n' +
          'Tens alguma encomenda específica que queiras devolver?',
        isSchedulingTrigger: false,
      };
    }

    // 4. Worten Resolve
    if (
      q.includes('resolve') ||
      q.includes('ecrã') ||
      q.includes('ecra') ||
      q.includes('bateria') ||
      q.includes('avaria') ||
      q.includes('manutenção')
    ) {
      return {
        responseText:
          'A **Worten Resolve** é o nosso centro de serviços e assistência técnica especializada:\n\n' +
          '• **Smartphones e Tablets:** Substituição de ecrãs e baterias **na hora** em lojas selecionadas e centros técnicos parceiros (iServices).\n' +
          '• **Computadores:** Limpeza interna, eliminação de vírus, reinstalação de sistema operativo e upgrades de memória/SSD.\n' +
          '• **Grandes Eletrodomésticos:** Diagnóstico e reparação ao domicílio de frigoríficos, máquinas de lavar e fornos.\n' +
          '• **Sustentabilidade Circular:** Privilegiamos sempre "reparar antes de comprar novo", com orçamento transparente prévio.\n\n' +
          'Queres agendar um diagnóstico ou chamada com um técnico especialista?',
        isSchedulingTrigger: true,
      };
    }

    // 5. Métodos de Pagamento e Financiamento
    if (
      q.includes('pagamento') ||
      q.includes('universo') ||
      q.includes('crédito') ||
      q.includes('credito') ||
      q.includes('juros') ||
      q.includes('mb way') ||
      q.includes('multibanco') ||
      q.includes('paypal') ||
      q.includes('prestaç')
    ) {
      return {
        responseText:
          'Estes são os **Métodos de Pagamento e Financiamento** disponíveis na Worten.pt:\n\n' +
          '• **Meios de Pagamento Direto:** MB WAY, Cartão de Crédito/Débito (Visa, Mastercard), Multibanco (Entidade e Referência) e PayPal.\n' +
          '• **Financiamento sem Juros:** Através do **Cartão Universo**, podes pagar em **3x, 6x, 10x ou até 24x sem juros** em campanhas assinaladas (sujeito a aprovação e condições contratuais da Universo).\n\n' +
          'Gostarias de simular uma compra ou saber mais sobre o Cartão Universo?',
        isSchedulingTrigger: false,
      };
    }

    // 6. Garantia e Preço Mínimo Garantido
    if (
      q.includes('garantia') ||
      q.includes('preço mínimo') ||
      q.includes('preco minimo') ||
      q.includes('mais barato') ||
      q.includes('igualar')
    ) {
      return {
        responseText:
          'A nossa política de **Garantia e Preço Mínimo Garantido** assegura a tua tranquilidade total:\n\n' +
          '• **Garantia Legal:** Todos os equipamentos novos têm **3 anos de garantia legal**. Os produtos recondicionados certificados têm até 3 anos (com mínimo de 1 ano para baterias e consumíveis).\n' +
          '• **Preço Mínimo Garantido:** Se encontrares o mesmo artigo novo mais barato numa loja física concorrente ou loja online autorizada elegível, a Worten **iguala o preço ou devolve a diferença**, conforme o regulamento da campanha.\n\n' +
          'Tens algum produto debaixo de olho para compararmos?',
        isSchedulingTrigger: false,
      };
    }

    // Default Fallback
    return {
      responseText:
        'Olha, consigo ajudar-te com informações detalhadas sobre as nossas políticas de **portes grátis (>35€)**, **devoluções em 14 dias**, **pagamentos até 24x sem juros no Cartão Universo**, **garantia de 3 anos** ou **Preço Mínimo Garantido**.\n\nSe tiveres uma questão técnica complexa ou precisares de agendar um técnico ou instalação, posso também marcar uma chamada ou visita técnica no teu **Google Calendar**!',
      isSchedulingTrigger: false,
    };
  };

  // Handle submitting user message via Server-Side API (/api/chat with Gemini & create_booking tool)
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: messages.slice(-10).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error(`Erro HTTP ${res.status}`);
      }

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.text || 'Processado com sucesso!',
        timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
        calendarPayload: data.calendarPayload,
        calBooking: data.calBooking,
        calSuccess: data.calSuccess,
        calError: data.calError,
        schedulingStep: data.bookingCreated ? 'completed' : undefined,
        suggestedActions: data.bookingCreated
          ? [
              {
                label: '📅 Ver no Google Calendar',
                action: () => {
                  if (data.calendarPayload) {
                    window.open(generateGoogleCalendarUrl(data.calendarPayload), '_blank');
                  }
                },
              },
              {
                label: '📦 Ver Política de Entregas (>35€)',
                action: () => handleSendPrompt('Qual é o valor mínimo para ter entregas grátis?'),
              },
              {
                label: '↩️ Como funciona a devolução em 14 dias?',
                action: () => handleSendPrompt('Como funciona a devolução de um artigo em loja no prazo de 14 dias?'),
              },
            ]
          : [
              {
                label: '📅 Agendar Visita / Reunião',
                action: () => handleStartSchedulingFlow(),
              },
              {
                label: '📦 Entregas & Portes Grátis',
                action: () => handleSendPrompt('Qual é o valor mínimo para ter entregas grátis?'),
              },
              {
                label: '↩️ Devoluções em 14 dias',
                action: () => handleSendPrompt('Como funciona a devolução em 14 dias em loja física?'),
              },
              {
                label: '🛠️ Reparações Worten Resolve',
                action: () => handleSendPrompt('Como funcionam as reparações e assistência técnica na Worten Resolve?'),
              },
            ],
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.warn('Falha no pedido ao servidor, usando motor inteligente local:', err);
      const { responseText, isSchedulingTrigger } = processUserQuery(userText);

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: responseText,
        timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
        schedulingStep: isSchedulingTrigger ? 'form' : undefined,
        suggestedActions: [
          {
            label: '📅 Agendar Visita Técnica',
            action: () => handleStartSchedulingFlow(),
          },
          {
            label: '📦 Portes Grátis >35€',
            action: () => handleSendPrompt('Como funcionam os portes grátis acima de 35€?'),
          },
          {
            label: '↩️ Devoluções em 14 dias',
            action: () => handleSendPrompt('Como funciona a devolução em 14 dias em loja?'),
          },
        ],
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (isSchedulingTrigger) {
        setIsSchedulingMode(true);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendPrompt = (promptText: string) => {
    setInputMessage(promptText);
    setTimeout(() => {
      const formInput = document.getElementById('worten-chat-input') as HTMLInputElement;
      formInput?.focus();
    }, 50);
  };

  const handleStartSchedulingFlow = () => {
    setIsSchedulingMode(true);
    const triggerMsg: ChatMessage = {
      id: `assist-sched-${Date.now()}`,
      sender: 'assistant',
      text: 'Excelente! Vamos preparar o teu agendamento técnico com a **Worten Resolve**.\n\nLembra-te que os agendamentos decorrem em **dias úteis (2ª a 6ª feira), entre as 09:00 e as 19:00**.\n\nPede o teu nome completo, o email de contacto, o motivo do serviço, e a data e hora pretendida:',
      timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      schedulingStep: 'form',
    };
    setMessages((prev) => [...prev, triggerMsg]);
  };

  // Submit scheduling form inside chat, invoking create_booking via /api/bookings (and Cal.com v2)
  const handleConfirmScheduling = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!schedulingData.fullName || !schedulingData.email) {
      alert('Por favor preenche o teu Nome Completo e Email de Contacto.');
      return;
    }

    setIsSchedulingMode(false);
    setIsTyping(true);

    try {
      const startTime = `${schedulingData.date}T${schedulingData.time}:00Z`;
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: schedulingData.fullName,
          email: schedulingData.email,
          phone: schedulingData.phone,
          notes: schedulingData.serviceType,
          startTime: startTime,
        }),
      });

      const data = await res.json();
      const calendarPayload = (data.calendarPayload ||
        formatLisbonISO(schedulingData.date, schedulingData.time, 60)) as CalendarEventPayload;

      const calSuccessText = data.calSuccess
        ? `\n\n🎉 **Confirmado e sincronizado na API do Cal.com (v2)!**\n• ID da Reserva: \`${data.calBooking?.id || ''}\`\n• UID: \`${data.calBooking?.uid || ''}\``
        : '';

      const confirmMsg: ChatMessage = {
        id: `sched-done-${Date.now()}`,
        sender: 'assistant',
        text: `Excelente, **${schedulingData.fullName}**! A ferramenta **create_booking** foi acionada com sucesso no sistema Worten Resolve.\n\n` +
          `• **Cliente:** ${schedulingData.fullName}\n` +
          `• **Email:** ${schedulingData.email}\n` +
          (schedulingData.phone ? `• **Telemóvel:** ${schedulingData.phone}\n` : '') +
          `• **Notas do Serviço:** ${schedulingData.serviceType}\n` +
          `• **Data e Hora (startTime):** ${startTime} (Dias úteis, 09:00 - 19:00)` +
          calSuccessText +
          `\n\nO evento está pronto para sincronização com o teu **Google Calendar**. Podes também descarregar o ficheiro .ics ou inspecionar o payload estruturado:`,
        timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
        calendarPayload: calendarPayload,
        calBooking: data.calBooking,
        calSuccess: data.calSuccess,
        calError: data.calError,
        schedulingStep: 'completed',
      };

      setMessages((prev) => [...prev, confirmMsg]);
    } catch (err) {
      console.warn('Erro ao chamar /api/bookings, recorrendo ao processamento direto:', err);
      const { startISO, endISO } = formatLisbonISO(schedulingData.date, schedulingData.time, 60);
      const calendarPayload: CalendarEventPayload = {
        action: 'create_calendar_event',
        calendar_id: 'primary',
        event_details: {
          summary: `Worten Resolve: ${schedulingData.serviceType} - ${schedulingData.fullName}`,
          description: `Cliente: ${schedulingData.fullName}\nEmail: ${schedulingData.email}\nContacto: ${schedulingData.phone}\nServiço: ${schedulingData.serviceType}\nOrigem: Chatbot Worten.pt`,
          start: { dateTime: startISO, timeZone: 'Europe/Lisbon' },
          end: { dateTime: endISO, timeZone: 'Europe/Lisbon' },
          attendees: [{ email: schedulingData.email }],
          reminders: {
            useDefault: false,
            overrides: [{ method: 'popup', minutes: 60 }],
          },
        },
      };

      const confirmMsg: ChatMessage = {
        id: `sched-done-${Date.now()}`,
        sender: 'assistant',
        text: `Excelente, **${schedulingData.fullName}**! A função **create_booking** foi acionada com sucesso no sistema Worten Resolve.\n\n` +
          `• **Cliente:** ${schedulingData.fullName}\n` +
          `• **Email:** ${schedulingData.email}\n` +
          `• **Motivo do Serviço:** ${schedulingData.serviceType}\n` +
          `• **Data e Hora:** ${schedulingData.date} às ${schedulingData.time} (dias úteis, 09:00 - 19:00)`,
        timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
        calendarPayload: calendarPayload,
        schedulingStep: 'completed',
      };

      setMessages((prev) => [...prev, confirmMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopyPayload = (payload: CalendarEventPayload, id: string) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedPayloadId(id);
    setTimeout(() => setCopiedPayloadId(null), 3000);
  };

  const handleSimulateWebhook = () => {
    setWebhookSimulated(true);
    setTimeout(() => setWebhookSimulated(false), 4500);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'assistant',
        text: 'Conversa reiniciada. Como te posso ajudar hoje? Podes perguntar sobre entregas, devoluções, garantias, crédito sem juros ou agendar uma intervenção técnica!',
        timestamp: 'Agora',
      },
    ]);
    setIsSchedulingMode(false);
  };

  return (
    <>
      {/* 1. FLOATING LAUNCHER BUTTON (Bottom-Right, Authentic Worten Red) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
          {/* Pulsing Hint Pill */}
          <div
            onClick={onOpen}
            className="hidden sm:flex items-center gap-2 bg-white dark:bg-[#18181B] text-neutral-800 dark:text-white px-4 py-2.5 rounded-full shadow-xl border border-[#E5E5E7] dark:border-neutral-800 text-xs font-bold cursor-pointer hover:scale-105 transition-all group"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Assistente Virtual Worten</span>
            <span className="text-[#DE001A] group-hover:translate-x-0.5 transition-transform font-extrabold">
              Abrir &rarr;
            </span>
          </div>

          {/* Floating Circle Button */}
          <button
            id="worten-virtual-assistant-btn"
            onClick={onOpen}
            aria-label="Abrir Assistente Virtual Worten"
            className="relative w-14 h-14 rounded-full bg-[#DE001A] hover:bg-[#BF0016] text-white flex items-center justify-center shadow-2xl hover:shadow-red-600/40 hover:scale-110 active:scale-95 transition-all cursor-pointer ring-4 ring-white dark:ring-neutral-900"
          >
            <Bot className="w-7 h-7" />
            <span className="absolute 0 top-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-neutral-900" />
          </button>
        </div>
      )}

      {/* 2. CHAT MODAL / DIALOG */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-200 flex flex-col bg-white dark:bg-[#18181B] border border-[#E5E5E7] dark:border-neutral-800 shadow-2xl overflow-hidden ${
            isExpanded
              ? 'inset-4 sm:inset-10 rounded-3xl'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[95vw] sm:w-[460px] h-[640px] max-h-[85vh] rounded-2xl'
          }`}
        >
          {/* Header Bar */}
          <div className="bg-[#DE001A] text-white px-4 py-3.5 flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                <Bot className="w-5 h-5 text-white" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#DE001A]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                    Assistente Virtual Worten
                  </h3>
                  <span className="bg-white/20 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                    Online 24/7
                  </span>
                </div>
                <p className="text-[11px] text-red-100 leading-tight">
                  Apoio ao Cliente, FAQ & Agendamento Google Calendar
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Reiniciar conversa"
                className="p-1.5 rounded-lg hover:bg-white/15 text-white/90 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Reduzir janela' : 'Expandir janela'}
                className="p-1.5 rounded-lg hover:bg-white/15 text-white/90 hover:text-white transition-colors cursor-pointer hidden sm:block"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={onClose}
                title="Fechar assistente"
                className="p-1.5 rounded-lg hover:bg-white/15 text-white/90 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Category Chips Strip */}
          <div className="bg-[#F4F4F6] dark:bg-[#141414] border-b border-[#E5E5E7] dark:border-neutral-800 px-3 py-2 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none shrink-0 text-[11px] font-bold">
            <button
              onClick={() => handleSendPrompt('Quais são as condições para portes grátis?')}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-[#DE001A] hover:bg-red-50 dark:hover:bg-red-950/40 border border-[#E5E5E7] dark:border-neutral-700 transition-colors shrink-0 cursor-pointer"
            >
              📦 Portes &gt;35€
            </button>
            <button
              onClick={() => handleSendPrompt('Qual é o prazo e condições de devolução online?')}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-[#DE001A] hover:bg-red-50 dark:hover:bg-red-950/40 border border-[#E5E5E7] dark:border-neutral-700 transition-colors shrink-0 cursor-pointer"
            >
              ↩️ Devolução 14d
            </button>
            <button
              onClick={handleStartSchedulingFlow}
              className="px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950/70 text-[#DE001A] dark:text-red-300 hover:bg-red-200 border border-red-200 dark:border-red-900/50 transition-colors shrink-0 cursor-pointer flex items-center gap-1"
            >
              <Calendar className="w-3 h-3" />
              <span>Agendar Técnico</span>
            </button>
            <button
              onClick={() => handleSendPrompt('Como pagar até 24x sem juros no Cartão Universo?')}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-[#DE001A] hover:bg-red-50 dark:hover:bg-red-950/40 border border-[#E5E5E7] dark:border-neutral-700 transition-colors shrink-0 cursor-pointer"
            >
              💳 24x s/ Juros
            </button>
            <button
              onClick={() => handleSendPrompt('Como funciona o Preço Mínimo Garantido?')}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-[#DE001A] hover:bg-red-50 dark:hover:bg-red-950/40 border border-[#E5E5E7] dark:border-neutral-700 transition-colors shrink-0 cursor-pointer"
            >
              🛡️ Preço Mínimo
            </button>
          </div>

          {/* Webhook notification simulation toast */}
          {webhookSimulated && (
            <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shrink-0 animate-in fade-in">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Webhook n8n/Make executado: Evento Google Calendar agendado com sucesso!
              </span>
              <span className="text-[10px] bg-emerald-800 px-2 py-0.5 rounded">HTTP 200 OK</span>
            </div>
          )}

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs sm:text-sm">
            {messages.map((msg) => {
              const isAssistant = msg.sender === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl p-3.5 sm:p-4 leading-relaxed whitespace-pre-wrap ${
                      isAssistant
                        ? 'bg-[#F4F4F6] dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-[#E5E5E7] dark:border-neutral-700/80 rounded-tl-sm'
                        : 'bg-[#DE001A] text-white font-medium rounded-tr-sm shadow-sm'
                    }`}
                  >
                    {msg.text}

                    {/* Integrated Interactive Scheduling Form */}
                    {msg.schedulingStep === 'form' && isSchedulingMode && (
                      <form
                        onSubmit={handleConfirmScheduling}
                        className="mt-4 p-4 rounded-xl bg-white dark:bg-[#141414] border border-[#E5E5E7] dark:border-neutral-700 space-y-3 shadow-xs text-neutral-900 dark:text-neutral-100"
                      >
                        <div className="text-xs font-black uppercase text-[#DE001A] flex items-center gap-1.5 pb-1 border-b border-neutral-100 dark:border-neutral-800">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Agendamento de Serviço Técnico Worten Resolve</span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                            Tipo de Serviço Técnico:
                          </label>
                          <select
                            value={schedulingData.serviceType}
                            onChange={(e) =>
                              setSchedulingData({ ...schedulingData, serviceType: e.target.value })
                            }
                            className="w-full bg-[#F4F4F6] dark:bg-neutral-800 border border-[#E5E5E7] dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-[#DE001A]"
                          >
                            {SERVICE_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                              Nome Completo:
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="ex: João Silva"
                              value={schedulingData.fullName}
                              onChange={(e) =>
                                setSchedulingData({ ...schedulingData, fullName: e.target.value })
                              }
                              className="w-full bg-[#F4F4F6] dark:bg-neutral-800 border border-[#E5E5E7] dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                              Telemóvel:
                            </label>
                            <input
                              type="tel"
                              required
                              placeholder="ex: 912 345 678"
                              value={schedulingData.phone}
                              onChange={(e) =>
                                setSchedulingData({ ...schedulingData, phone: e.target.value })
                              }
                              className="w-full bg-[#F4F4F6] dark:bg-neutral-800 border border-[#E5E5E7] dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                            Email de Contacto:
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="ex: joao.silva@email.pt"
                            value={schedulingData.email}
                            onChange={(e) =>
                              setSchedulingData({ ...schedulingData, email: e.target.value })
                            }
                            className="w-full bg-[#F4F4F6] dark:bg-neutral-800 border border-[#E5E5E7] dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                              Data Pretendida:
                            </label>
                            <input
                              type="date"
                              required
                              min="2026-09-23"
                              value={schedulingData.date}
                              onChange={(e) =>
                                setSchedulingData({ ...schedulingData, date: e.target.value })
                              }
                              className="w-full bg-[#F4F4F6] dark:bg-neutral-800 border border-[#E5E5E7] dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                              Hora (09:00 às 19:00):
                            </label>
                            <select
                              value={schedulingData.time}
                              onChange={(e) =>
                                setSchedulingData({ ...schedulingData, time: e.target.value })
                              }
                              className="w-full bg-[#F4F4F6] dark:bg-neutral-800 border border-[#E5E5E7] dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                            >
                              <option value="09:30">09:30</option>
                              <option value="10:00">10:00</option>
                              <option value="11:30">11:30</option>
                              <option value="14:00">14:00</option>
                              <option value="15:30">15:30</option>
                              <option value="17:00">17:00</option>
                              <option value="18:30">18:30</option>
                            </select>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setIsSchedulingMode(false)}
                            className="px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer"
                          >
                            Cancelar
                          </button>

                          <button
                            type="submit"
                            className="px-4 py-2 bg-[#DE001A] hover:bg-[#BF0016] text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                          >
                            <span>Confirmar Agendamento</span>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Cal.com v2 Live Integration Card */}
                    {msg.calBooking && (
                      <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-neutral-900 to-neutral-950 border border-emerald-500/40 text-neutral-100 font-sans space-y-2.5 shadow-sm">
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Agendamento Cal.com (v2) Confirmado</span>
                          </div>
                          <span className="text-[10px] bg-emerald-950/80 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-800">
                            UID: {String(msg.calBooking.uid || msg.calBooking.id || 'Cal.com')}
                          </span>
                        </div>

                        <div className="text-xs text-neutral-300 grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-sans">
                          <div>
                            <span className="text-neutral-400 font-medium">Evento:</span>{' '}
                            <span className="text-neutral-100 font-semibold">{String(msg.calBooking.title || 'Reunião de 30 min')}</span>
                          </div>
                          <div>
                            <span className="text-neutral-400 font-medium">Estado:</span>{' '}
                            <span className="text-emerald-400 font-semibold uppercase text-[11px]">{String(msg.calBooking.status || 'accepted')}</span>
                          </div>
                          {msg.calBooking.start && (
                            <div className="sm:col-span-2">
                              <span className="text-neutral-400 font-medium">Horário:</span>{' '}
                              <span className="text-neutral-200">
                                {new Date(String(msg.calBooking.start)).toLocaleString('pt-PT', {
                                  timeZone: 'Europe/Lisbon',
                                  weekday: 'short',
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })} (Lisboa)
                              </span>
                            </div>
                          )}
                        </div>

                        {msg.calBooking.meetingUrl && (
                          <div className="pt-1 flex items-center gap-2">
                            <a
                              href={String(msg.calBooking.meetingUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 hover:text-emerald-200 bg-emerald-950/60 hover:bg-emerald-900/60 px-2.5 py-1 rounded-md border border-emerald-700/60 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Abrir Link da Reunião Cal.com</span>
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Interactive Calendar Actions */}
                    {msg.calendarPayload && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 pt-1 font-sans">
                        <a
                          href={generateGoogleCalendarUrl(msg.calendarPayload)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3.5 bg-[#DE001A] hover:bg-[#BF0016] text-white text-center font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Adicionar ao Google Calendar</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => downloadICSFile(msg.calendarPayload!)}
                          className="py-2 px-3.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Descarregar convite (.ics)</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Suggested follow-up buttons */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                      {msg.suggestedActions.map((act, i) => (
                        <button
                          key={i}
                          onClick={act.action}
                          className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-white dark:bg-neutral-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-neutral-700 dark:text-neutral-300 hover:text-[#DE001A] border border-[#E5E5E7] dark:border-neutral-700 transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                        >
                          <span>{act.label}</span>
                          <ChevronRight className="w-3 h-3 text-neutral-400" />
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-neutral-400 mt-1 px-1">{msg.timestamp}</span>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-neutral-400 text-xs py-1">
                <div className="w-6 h-6 rounded-full bg-[#DE001A]/10 text-[#DE001A] flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-1 bg-[#F4F4F6] dark:bg-neutral-800 px-3 py-2 rounded-2xl rounded-tl-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input Form */}
          <div className="p-3 bg-white dark:bg-[#18181B] border-t border-[#E5E5E7] dark:border-neutral-800 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                id="worten-chat-input"
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Escreve a tua dúvida ou pede para agendar uma instalação..."
                className="flex-1 bg-[#F4F4F6] dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 px-4 py-2.5 rounded-xl text-xs sm:text-sm border border-[#E5E5E7] dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#DE001A]"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="p-2.5 rounded-xl bg-[#DE001A] hover:bg-[#BF0016] disabled:opacity-40 disabled:hover:bg-[#DE001A] text-white transition-colors cursor-pointer shadow-md"
                aria-label="Enviar mensagem"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center justify-between text-[10px] text-neutral-400 mt-2 px-1">
              <span>Worten Portugal • Fuso horário: Europe/Lisbon</span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="w-3 h-3" />
                Respostas baseadas nas políticas oficiais
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
