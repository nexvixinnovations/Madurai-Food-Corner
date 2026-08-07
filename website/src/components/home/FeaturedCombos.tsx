import React from 'react';
import { Combo } from '../../types';
import { ComboCard } from '../cards/ComboCard';
import { ComboCardSkeleton } from '../common/Skeleton';
import { Package, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FeaturedCombosProps {
  combos: Combo[];
  isLoading: boolean;
}

export const FeaturedCombos: React.FC<FeaturedCombosProps> = ({ combos, isLoading }) => {
  const regularCombos = React.useMemo(() => {
    return combos.filter((c) => !c.offer_enabled && (!c.offer_price || Number(c.offer_price) === 0));
  }, [combos]);

  return (
    <section className="py-10 md:py-16 bg-white dark:bg-zinc-900 border-y border-amber-500/10">
      <div className="max-w-7xl mx-auto pl-4 pr-0 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 md:mb-12 pr-4 sm:pr-0">
          <div>
            <div className="inline-flex items-center space-x-1 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">
              <Package className="w-4 h-4 text-amber-500" />
              <span>Great Value Deals</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-serif text-brand-maroon dark:text-white">
              Special Combo Package Meals
            </h2>
          </div>

          <Link
            to="/combos"
            className="mt-4 sm:mt-0 inline-flex items-center space-x-1.5 text-sm font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
          >
            <span>View All Combos</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex overflow-x-auto pb-6 sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 snap-x snap-mandatory scrollbar-none pr-4 sm:pr-0">
            {[1, 2, 3].map((n) => (
              <div key={n} className="min-w-[85vw] sm:min-w-0 flex-none snap-start">
                <ComboCardSkeleton />
              </div>
            ))}
          </div>
        ) : regularCombos.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            No combo deals available currently. Check back soon!
          </div>
        ) : (
          <div className="flex overflow-x-auto pb-6 sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 snap-x snap-mandatory scrollbar-none pr-4 sm:pr-0">
            {regularCombos.slice(0, 3).map((combo) => (
              <div key={combo.id} className="min-w-[85vw] sm:min-w-0 flex-none snap-start">
                <ComboCard combo={combo} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
