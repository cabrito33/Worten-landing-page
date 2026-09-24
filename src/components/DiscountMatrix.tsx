import React, { useState } from 'react';
import {
  Tag,
  Flame,
  Star,
  Truck,
  CreditCard,
  ShoppingCart,
  Check,
  Filter,
  Eye,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { PROMO_PRODUCTS } from '../data/landingData';
import { PromoProduct } from '../types';

interface DiscountMatrixProps {
  selectedCategoryFilter?: string;
  onAddToCart: (product: PromoProduct) => void;
  onOpenProductModal: (product: PromoProduct) => void;
}

export const DiscountMatrix: React.FC<DiscountMatrixProps> = ({
  selectedCategoryFilter,
  onAddToCart,
  onOpenProductModal,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>(selectedCategoryFilter || 'all');
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  // Sync when prop changes
  React.useEffect(() => {
    if (selectedCategoryFilter) {
      setActiveCategory(selectedCategoryFilter);
    }
  }, [selectedCategoryFilter]);

  const categoryTabs = [
    { id: 'all', label: 'Todas as Campanhas', badge: '🔥 Destaques' },
    { id: 'smartphones', label: 'Smartphones', badge: 'Até 30% direto' },
    { id: 'tvs', label: 'TVs & Som', badge: 'Até 35% direto' },
    { id: 'appliances', label: 'Grandes Eletrodomésticos', badge: 'Até 40% s/ PVPr' },
    { id: 'computing', label: 'Informática', badge: 'Cupão UNI10 (-10%)' },
    { id: 'beauty', label: 'Beleza & Cuidado', badge: 'Até 60% direto' },
    { id: 'gaming', label: 'Gaming', badge: 'Leva 3 Paga 2' },
  ];

  const filteredProducts =
    activeCategory === 'all'
      ? PROMO_PRODUCTS
      : PROMO_PRODUCTS.filter((p) => p.category === activeCategory);

  const handleAdd = (product: PromoProduct) => {
    onAddToCart(product);
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  return (
    <section id="promocoes" className="py-14 bg-[#F4F4F6] dark:bg-neutral-950 border-b border-[#E5E5E7] dark:border-neutral-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-[#DE001A] text-xs font-black uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 text-[#DE001A]" />
              Matriz de Descontos & Oportunidades
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
              As melhores campanhas
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-2xl">
              Descontos diretos, vales em talão e facilidades de financiamento nos artigos mais procurados com garantia Worten.
            </p>
          </div>

          <div className="text-xs font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
            <span>A mostrar {filteredProducts.length} artigos em campanha</span>
          </div>
        </div>

        {/* Category Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 scrollbar-none">
          {categoryTabs.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-[#DE001A] text-white shadow-md shadow-red-600/20'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-[#E5E5E7] dark:border-neutral-700'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                    isActive
                      ? 'bg-red-800 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {filteredProducts.map((product) => {
            const isAdded = !!addedIds[product.id];

            return (
              <div
                key={product.id}
                className="bg-white dark:bg-[#1E1E22] rounded-2xl border border-[#E5E5E7] dark:border-neutral-800 p-4 sm:p-5 flex flex-col justify-between hover:border-[#DE001A] hover:shadow-xl transition-all group relative"
              >
                <div className="space-y-3">
                  {/* Visual Product Image Container with Overlaid Badges */}
                  <div
                    onClick={() => onOpenProductModal(product)}
                    className="w-full h-48 sm:h-52 bg-[#F9F9FB] dark:bg-neutral-800/60 rounded-xl flex items-center justify-center p-3 border border-[#EBEBEB] dark:border-neutral-700/60 relative overflow-hidden cursor-pointer"
                  >
                    {/* Real High-Resolution Product Photo */}
                    <img
                      src={product.imageUrl}
                      alt={product.imageAlt}
                      className="w-full h-full object-cover object-center rounded-lg group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Official Worten Retail Badge Over Photo */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                      <span className="px-2.5 py-1 bg-[#DE001A] text-white text-xs font-black uppercase tracking-wider rounded-md shadow-md">
                        {product.discountBadge}
                      </span>
                    </div>

                    {/* Delivery Tag Over Photo */}
                    <span className="absolute top-2.5 right-2.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-white/95 dark:bg-neutral-900/90 backdrop-blur-xs px-2 py-0.5 rounded shadow-xs border border-emerald-200 dark:border-emerald-800/40">
                      {product.deliveryTag}
                    </span>

                    {/* Quick Preview Hover Button */}
                    <button
                      aria-label="Ver detalhes rápidos"
                      className="absolute bottom-2.5 right-2.5 p-2 rounded-lg bg-neutral-900/80 hover:bg-neutral-900 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title and Rating */}
                  <div>
                    <div className="flex items-center gap-1 text-[#FFC700] text-xs mb-1">
                      <Star className="w-3.5 h-3.5 fill-[#FFC700]" />
                      <span className="font-bold text-neutral-800 dark:text-neutral-200">
                        {product.rating}
                      </span>
                      <span className="text-neutral-400 text-[10px]">
                        ({product.reviewsCount} avaliações)
                      </span>
                    </div>

                    <h3
                      onClick={() => onOpenProductModal(product)}
                      className="text-sm font-black text-neutral-900 dark:text-white leading-snug hover:text-[#DE001A] transition-colors line-clamp-2 cursor-pointer"
                    >
                      {product.title}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                      {product.subtitle}
                    </p>
                  </div>

                  {/* Secondary Incentive Pill */}
                  <div className="text-[11px] font-bold text-[#DE001A] dark:text-red-300 bg-red-50 dark:bg-red-950/50 px-2.5 py-1.5 rounded-lg border border-red-100 dark:border-red-900/40 truncate">
                    🎁 {product.secondaryIncentive}
                  </div>
                </div>

                {/* Price & Financing Block */}
                <div className="pt-3 mt-3 border-t border-[#E5E5E7] dark:border-neutral-800 space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-[#DE001A]">
                      {product.promoPrice.toFixed(2)}€
                    </span>
                    <span className="text-xs text-neutral-400 line-through">
                      {product.originalPrice.toFixed(2)}€
                    </span>
                  </div>

                  <div className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-[#DE001A] shrink-0" />
                    <span className="truncate">{product.financingInfo}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => onOpenProductModal(product)}
                      className="py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Ver detalhes
                    </button>

                    <button
                      onClick={() => handleAdd(product)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#DE001A] hover:bg-[#BF0016] text-white'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Adicionado!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Comprar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
