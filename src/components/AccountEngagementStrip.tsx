import React from 'react';
import { User, Package, BellRing, Heart, ArrowRight, Sparkles } from 'lucide-react';

interface AccountEngagementStripProps {
  onOpenAccountModal: () => void;
}

export const AccountEngagementStrip: React.FC<AccountEngagementStripProps> = ({
  onOpenAccountModal,
}) => {
  const valueHooks = [
    {
      icon: Package,
      text: 'Acompanha o estado das tuas encomendas em tempo real',
    },
    {
      icon: BellRing,
      text: 'Recebe alertas instantâneos de descida de preço nos teus artigos',
    },
    {
      icon: Heart,
      text: 'Guarda os teus produtos favoritos e acede em qualquer dispositivo',
    },
  ];

  return (
    <section className="py-8 bg-white border-b border-[#E5E5E7]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-r from-[#DE001A] via-[#CC0018] to-[#B00014] rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6 text-white relative overflow-hidden">
          {/* Left Hook & Headline */}
          <div className="space-y-2 text-center lg:text-left max-w-xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-black uppercase tracking-wider backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Experiência Worten & Tu
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Inicia sessão para uma experiência personalizada!
            </h2>
            <p className="text-red-100 text-sm font-medium">
              Gere as tuas garantias, faturas digitais e cupões exclusivos da tua conta num único painel prático e seguro.
            </p>
          </div>

          {/* Center 3 Value Hooks (Crisp White Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto relative z-10">
            {valueHooks.map((hook, index) => {
              const Icon = hook.icon;
              return (
                <div
                  key={index}
                  className="bg-white text-neutral-900 p-3.5 rounded-xl border border-white/80 shadow-md flex items-center gap-3 text-xs font-bold"
                >
                  <div className="p-2 rounded-lg bg-red-50 text-[#DE001A] shrink-0 border border-red-100">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="leading-snug">{hook.text}</span>
                </div>
              );
            })}
          </div>

          {/* Right Action Button (Pure White Button with Red Text) */}
          <div className="shrink-0 w-full sm:w-auto relative z-10">
            <button
              id="account-strip-cta"
              onClick={onOpenAccountModal}
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-neutral-100 text-[#DE001A] font-black text-sm rounded-xl transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <User className="w-4 h-4 text-[#DE001A]" />
              <span>INICIAR SESSÃO</span>
              <ArrowRight className="w-4 h-4 text-[#DE001A]" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
