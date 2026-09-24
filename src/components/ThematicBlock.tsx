import React, { useState } from 'react';
import { Compass, Flame, ArrowRight, Check, Tent } from 'lucide-react';
import { THEMATIC_CHIPS } from '../data/landingData';

interface ThematicBlockProps {
  onSelectThematicItem: (item: string) => void;
}

export const ThematicBlock: React.FC<ThematicBlockProps> = ({
  onSelectThematicItem,
}) => {
  const [selectedChip, setSelectedChip] = useState<string>(THEMATIC_CHIPS[0]);

  return (
    <section id="thematic" className="py-14 bg-[#F4F4F6] border-b border-[#E5E5E7]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-3xl p-6 sm:p-10 text-neutral-900 relative overflow-hidden shadow-xl border-2 border-red-100">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-[#DE001A] text-xs font-black uppercase tracking-wider">
              <Tent className="w-3.5 h-3.5" />
              Campanha Sazonal & Ar Livre
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-neutral-900">
              Escapadinha de fim de semana: Pronto para a aventura? 🏕️
            </h2>

            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed font-medium">
              Equipa-te com o melhor material de campismo, iluminação de emergência e churrasqueiras portáteis com entregas grátis acima de 35€ e levantamento em loja em 15 minutos.
            </p>

            {/* Sub-category Chips */}
            <div className="pt-2">
              <span className="text-xs font-black uppercase tracking-wider text-neutral-500 block mb-3">
                Categorias Essenciais de Aventura:
              </span>
              <div className="flex flex-wrap gap-2">
                {THEMATIC_CHIPS.map((chip) => {
                  const isSelected = selectedChip === chip;
                  return (
                    <button
                      key={chip}
                      onClick={() => {
                        setSelectedChip(chip);
                        onSelectThematicItem(chip);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#DE001A] text-white shadow-md font-black scale-105'
                          : 'bg-[#F4F4F6] hover:bg-neutral-100 text-neutral-700 border border-[#E5E5E7]'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                      <span>{chip}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <button
                onClick={() => onSelectThematicItem(selectedChip)}
                className="px-6 py-3 bg-[#DE001A] hover:bg-[#BF0016] text-white text-xs sm:text-sm font-black rounded-xl transition-all shadow-lg hover:shadow-red-600/30 flex items-center gap-2 cursor-pointer"
              >
                <span>Explorar Equipamento de Campismo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <span className="text-xs text-neutral-500 font-semibold">
                Até 30% desconto direto em marcas Outdoor selecionadas.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
