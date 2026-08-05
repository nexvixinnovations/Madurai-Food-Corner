import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { websiteApi } from '../services/api';
import { ComboCard } from '../components/cards/ComboCard';
import { ComboCardSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { Package } from 'lucide-react';

export const Combos: React.FC = () => {
  const { data: combos = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['combos'],
    queryFn: () => websiteApi.getCombos(),
  });

  const regularCombos = React.useMemo(() => {
    return combos.filter((c) => !c.offer_enabled && (!c.offer_price || Number(c.offer_price) === 0));
  }, [combos]);

  return (
    <div className="min-h-screen bg-brand-cream dark:bg-zinc-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Package className="w-3.5 h-3.5" />
            <span>Complete Meal Bundles</span>
          </div>
          <h1 className="text-4xl font-extrabold font-serif text-brand-maroon dark:text-white">
            Special Combo Deals
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Curated combinations of authentic Madurai food items packed together for maximum flavor and maximum savings.
          </p>
        </div>

        {/* Combos Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <ComboCardSkeleton key={n} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : regularCombos.length === 0 ? (
          <EmptyState
            title="No Combos Available"
            description="There are currently no active combo meals available. Check back soon!"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularCombos.map((combo) => (
              <ComboCard key={combo.id} combo={combo} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
