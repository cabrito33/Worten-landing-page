import React from 'react';

export interface CategoryBubbleItem {
  id: string;
  name: string;
  imageUrl: string;
  categoryFilter: string;
}

export const CATEGORY_BUBBLES: CategoryBubbleItem[] = [
  {
    id: 'casa-decoracao',
    name: 'Casa e Decoração',
    imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=260&q=80',
    categoryFilter: 'appliances',
  },
  {
    id: 'desporto-outdoor',
    name: 'Desporto e Outdoor',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=260&q=80',
    categoryFilter: 'appliances',
  },
  {
    id: 'jardim',
    name: 'Jardim',
    imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d69106093?auto=format&fit=crop&w=260&q=80',
    categoryFilter: 'appliances',
  },
  {
    id: 'bricolage',
    name: 'Bricolage',
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=260&q=80',
    categoryFilter: 'appliances',
  },
  {
    id: 'bebe',
    name: 'Bebé',
    imageUrl: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=260&q=80',
    categoryFilter: 'appliances',
  },
  {
    id: 'perfumaria',
    name: 'Perfumaria e Cosmética',
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=260&q=80',
    categoryFilter: 'beauty',
  },
  {
    id: 'jogos-brinquedos',
    name: 'Jogos e Brinquedos',
    imageUrl: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?auto=format&fit=crop&w=260&q=80',
    categoryFilter: 'gaming',
  },
  {
    id: 'fitness',
    name: 'Fitness',
    imageUrl: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=260&q=80',
    categoryFilter: 'appliances',
  },
  {
    id: 'sofas',
    name: 'Sofás',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=260&q=80',
    categoryFilter: 'appliances',
  },
  {
    id: 'escritorio',
    name: 'Escritório',
    imageUrl: 'https://images.unsplash.com/photo-1580481077195-c419612c6a46?auto=format&fit=crop&w=260&q=80',
    categoryFilter: 'computing',
  },
  {
    id: 'telemoveis',
    name: 'Telemóveis e Smartphones',
    imageUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=260&q=80',
    categoryFilter: 'smartphones',
  },
  {
    id: 'computadores',
    name: 'Computadores e Portáteis',
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=260&q=80',
    categoryFilter: 'computing',
  },
  {
    id: 'tvs',
    name: 'TVs',
    imageUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=260&q=80',
    categoryFilter: 'tvs',
  },
  {
    id: 'gaming',
    name: 'Gaming',
    imageUrl: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?auto=format&fit=crop&w=260&q=80',
    categoryFilter: 'gaming',
  },
  {
    id: 'ventoinhas',
    name: 'Ventoinhas',
    imageUrl: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=260&q=80',
    categoryFilter: 'appliances',
  },
  {
    id: 'maquina-lavar',
    name: 'Máquina de Lavar e Secar',
    imageUrl: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=260&q=80',
    categoryFilter: 'appliances',
  },
  {
    id: 'frigorificos',
    name: 'Frigoríficos',
    imageUrl: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=260&q=80',
    categoryFilter: 'appliances',
  },
  {
    id: 'preparacao-alimentos',
    name: 'Preparação de Alimentos',
    imageUrl: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=260&q=80',
    categoryFilter: 'appliances',
  },
  {
    id: 'aspiradores',
    name: 'Aspiradores',
    imageUrl: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=260&q=80',
    categoryFilter: 'appliances',
  },
  {
    id: 'tablets',
    name: 'Tablets',
    imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=260&q=80',
    categoryFilter: 'computing',
  },
];

interface CategoryBubblesGridProps {
  onSelectCategory: (category: string) => void;
}

export const CategoryBubblesGrid: React.FC<CategoryBubblesGridProps> = ({
  onSelectCategory,
}) => {
  return (
    <section className="py-8 bg-[#F4F4F6] border-b border-[#E5E5E7]">
      <div className="max-w-7xl mx-auto px-4">
        {/* Horizontal Category Circular Nodes Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-y-6 gap-x-3 items-start justify-items-center">
          {CATEGORY_BUBBLES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.categoryFilter)}
              className="flex flex-col items-center text-center group cursor-pointer w-24 sm:w-28 focus:outline-none"
            >
              {/* White Circle Container */}
              <div className="w-18 h-18 sm:w-20 sm:h-20 md:w-22 md:h-22 rounded-full bg-white border border-neutral-200/90 shadow-2xs flex items-center justify-center p-2.5 group-hover:scale-105 group-hover:shadow-md group-hover:border-[#DE001A]/50 transition-all duration-200 bg-gradient-to-b from-white to-[#FAFAFA]">
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
              </div>

              {/* Category Label */}
              <span className="mt-2 text-[11px] sm:text-xs font-semibold text-neutral-800 leading-tight group-hover:text-[#DE001A] transition-colors line-clamp-2 max-w-[95px]">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
