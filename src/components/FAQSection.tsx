import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  Search,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Truck,
  RotateCcw,
  Wrench,
  Tag,
  Bot,
  Calendar,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { FAQ_LIST } from '../data/landingData';

interface FAQSectionProps {
  onOpenChatbot?: () => void;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ onOpenChatbot }) => {
  const [openId, setOpenId] = useState<string | null>('faq-1');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const toggleFAQ = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const categories = [
    { id: 'all', label: 'Todas as Dúvidas' },
    { id: 'promo', label: 'Talão & Promoções' },
    { id: 'shipping', label: 'Entregas & Recolha' },
    { id: 'financing', label: 'Crédito Sem Juros' },
    { id: 'resolve', label: 'Worten Resolve & Retoma' },
    { id: 'returns', label: 'Devoluções' },
    { id: 'services', label: 'Serviços Casa' },
  ];

  const filteredFAQs = FAQ_LIST.filter((item) => {
    const matchesCat = filterCategory === 'all' || item.category === filterCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <section id="faq" className="py-16 bg-white border-b border-[#E5E5E7]">
      <div className="max-w-4xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-[#DE001A] text-xs font-black uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-[#DE001A]" />
            Transparência & Desmistificação
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
            Perguntas Frequentes (FAQ)
          </h2>
          <p className="text-neutral-600 text-sm sm:text-base font-medium">
            Tudo o que precisas de saber sobre campanhas, financiamento sem juros, entregas, retomas e garantias.
          </p>
        </div>

        {/* Featured Assistant Banner */}
        <div className="mb-10 p-5 sm:p-6 rounded-3xl bg-red-50/70 border border-red-200 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#DE001A] text-white flex items-center justify-center shrink-0 shadow-md">
                <Bot className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-black text-neutral-900">
                    Assistente Virtual Worten & Agendamento
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online 24/7
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-xl font-medium">
                  Esclarece as tuas dúvidas sobre <strong>portes grátis (&gt;35€)</strong>, <strong>devoluções em 14 dias</strong>, <strong>garantia de 3 anos</strong> ou <strong>financiamento em 24x sem juros</strong>. E se precisares de um técnico da Worten Resolve, agendamos com <strong>sincronização direta no teu Google Calendar</strong>.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-bold text-neutral-600">
                  <span className="px-2 py-0.5 rounded-md bg-white border border-[#E5E5E7]">📦 Portes &gt;35€</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-[#E5E5E7]">↩️ Devoluções 14d</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-[#E5E5E7]">🛠️ Worten Resolve</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-[#E5E5E7]">💳 24x s/ Juros</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-[#E5E5E7]">📅 Google Calendar Sync</span>
                </div>
              </div>
            </div>

            {onOpenChatbot && (
              <button
                onClick={onOpenChatbot}
                className="w-full md:w-auto px-5 py-3 rounded-2xl bg-[#DE001A] hover:bg-[#BF0016] text-white font-black text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <Bot className="w-4 h-4" />
                <span>Falar com o Assistente</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="space-y-4 mb-8">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisa nas perguntas frequentes (ex: talão, sem juros, entregas, devoluções)..."
              className="w-full bg-[#F4F4F6] text-neutral-900 placeholder-neutral-500 pl-11 pr-4 py-3 rounded-2xl text-sm border border-[#E5E5E7] focus:outline-none focus:ring-2 focus:ring-[#DE001A] focus:border-[#DE001A] shadow-xs font-medium"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isActive = filterCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#DE001A] text-white shadow-xs font-black'
                      : 'bg-[#F4F4F6] text-neutral-700 border border-[#E5E5E7] hover:bg-neutral-200'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQ Accordion List (12 items) */}
        <div className="space-y-3">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-10 bg-[#F4F4F6] rounded-2xl border border-[#E5E5E7] p-6 text-neutral-500 font-medium">
              Nenhuma pergunta encontrada para "{searchQuery}". Tenta outros termos ou limpa a pesquisa.
            </div>
          ) : (
            filteredFAQs.map((faq, index) => {
              const isOpen = openId === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isOpen
                      ? 'bg-white border-[#DE001A]/40 shadow-md ring-1 ring-[#DE001A]/20'
                      : 'bg-[#F4F4F6] border-[#E5E5E7] hover:border-neutral-300'
                  }`}
                >
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-black text-neutral-900 text-sm sm:text-base hover:text-[#DE001A] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-red-50 text-[#DE001A] text-xs flex items-center justify-center font-black shrink-0 border border-red-200">
                        {index + 1}
                      </span>
                      <span>{faq.question}</span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 transition-transform text-neutral-400 ${
                        isOpen ? 'rotate-180 text-[#DE001A]' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-neutral-700 leading-relaxed border-t border-[#E5E5E7] mt-1 font-medium">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Need more help banner */}
        <div className="mt-8 p-4 rounded-2xl bg-red-50 border border-red-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#DE001A] text-white shrink-0 shadow-xs">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-neutral-900">
                Ficaste com alguma dúvida não esclarecida?
              </div>
              <div className="text-[11px] text-neutral-600 font-medium">
                A nossa equipa de apoio ao cliente e técnicos especializados estão disponíveis diariamente.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
            {onOpenChatbot && (
              <button
                onClick={onOpenChatbot}
                className="px-4 py-2 bg-[#DE001A] hover:bg-[#BF0016] text-white text-xs font-black rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Bot className="w-4 h-4" />
                <span>Falar com o Assistente</span>
              </button>
            )}
            <a
              href="tel:210155222"
              className="px-4 py-2 bg-white text-neutral-800 hover:bg-[#F4F4F6] text-xs font-bold rounded-xl whitespace-nowrap border border-[#E5E5E7] transition-colors"
            >
              Contactar Apoio (210 155 222)
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
