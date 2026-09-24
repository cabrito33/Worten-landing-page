import React from 'react';
import { BookOpen, ArrowRight, Clock, Flame, TrendingUp } from 'lucide-react';
import { EDITORIAL_ARTICLES } from '../data/landingData';
import { EditorialArticle } from '../types';

interface EditorialGuidesProps {
  onOpenArticle: (article: EditorialArticle) => void;
  onSelectCategory?: (category: string) => void;
}

const TRENDING_SEARCHES = [
  { label: 'iPhone 16 Pro Max', tag: 'smartphones', count: '1.2k visualizações hoje' },
  { label: 'PlayStation 5 Slim', tag: 'gaming', count: '980 compras' },
  { label: 'Smart TV OLED 65"', tag: 'tvs', count: 'Top Descontos' },
  { label: 'Frigoríficos No Frost', tag: 'appliances', count: 'Instalação Grátis' },
  { label: 'MacBook Air M3', tag: 'computing', count: 'Retoma até 800€' },
  { label: 'Air Fryer Dupla', tag: 'appliances', count: 'Tendência' },
  { label: 'Dyson Airwrap', tag: 'beauty', count: 'Oferta Especial' },
];

export const EditorialGuides: React.FC<EditorialGuidesProps> = ({
  onOpenArticle,
  onSelectCategory,
}) => {
  return (
    <section id="editorial" className="py-14 bg-[#F4F4F6] border-b border-[#E5E5E7]">
      <div className="max-w-7xl mx-auto px-4 space-y-12">
        {/* 1. TENDÊNCIAS DO MOMENTO 🔥 */}
        <div className="bg-white rounded-2xl border border-[#E5E5E7] p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-red-50 text-[#DE001A]">
                <Flame className="w-5 h-5 fill-[#DE001A]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-neutral-900 flex items-center gap-1.5">
                  Tendências do Momento <span className="text-amber-500">🔥</span>
                </h3>
                <p className="text-xs text-neutral-500">Os termos e produtos mais procurados em Worten.pt</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full self-start sm:self-auto">
              Atualizado em tempo real
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {TRENDING_SEARCHES.map((trend) => (
              <button
                key={trend.label}
                onClick={() => {
                  if (onSelectCategory) {
                    onSelectCategory(trend.tag);
                  }
                }}
                className="px-3 py-2 rounded-xl bg-[#F4F4F6] hover:bg-red-50 border border-[#E5E5E7] hover:border-[#DE001A] transition-all text-left flex items-center gap-2 group cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#DE001A] transition-colors" />
                <span className="text-xs font-bold text-neutral-800 group-hover:text-[#DE001A] transition-colors">
                  {trend.label}
                </span>
                <span className="text-[10px] text-neutral-500 bg-white px-1.5 py-0.5 rounded border border-neutral-200">
                  {trend.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. DICAS E NOVIDADES (Guias de Compra & Blog) */}
        <div>
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-[#DE001A] text-xs font-black uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5 text-[#DE001A]" />
                Dicas e Novidades | Worten Life
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                Guias de compra & conselhos de especialistas
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 max-w-2xl font-medium">
                Elimina as indecisões antes de comprar. Comparamos especificações, avaliamos o custo-benefício e ajudamos-te a escolher certo.
              </p>
            </div>

            <button
              onClick={() => onOpenArticle(EDITORIAL_ARTICLES[0])}
              className="text-xs font-bold text-[#DE001A] hover:underline flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
            >
              <span>Ver todos os artigos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3 Editorial Cards Grid with Real Photography */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {EDITORIAL_ARTICLES.map((art) => (
              <article
                key={art.id}
                onClick={() => onOpenArticle(art)}
                className="bg-white rounded-2xl border border-[#E5E5E7] overflow-hidden flex flex-col justify-between hover:border-[#DE001A] hover:shadow-xl transition-all cursor-pointer group"
              >
                <div>
                  {/* Article Thumbnail Image */}
                  <div className="h-44 sm:h-48 w-full bg-neutral-100 overflow-hidden relative">
                    {art.imageUrl && (
                      <img
                        src={art.imageUrl}
                        alt={art.title}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    )}
                    <span className="absolute top-3 left-3 px-2.5 py-1 bg-neutral-900/80 backdrop-blur-xs text-white text-[10px] font-black uppercase tracking-wider rounded-md">
                      {art.type}
                    </span>
                    <span className="absolute bottom-3 right-3 text-[10px] text-white font-bold bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {art.readTime}
                    </span>
                  </div>

                  {/* Article Body */}
                  <div className="p-5 space-y-2.5">
                    <span className="text-[11px] font-bold text-[#DE001A] uppercase tracking-wider">
                      {art.category}
                    </span>
                    <h3 className="text-base font-black text-neutral-900 group-hover:text-[#DE001A] transition-colors leading-snug line-clamp-2">
                      {art.title}
                    </h3>
                    <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2">
                      {art.excerpt}
                    </p>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-neutral-100">
                  <span className="text-[11px] font-semibold text-neutral-400">
                    {art.badge}
                  </span>
                  <span className="text-xs font-bold text-[#DE001A] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    <span>Ler Guia</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
