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

  const isCoffeeSlide = slide.bannerTheme === 'coffee';

  return (
    <section id="hero" className="relative bg-[#F4F4F6] text-neutral-900 overflow-hidden">
      {/* Dynamic Promotional Hero Carousel Banner */}
      <div
        className={`relative min-h-[380px] sm:min-h-[420px] md:min-h-[460px] flex items-center transition-colors duration-500 overflow-hidden ${
          isCoffeeSlide
            ? 'bg-[#E6D7C3] text-neutral-900'
            : 'bg-gradient-to-r from-[#DE001A] via-[#CD0018] to-[#990013] text-white'
        }`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Top-Right Pause / Play control */}
        <button
          onClick={() => setIsPaused(!isPaused)}
          aria-label={isPaused ? 'Continuar carrossel' : 'Pausar carrossel'}
          className="absolute top-4 right-4 z-30 p-2 rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-black/5 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-0.5 text-xs font-mono font-bold tracking-widest px-1">
            {isPaused ? '▶' : '❚❚'}
          </div>
        </button>

        {isCoffeeSlide ? (
          /* ============================================================
             1. WORTEN COFFEE CAMPAIGN BANNER (Exactly matching Image 1)
             ============================================================ */
          <div className="relative max-w-7xl mx-auto px-4 py-8 md:py-10 w-full z-10">
            {/* Coffee beans decorative doodle SVG backgrounds */}
            <div className="absolute left-2 top-4 opacity-25 pointer-events-none hidden md:block">
              <svg width="70" height="70" viewBox="0 0 100 100" fill="none" stroke="#6F4E37" strokeWidth="3">
                <ellipse cx="50" cy="50" rx="35" ry="22" transform="rotate(-30 50 50)" />
                <path d="M28 35 Q50 50 72 65" />
              </svg>
            </div>
            <div className="absolute left-4 bottom-4 opacity-20 pointer-events-none hidden md:block">
              <svg width="90" height="90" viewBox="0 0 120 120" fill="none" stroke="#4A3525" strokeWidth="2.5">
                <path d="M10 110 Q50 80 70 30" />
                <ellipse cx="65" cy="40" rx="14" ry="7" transform="rotate(-40 65 40)" />
                <ellipse cx="45" cy="70" rx="12" ry="6" transform="rotate(30 45 70)" />
              </svg>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-center">
              {/* Left Column: Coffee Machines Showcase Composition */}
              <div className="lg:col-span-6 flex items-center justify-center relative order-2 lg:order-1">
                {/* Subtle soft backdrop shape behind machines */}
                <div className="absolute -inset-2 sm:inset-0 bg-[#D9C4AC]/60 rounded-3xl -z-0 pointer-events-none" />

                <div className="relative z-10 flex items-end justify-center gap-2 sm:gap-4 p-2 sm:p-4">
                  {/* Machine 1: Delta Q compact with espresso glass */}
                  <div className="w-24 sm:w-32 md:w-36 flex flex-col items-center shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80"
                      alt="Delta Q Máquina de Café de Cápsulas"
                      className="w-full h-36 sm:h-48 md:h-56 object-contain filter drop-shadow-xl hover:scale-105 transition-transform"
                    />
                    <span className="text-[10px] font-black text-neutral-700 uppercase mt-1">Delta Q</span>
                  </div>

                  {/* Machine 2: DeLonghi Magnifica bean-to-cup */}
                  <div className="w-28 sm:w-40 md:w-44 flex flex-col items-center shrink-0 -translate-y-2">
                    <img
                      src="https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=500&q=80"
                      alt="DeLonghi Magnifica EVO Máquina Automática"
                      className="w-full h-44 sm:h-56 md:h-64 object-contain filter drop-shadow-2xl hover:scale-105 transition-transform"
                    />
                    <span className="text-[10px] font-black text-neutral-800 uppercase mt-1">DeLonghi Magnifica</span>
                  </div>

                  {/* Machine 3: Sage Barista Express in stainless steel */}
                  <div className="w-32 sm:w-44 md:w-48 flex flex-col items-center shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=500&q=80"
                      alt="Sage Barista Máquina de Café Manual"
                      className="w-full h-40 sm:h-52 md:h-60 object-contain filter drop-shadow-xl hover:scale-105 transition-transform"
                    />
                    <span className="text-[10px] font-black text-neutral-700 uppercase mt-1">Sage Barista</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Exact Copy & Call to Action */}
              <div className="lg:col-span-6 space-y-4 md:space-y-5 text-left order-1 lg:order-2 pl-0 lg:pl-4">
                {/* Subtitle tag */}
                <div className="text-xs sm:text-sm font-extrabold text-neutral-800 tracking-wider uppercase">
                  {slide.bannerSubtitle || 'PROMOÇÃO NOS PRODUTOS ASSINALADOS 9 A 29 SET'}
                </div>

                {/* Main bold headline */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-900 tracking-tight leading-tight">
                  {slide.headline}
                </h1>

                {/* Primary Button */}
                <div className="pt-2">
                  <button
                    id="hero-coffee-cta-btn"
                    onClick={() => {
                      onSelectDeal('Máquinas de Café');
                      onNavigateTo('promocoes');
                    }}
                    className="px-8 py-3 bg-[#191919] hover:bg-black active:bg-neutral-800 text-white font-black text-xs sm:text-sm rounded-full transition-all shadow-md hover:shadow-lg uppercase tracking-wider cursor-pointer"
                  >
                    {slide.ctaText || 'VER PRODUTOS'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================
             2. WORTEN RED PROMOTIONAL BANNER
             ============================================================ */
          <div className="relative max-w-7xl mx-auto px-4 py-8 md:py-12 w-full z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Content */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-6">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="px-3 py-1 bg-white text-[#DE001A] text-xs font-black uppercase tracking-wider rounded-md shadow-sm flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#DE001A]" />
                    {slide.badge}
                  </span>
                  <span className="px-3 py-1 bg-black/30 text-white text-xs font-bold rounded-md border border-white/20">
                    {slide.category}
                  </span>
                  <span className="px-3 py-1 bg-amber-400 text-neutral-950 text-xs font-black rounded-md flex items-center gap-1.5 shadow-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      Termina em: {String(countdown.days).padStart(2, '0')}d {String(countdown.hours).padStart(2, '0')}h {String(countdown.minutes).padStart(2, '0')}m {String(countdown.seconds).padStart(2, '0')}s
                    </span>
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                  {slide.headline}
                </h1>

                <p className="text-base sm:text-lg text-red-50 max-w-2xl leading-relaxed font-normal">
                  {slide.subheadline}
                </p>

                {slide.legalText && (
                  <p className="text-xs text-red-200 max-w-xl italic flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-red-200 shrink-0" />
                    <span>{slide.legalText}</span>
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3.5 pt-1">
                  <button
                    id={`hero-slide-cta-${slide.id}`}
                    onClick={() => {
                      onSelectDeal(slide.headline);
                      onNavigateTo('promocoes');
                    }}
                    className="px-7 py-3 bg-[#191919] hover:bg-black text-white font-black text-xs sm:text-sm rounded-full transition-all shadow-xl hover:shadow-2xl uppercase tracking-wider cursor-pointer"
                  >
                    <span>{slide.ctaText}</span>
                  </button>

                  <button
                    onClick={() => onNavigateTo('resolve-calculator')}
                    className="px-5 py-3 bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm rounded-full border border-white/30 backdrop-blur-xs transition-all cursor-pointer"
                  >
                    Worten Resolve
                  </button>
                </div>
              </div>

              {/* Right Product Photograph Showcase Card */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-md rounded-2xl bg-white text-neutral-900 border-2 border-white/80 shadow-2xl overflow-hidden group">
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
                    <div className="absolute top-3 left-3 bg-[#DE001A] text-white px-3 py-1.5 rounded-lg font-black text-sm shadow-md uppercase tracking-wide">
                      {slide.highlightStat}
                    </div>
                    <div className="absolute bottom-3 right-3 bg-neutral-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-md">
                      {slide.tag}
                    </div>
                  </div>

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
        )}

        {/* Carousel Slide Dots Indicator (with Elongated Red Bar matching Image 1) */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
          {HERO_SLIDES.map((s, idx) => {
            const isActive = currentSlide === idx;
            return (
              <button
                key={s.id}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Ir para slide ${idx + 1}`}
                className={`transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'w-7 h-1.5 bg-[#DE001A] rounded-full'
                    : 'w-1.5 h-1.5 bg-neutral-400/60 hover:bg-neutral-600 rounded-full'
                }`}
              />
            );
          })}
        </div>

        {/* Carousel Navigation Arrow on the Right Edge (matching Image 1) */}
        <button
          onClick={nextSlide}
          aria-label="Slide seguinte"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full text-neutral-700 hover:text-black transition-colors z-20 cursor-pointer flex items-center justify-center"
        >
          <ChevronRight className="w-6 h-6 stroke-[2.5]" />
        </button>
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
