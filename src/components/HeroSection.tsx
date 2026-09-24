import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Truck,
  CreditCard,
  RotateCcw,
  Store,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Info,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { HERO_SLIDES } from '../data/landingData';

interface HeroSectionProps {
  onNavigateTo: (sectionId: string) => void;
  onSelectDeal: (dealTitle: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onNavigateTo,
  onSelectDeal,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState<string | null>(null);

  // Live countdown for campaign urgency
  const [countdown, setCountdown] = useState({
    days: 2,
    hours: 14,
    minutes: 38,
    seconds: 45,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalSlides = HERO_SLIDES.length;

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, totalSlides]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const slide = HERO_SLIDES[currentSlide];

  const riskProps = [
    {
      id: 'shipping',
      icon: Truck,
      title: 'Entregas Grátis > 35€',
      subtitle: 'Pequenos formatos em 24/48h',
      detail:
        'Envio 100% gratuito para Portugal Continental em encomendas acima de 35€. Sem taxas de processamento surpresa no checkout.',
    },
    {
      id: 'financing',
      icon: CreditCard,
      title: '10x s/ juros',
      subtitle: 'Em compras superiores a 185€',
      detail:
        'Financiamento transparente em até 10x ou 24x sem juros através do Cartão Universo. Sem custos ocultos na tua fatura.',
    },
    {
      id: 'returns',
      icon: RotateCcw,
      title: 'Devoluções grátis em loja',
      subtitle: '30 dias de total tranquilidade',
      detail:
        'Não gostaste ou mudaste de ideias? Devolve gratuitamente em qualquer uma das mais de 250 lojas Worten em Portugal.',
    },
    {
      id: 'pricematch',
      icon: ShieldCheck,
      title: 'Preço mínimo garantido',
      subtitle: 'Igualamos a concorrência direta',
      detail:
        'Se encontrares o mesmo artigo novo mais barato num retalhista concorrente autorizado, igualamos o preço de imediato.',
    },
    {
      id: 'clickcollect',
      icon: Store,
      title: 'Click & Collect 15 min',
      subtitle: 'Levantamento grátis na tua loja',
      detail:
        'Compra online e levanta sem filas na tua loja mais próxima. Disponível em apenas 15 minutos com aviso por SMS.',
    },
  ];

  return (
    <section id="hero" className="relative bg-[#F4F4F6] text-neutral-900 overflow-hidden">
      {/* Dynamic Promotional Hero Carousel (Worten Red #DF0000 Banner) */}
      <div
        className="relative min-h-[420px] sm:min-h-[460px] md:min-h-[500px] flex items-center bg-gradient-to-r from-[#DE001A] via-[#CD0018] to-[#990013] text-white"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Subtle decorative grid/glow pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_70%)] pointer-events-none" />

        {/* Carousel Slide Content */}
        <div className="relative max-w-7xl mx-auto px-4 py-8 md:py-12 w-full z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              {/* Badges & Live Countdown Tag */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="px-3 py-1 bg-white text-[#DE001A] text-xs font-black uppercase tracking-wider rounded-md shadow-sm flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#DE001A]" />
                  {slide.badge}
                </span>
                <span className="px-3 py-1 bg-black/30 text-white text-xs font-bold rounded-md border border-white/20">
                  {slide.category}
                </span>
                {/* Live Urgency Countdown Pill */}
                <span className="px-3 py-1 bg-amber-400 text-neutral-950 text-xs font-black rounded-md flex items-center gap-1.5 shadow-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Termina em: {String(countdown.days).padStart(2, '0')}d {String(countdown.hours).padStart(2, '0')}h {String(countdown.minutes).padStart(2, '0')}m {String(countdown.seconds).padStart(2, '0')}s
                  </span>
                </span>
              </div>

              {/* Promotional Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                {slide.headline}
              </h1>

              <p className="text-base sm:text-lg text-red-50 max-w-2xl leading-relaxed font-normal">
                {slide.subheadline}
              </p>

              {/* Legal micro-copy */}
              {slide.legalText && (
                <p className="text-xs text-red-200 max-w-xl italic flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-red-200 shrink-0" />
                  <span>{slide.legalText}</span>
                </p>
              )}

              {/* Interactive Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <button
                  id={`hero-slide-cta-${slide.id}`}
                  onClick={() => {
                    onSelectDeal(slide.headline);
                    onNavigateTo('promocoes');
                  }}
                  className="px-6 py-3.5 bg-white hover:bg-neutral-100 text-[#DE001A] font-black text-sm sm:text-base rounded-xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
                >
                  <span>{slide.ctaText}</span>
                  <ArrowRight className="w-4 h-4 text-[#DE001A]" />
                </button>

                <button
                  onClick={() => onNavigateTo('resolve-calculator')}
                  className="px-5 py-3.5 bg-black/25 hover:bg-black/40 text-white font-bold text-sm rounded-xl border border-white/30 backdrop-blur-xs transition-all cursor-pointer"
                >
                  Worten Resolve
                </button>

                <span className="text-xs text-red-100 font-semibold hidden sm:inline">
                  ⚡ Stock limitado a preços promocionais
                </span>
              </div>
            </div>

            {/* Right Product Photograph Showcase Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md rounded-2xl bg-white text-neutral-900 border-2 border-white/80 shadow-2xl overflow-hidden group">
                {/* Product Image Container */}
                <div className="relative h-56 sm:h-64 bg-neutral-100 overflow-hidden">
                  {slide.imageUrl ? (
                    <img
                      src={slide.imageUrl}
                      alt={slide.headline}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-200 text-neutral-400">
                      Worten Destaque
                    </div>
                  )}
                  {/* Badge floating over photo */}
                  <div className="absolute top-3 left-3 bg-[#DE001A] text-white px-3 py-1.5 rounded-lg font-black text-sm shadow-md uppercase tracking-wide">
                    {slide.highlightStat}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-neutral-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-md">
                    {slide.tag}
                  </div>
                </div>

                {/* Card Summary footer */}
                <div className="p-4 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-neutral-900 uppercase tracking-wide">
                      {slide.highlightLabel}
                    </span>
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Garantia 3 Anos
                    </span>
                  </div>
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-600">
                    <span>Acumula Cartão Continente:</span>
                    <strong className="text-[#DE001A] font-extrabold">Até 15%</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Navigation Arrows */}
        <button
          onClick={prevSlide}
          aria-label="Slide anterior"
          className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 hover:bg-white text-[#DE001A] shadow-md transition-colors z-20 cursor-pointer hidden sm:flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={nextSlide}
          aria-label="Slide seguinte"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 hover:bg-white text-[#DE001A] shadow-md transition-colors z-20 cursor-pointer hidden sm:flex items-center justify-center"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Carousel Indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {HERO_SLIDES.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Ir para slide ${idx + 1}: ${s.headline}`}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === currentSlide
                  ? 'w-8 bg-white'
                  : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 3. BARRA DE CONFIANÇA E REVERSÃO DE RISCO (Worten.pt Trust Bar) */}
      <div className="bg-white border-b border-[#E5E5E7] py-3.5 px-4 shadow-xs">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
            {riskProps.map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => setShowRiskModal(item.id)}
                  className="p-2.5 sm:p-3 rounded-xl bg-[#F4F4F6] hover:bg-white border border-[#E5E5E7] hover:border-[#DE001A] transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-white text-[#DE001A] border border-neutral-200 group-hover:bg-[#DE001A] group-hover:text-white transition-colors shrink-0 shadow-2xs">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-extrabold text-neutral-900 truncate group-hover:text-[#DE001A] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-neutral-500 leading-snug truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Risk Reversal Detail Popover Modal */}
      {showRiskModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-neutral-200 rounded-2xl max-w-md w-full p-6 text-neutral-900 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h4 className="text-lg font-extrabold text-neutral-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#DE001A]" />
                Garantia de Compra Segura Worten
              </h4>
              <button
                onClick={() => setShowRiskModal(null)}
                className="text-neutral-400 hover:text-neutral-700 text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {riskProps
              .filter((r) => r.id === showRiskModal)
              .map((r) => (
                <div key={r.id} className="space-y-3">
                  <div className="text-base font-bold text-[#DE001A]">{r.title}</div>
                  <p className="text-sm text-neutral-600 leading-relaxed">{r.detail}</p>
                  <div className="bg-[#F4F4F6] p-3 rounded-lg border border-[#E5E5E7] text-xs text-neutral-600">
                    Aplicável a todas as encomendas em Worten.pt e na rede de mais de 250 lojas físicas em Portugal.
                  </div>
                </div>
              ))}

            <button
              onClick={() => setShowRiskModal(null)}
              className="w-full py-2.5 bg-[#DE001A] hover:bg-[#BF0016] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
