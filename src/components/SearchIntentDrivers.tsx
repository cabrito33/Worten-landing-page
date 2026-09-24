import React from 'react';
import { Flame, TrendingUp } from 'lucide-react';
import { SEARCH_INTENT_TAGS } from '../data/landingData';

interface SearchIntentDriversProps {
  onSelectTag: (tag: string) => void;
}

export const SearchIntentDrivers: React.FC<SearchIntentDriversProps> = ({
  onSelectTag,
}) => {
  return (
    <section className="py-4 bg-white border-b border-[#E5E5E7]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-neutral-900 shrink-0">
            <span className="p-1 rounded-md bg-[#DE001A] text-white">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
            <span>Tendências do momento 🔥:</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {SEARCH_INTENT_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => onSelectTag(tag)}
                className="px-3 py-1.5 rounded-full bg-[#F4F4F6] text-neutral-800 text-xs font-bold border border-[#E5E5E7] hover:border-[#DE001A] hover:text-[#DE001A] hover:bg-red-50/60 whitespace-nowrap shadow-2xs transition-all cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
