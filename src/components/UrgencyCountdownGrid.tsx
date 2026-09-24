import React, { useState, useEffect } from 'react';
import { Timer, ArrowRight, Flame, Sparkles, Tag, Gift } from 'lucide-react';

interface UrgencyCountdownGridProps {
  onSelectCategory: (categoryKey: string) => void;
  onNavigateTo: (sectionId: string) => void;
}

export const UrgencyCountdownGrid: React.FC<UrgencyCountdownGridProps> = ({
  onSelectCategory,
  onNavigateTo,
}) => {
  // Synchronized countdown timer (ending in e.g. 2 days, 14 hours, 32 mins)
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 14,
    minutes: 38,
    seconds: 45,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const navNodes = [
    { name: 'FRIGORÍFICOS', icon: '❄️', tag: 'Até -40%', catKey: 'appliances' },
    { name: 'MÁQUINAS ROUPA', icon: '🧺', tag: '20% Talão', catKey: 'appliances' },
    { name: 'PREPARAÇÃO ALIMENTOS', icon: '🍳', tag: 'Robots & Airfryers', catKey: 'appliances' },
    { name: 'MÁQUINAS CAFÉ', icon: '☕', tag: 'Até -45%', catKey: 'appliances' },
    { name: 'PORTÁTEIS', icon: '💻', tag: 'Até -250€', catKey: 'computing' },
    { name: 'TVS & SOM', icon: '📺', tag: 'Até -35%', catKey: 'tvs' },
  ];

  return (
    <section id="urgency-grid" className="py-8 bg-[#F4F4F6] border-b border-[#E5E5E7]">
      <div className="max-w-7xl mx-auto px-4">
        {/* Promotional Urgency Strip Banner */}
        <div className="bg-gradient-to-r from-[#DE001A] via-[#BF0016] to-[#A30013] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          {/* Subtle Graphic background effects */}
          <div className="absolute -right-8 -bottom-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
            {/* Urgency Headline & Value Multiplier */}
            <div className="space-y-2 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-white/30 backdrop-blur-xs">
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                Campanha Exclusiva em Vigor
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Aproveita! 20% desconto em talão em Eletrodomésticos, Portáteis e TVs
              </h2>
              <p className="text-red-100 text-sm flex flex-wrap items-center justify-center lg:justify-start gap-2 font-medium">
                <Gift className="w-4 h-4 text-amber-300 inline" />
                <span>Acumula até <strong>15% em Cartão Continente</strong> nos nossos parceiros.</span>
                <span className="hidden sm:inline">•</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-bold">Válido nos artigos assinalados</span>
              </p>
            </div>

            {/* Countdown Box (Crisp White Card with Red Counters) */}
            <div className="bg-white text-neutral-900 p-4 sm:p-5 rounded-2xl border-2 border-white/90 shadow-2xl flex flex-col items-center">
              <div className="text-[11px] font-black uppercase tracking-widest text-[#DE001A] flex items-center gap-1.5 mb-2.5">
                <Timer className="w-4 h-4 text-[#DE001A] animate-spin" />
                Termina em:
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-[#F4F4F6] border border-[#E5E5E7] rounded-xl px-2.5 py-1.5 min-w-[52px]">
                  <span className="text-2xl font-black text-neutral-900 block tabular-nums">
                    {String(timeLeft.days).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-extrabold text-neutral-500 uppercase tracking-wider block">
                    DIAS
                  </span>
                </div>
                <div className="bg-[#F4F4F6] border border-[#E5E5E7] rounded-xl px-2.5 py-1.5 min-w-[52px]">
                  <span className="text-2xl font-black text-neutral-900 block tabular-nums">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-extrabold text-neutral-500 uppercase tracking-wider block">
                    HORAS
                  </span>
                </div>
                <div className="bg-[#F4F4F6] border border-[#E5E5E7] rounded-xl px-2.5 py-1.5 min-w-[52px]">
                  <span className="text-2xl font-black text-neutral-900 block tabular-nums">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-extrabold text-neutral-500 uppercase tracking-wider block">
                    MIN
                  </span>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl px-2.5 py-1.5 min-w-[52px]">
                  <span className="text-2xl font-black text-[#DE001A] block tabular-nums">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] font-extrabold text-[#DE001A] uppercase tracking-wider block">
                    SEG
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Direct Nav Nodes Grid */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="text-xs font-bold uppercase tracking-wider text-red-100 mb-3 text-center lg:text-left">
              Acesso Rápido às Categorias em Campanha:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {navNodes.map((node) => (
                <button
                  key={node.name}
                  onClick={() => {
                    onSelectCategory(node.catKey);
                    onNavigateTo('promocoes');
                  }}
                  className="bg-white/10 hover:bg-white/25 active:bg-white/30 backdrop-blur-xs border border-white/20 rounded-xl p-3 text-left transition-all hover:-translate-y-0.5 group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg">{node.icon}</span>
                    <span className="text-[10px] font-black bg-white text-[#DE001A] px-1.5 py-0.5 rounded shadow-xs">
                      {node.tag}
                    </span>
                  </div>
                  <div className="text-xs font-extrabold text-white tracking-wide truncate group-hover:underline">
                    {node.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
