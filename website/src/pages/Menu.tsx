import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { websiteApi } from '../services/api';
import { FoodItem } from '../types';
import { FoodCard } from '../components/cards/FoodCard';
import { FoodCardSkeleton } from '../components/common/Skeleton';
import { FoodDetailsModal } from '../components/common/FoodDetailsModal';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { Search, SlidersHorizontal, Utensils } from 'lucide-react';

export const Menu: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [foodTypeFilter, setFoodTypeFilter] = useState<'All' | 'Veg' | 'Non-Veg'>('All');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'name'>('default');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  // Fetch Menu from API
  const { data: foods = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['todayMenu'],
    queryFn: () => websiteApi.getTodayMenu(),
  });

  // Filter and sort items
  const filteredFoods = useMemo(() => {
    return foods
      .filter((food) => {
        // Food Type filter (Veg/Non-Veg/Offers)
        if (foodTypeFilter === 'Veg' && food.food_type?.toLowerCase() !== 'veg') return false;
        if (foodTypeFilter === 'Non-Veg' && food.food_type?.toLowerCase() === 'veg') return false;

        // Search Query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const nameMatch = food.name.toLowerCase().includes(q);
          const catMatch = food.category.toLowerCase().includes(q);
          if (!nameMatch && !catMatch) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = a.offer_enabled && a.offer_price ? a.offer_price : a.price;
        const priceB = b.offer_enabled && b.offer_price ? b.offer_price : b.price;

        if (sortBy === 'price-asc') return priceA - priceB;
        if (sortBy === 'price-desc') return priceB - priceA;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return (a.display_order || 0) - (b.display_order || 0);
      });
  }, [foods, foodTypeFilter, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-brand-cream dark:bg-zinc-950 py-6 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Utensils className="w-3.5 h-3.5" />
            <span>Freshly Cooked Daily</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-brand-maroon dark:text-white">
            Today's Scheduled Menu
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Select from our fresh South Indian food items. Available for online order, delivery, takeaway, or parcel.
          </p>
        </div>

        {/* Sticky Search & Swipeable Filter Controls Bar */}
        <div className="sticky top-20 z-30 bg-white/95 dark:bg-zinc-900/95 p-4 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xl backdrop-blur-md space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Sticky Search Input */}
            <div className="md:col-span-7 relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search food dishes (e.g. Dosa, Biryani)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors min-h-[48px]"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="md:col-span-5 relative">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-amber-500 appearance-none cursor-pointer min-h-[48px]"
              >
                <option value="default">Sort: Default Order</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
              <SlidersHorizontal className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          {/* Swipeable Horizontal Filter Chips */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none pt-1">
            {(['All', 'Veg', 'Non-Veg'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFoodTypeFilter(type)}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all min-h-[44px] flex items-center justify-center ${
                  foodTypeFilter === type
                    ? 'bg-amber-500 text-brand-maroon shadow-md'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {type === 'Veg' && <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />}
                {type === 'Non-Veg' && <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5" />}
                <span>{type}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Display Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <FoodCardSkeleton key={n} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : filteredFoods.length === 0 ? (
          <EmptyState
            title="No Food Items Found"
            description="No scheduled items match your selected filters. Try clearing your search query."
            actionLabel="Reset Filters"
            onAction={() => {
              setFoodTypeFilter('All');
              setSearchQuery('');
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredFoods.map((food) => (
              <FoodCard key={food.id} food={food} onOpenDetails={setSelectedFood} />
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      <FoodDetailsModal food={selectedFood} onClose={() => setSelectedFood(null)} />
    </div>
  );
};
