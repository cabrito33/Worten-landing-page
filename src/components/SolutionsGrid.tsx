import React from 'react';
import {
  Wrench,
  CreditCard,
  BadgePercent,
  Hammer,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { CORE_SOLUTIONS } from '../data/landingData';

interface SolutionsGridProps {
  onNavigateTo: (sectionId: string) => void;
  onOpenResolveCalculator: () => void;
}

export const SolutionsGrid: React.FC<SolutionsGridProps> = ({
  onNavigateTo,
  onOpenResolveCalculator,
}) => {
  const getSolutionIcon = (iconName: string) => {
    switch (iconName) {
      case 'Wrench':
        return Wrench;
      case 'CreditCard':
        return CreditCard;
      case 'BadgePercent':
        return BadgePercent;
      case 'Hammer':
        return Hammer;
      case 'ShieldCheck':
      default:
        return ShieldCheck;
    }
  };

  return (
    <section id="solucoes" className="py-16 bg-[#F4F4F6] border-b border-[#E5E5E7]">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-[#DE001A] text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Ecossistema de Soluções & Serviços
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
            Mais do que tecnologia: soluções de ponta a ponta
          </h2>
          <p className="text-neutral-600 text-base sm:text-lg leading-relaxed">
            Eliminamos os custos avultados, as dores de cabeça com avarias e as dúvidas sobre preços com garantias reais.
          </p>
        </div>

        {/* Feature Cards Grid (5 Core Features with outcome-focused benefits) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {CORE_SOLUTIONS.map((sol, index) => {
            const IconComp = getSolutionIcon(sol.icon);
            const isFeatured = index === 0;

            return (
              <div
                key={sol.id}
                className={`rounded-2xl p-6 transition-all flex flex-col justify-between border ${
                  isFeatured
                    ? 'bg-white border-2 border-[#DE001A] shadow-md md:col-span-2 lg:col-span-1'
                    : 'bg-white border-[#E5E5E7] hover:border-[#DE001A] shadow-xs'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-xl bg-red-50 text-[#DE001A] flex items-center justify-center border border-red-200 shrink-0">
                      <IconComp className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#DE001A] bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                      {sol.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-neutral-900 leading-tight mb-2">
                      {sol.name}
                    </h3>
                    {/* One-line benefit */}
                    <p className="text-sm text-neutral-600 leading-relaxed font-medium">
                      {sol.outcomeBenefit}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-[#E5E5E7] flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-black text-[#DE001A] block leading-none">
                      {sol.metric}
                    </span>
                    <span className="text-[11px] font-semibold text-neutral-500 block mt-1">
                      {sol.metricLabel}
                    </span>
                  </div>

                  {sol.id === 'sol-1' ? (
                    <button
                      onClick={onOpenResolveCalculator}
                      className="px-3 py-1.5 bg-[#DE001A] hover:bg-[#BF0016] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <span>Simulador</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onNavigateTo('promocoes')}
                      className="text-xs font-bold text-neutral-700 hover:text-[#DE001A] flex items-center gap-1 cursor-pointer"
                    >
                      <span>Saber mais</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Conversion CTA Banner (Worten Red Banner) */}
        <div className="bg-[#DE001A] text-white rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left relative overflow-hidden">
          <div className="space-y-2 max-w-2xl relative z-10">
            <span className="text-xs font-black uppercase tracking-widest text-red-100">
              Pronto para economizar com segurança?
            </span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Aproveita as melhores campanhas com até 24x sem juros e garantia total.
            </h3>
            <p className="text-red-100 text-sm font-medium">
              Preço mínimo garantido, entregas grátis acima de 35€ e assistência especializada em mais de 250 lojas.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto shrink-0 relative z-10">
            {/* Primary CTA */}
            <button
              id="solutions-primary-cta"
              onClick={() => onNavigateTo('promocoes')}
              className="w-full sm:w-auto px-7 py-4 bg-white hover:bg-neutral-100 text-[#DE001A] font-black text-sm rounded-xl transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Aproveitar Campanhas e Promoções</span>
              <ArrowRight className="w-4 h-4 text-[#DE001A]" />
            </button>

            {/* Secondary CTA */}
            <button
              id="solutions-secondary-cta"
              onClick={onOpenResolveCalculator}
              className="w-full sm:w-auto px-6 py-4 bg-black/20 hover:bg-black/30 text-white font-bold text-sm rounded-xl border border-white/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Simular Worten Resolve</span>
              <ExternalLink className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
