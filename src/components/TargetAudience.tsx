import React, { useState } from 'react';
import {
  PiggyBank,
  GraduationCap,
  Home,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { PERSONAS } from '../data/landingData';

interface TargetAudienceProps {
  onNavigateTo: (sectionId: string) => void;
  onSelectDealTag: (dealTag: string) => void;
}

export const TargetAudience: React.FC<TargetAudienceProps> = ({
  onNavigateTo,
  onSelectDealTag,
}) => {
  const [activePersonaId, setActivePersonaId] = useState('persona-1');

  const getPersonaIcon = (iconName: string) => {
    switch (iconName) {
      case 'PiggyBank':
        return PiggyBank;
      case 'GraduationCap':
        return GraduationCap;
      case 'Home':
      default:
        return Home;
    }
  };

  return (
    <section id="personas" className="py-16 bg-white border-b border-[#E5E5E7]">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-[#DE001A] text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Segmentação de Valor & Perfil de Utilizador
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
            Para quem é pensada a experiência Worten?
          </h2>
          <p className="text-neutral-600 text-base sm:text-lg leading-relaxed">
            Eliminamos os atritos de compra mais comuns com vantagens desenhadas para o teu perfil e necessidades reais.
          </p>
        </div>

        {/* Persona Selector Tabs for Mobile/Desktop */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 bg-[#F4F4F6] rounded-2xl border border-[#E5E5E7] overflow-x-auto max-w-full">
            {PERSONAS.map((p) => {
              const IconComp = getPersonaIcon(p.avatarIcon);
              const isActive = p.id === activePersonaId;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePersonaId(p.id)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#DE001A] text-white shadow-md font-black'
                      : 'text-neutral-600 hover:text-[#DE001A] hover:bg-white/60'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                  <span>{p.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Persona Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PERSONAS.map((persona) => {
            const IconComp = getPersonaIcon(persona.avatarIcon);
            const isSelected = persona.id === activePersonaId;

            return (
              <div
                key={persona.id}
                onClick={() => setActivePersonaId(persona.id)}
                className={`rounded-2xl p-6 transition-all border flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-white border-2 border-[#DE001A] ring-4 ring-red-100 shadow-xl scale-[1.01]'
                    : 'bg-white border-[#E5E5E7] hover:border-red-300 shadow-xs'
                }`}
              >
                <div className="space-y-5">
                  {/* Persona Identity Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-red-50 text-[#DE001A] flex items-center justify-center border border-red-200 shrink-0">
                        <IconComp className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#DE001A] block">
                          {persona.role}
                        </span>
                        <h3 className="text-lg font-black text-neutral-900 leading-tight">
                          {persona.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-500 font-medium italic">
                    "{persona.subtitle}"
                  </p>

                  {/* Frustration vs Outcome Block */}
                  <div className="space-y-3 pt-2">
                    {/* Key Frustration */}
                    <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Principal Frustração</span>
                      </div>
                      <p className="text-xs text-neutral-700 leading-relaxed">
                        {persona.keyFrustration}
                      </p>
                    </div>

                    {/* Desired Outcome */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resultado Desejado</span>
                      </div>
                      <p className="text-xs text-neutral-700 leading-relaxed">
                        {persona.desiredOutcome}
                      </p>
                    </div>
                  </div>

                  {/* Worten Match Advantage */}
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs">
                    <span className="font-black text-[#DE001A] block mb-1">
                      💡 Solução Worten:
                    </span>
                    <p className="text-neutral-800 font-medium">
                      {persona.wortenAdvantage}
                    </p>
                  </div>
                </div>

                {/* Matching Deal Chips & CTA */}
                <div className="pt-5 mt-5 border-t border-[#E5E5E7] space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {persona.matchingDeals.map((tag) => (
                      <span
                        key={tag}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDealTag(tag);
                          onNavigateTo('promocoes');
                        }}
                        className="text-[10px] font-bold bg-[#F4F4F6] text-neutral-700 px-2 py-1 rounded-md hover:bg-[#DE001A] hover:text-white transition-colors cursor-pointer border border-[#E5E5E7]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateTo('promocoes');
                    }}
                    className="w-full py-2.5 bg-[#DE001A] hover:bg-[#BF0016] text-white text-xs font-extrabold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Ver Ofertas para este Perfil</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
