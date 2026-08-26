import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { websiteApi } from '../services/api';
import { FoodItem } from '../types';
import { FoodCard } from '../components/cards/FoodCard';
import { FoodCardSkeleton } from '../components/common/Skeleton';
import { FoodDetailsModal } from '../components/common/FoodDetailsModal';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { Search, SlidersHorizontal, Utensils, Coffee, Sparkles, Flame } from 'lucide-react';

export const Menu: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [foodTypeFilter, setFoodTypeFilter] = useState<'All' | 'Veg' | 'Non-Veg' | 'Snacks'>('All');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'name'>('default');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  // Fetch Menu from API
  const { data: foods = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['todayMenu'],
    queryFn: () => websiteApi.getTodayMenu(),
  });

  // Helper to test if a food item is a snack based on Neon DB category, food_type, or item name
  const isSnackItem = (food: FoodItem) => {
    const cat = (food.category || '').toLowerCase().trim();
    const type = (food.food_type || '').toLowerCase().trim();
    const name = (food.name || '').toLowerCase().trim();

    return (
      cat === 'snacks' ||
      cat.includes('snack') ||
      type === 'snacks' ||
      type.includes('snack') ||
      name.includes('tea') ||
      name.includes('coffee') ||
      name.includes('vadai') ||
      name.includes('vada') ||
      name.includes('sundal') ||
      name.includes('green gram') ||
      name.includes('samosa') ||
      name.includes('bajji') ||
      name.includes('pakoda') ||
      name.includes('cutlet') ||
      name.includes('roll')
    );
  };

  // Compute category counts for chips
  const counts = useMemo(() => {
    let vegCount = 0;
    let nonVegCount = 0;
    let snacksCount = 0;

    foods.forEach((food) => {
      const isSnack = isSnackItem(food);
      const isVeg = food.food_type?.toLowerCase() === 'veg';

      if (isSnack) {
        snacksCount++;
      } else if (isVeg) {
        vegCount++;
      } else {
        nonVegCount++;
      }
    });

    return {
      all: foods.length,
      veg: vegCount,
      nonVeg: nonVegCount,
      snacks: snacksCount,
    };
  }, [foods]);

  // Sort helper function
  const sortComparator = (a: FoodItem, b: FoodItem) => {
    const priceA = a.offer_enabled && a.offer_price ? Number(a.offer_price) : Number(a.price);
    const priceB = b.offer_enabled && b.offer_price ? Number(b.offer_price) : Number(b.price);

    if (sortBy === 'price-asc') return priceA - priceB;
    if (sortBy === 'price-desc') return priceB - priceA;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return (a.display_order || 0) - (b.display_order || 0);
  };

  // Search filter helper
  const matchesSearch = (food: FoodItem) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = food.name.toLowerCase().includes(q);
    const catMatch = (food.category || '').toLowerCase().includes(q);
    const typeMatch = (food.food_type || '').toLowerCase().includes(q);
    const descMatch = (food.description || '').toLowerCase().includes(q);
    return nameMatch || catMatch || typeMatch || descMatch;
  };

  // Filtered lists for rendering
  const mainMeals = useMemo(() => {
    return foods
      .filter((food) => !isSnackItem(food))
      .filter((food) => {
        const isVeg = food.food_type?.toLowerCase() === 'veg';
        if (foodTypeFilter === 'Veg') return isVeg;
        if (foodTypeFilter === 'Non-Veg') return !isVeg;
        return true;
      })
      .filter(matchesSearch)
      .sort(sortComparator);
  }, [foods, foodTypeFilter, searchQuery, sortBy]);

  const snackItems = useMemo(() => {
    return foods
      .filter((food) => isSnackItem(food))
      .filter(matchesSearch)
      .sort(sortComparator);
  }, [foods, searchQuery, sortBy]);

  const totalFilteredCount = useMemo(() => {
    if (foodTypeFilter === 'Snacks') return snackItems.length;
    if (foodTypeFilter === 'Veg' || foodTypeFilter === 'Non-Veg') return mainMeals.length;
    return mainMeals.length + snackItems.length;
  }, [foodTypeFilter, mainMeals.length, snackItems.length]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream dark:bg-zinc-950 py-6 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
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
            Select from our fresh South Indian meals, delicacies & evening snacks. Available for online order, delivery, takeaway, or parcel.
          </p>
        </div>

        {/* Sticky Search & Filter Controls Bar */}
        <div className="sticky top-20 z-30 bg-white/95 dark:bg-zinc-900/95 p-4 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xl backdrop-blur-md space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Sticky Search Input */}
            <div className="md:col-span-7 relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search dishes or snacks (e.g. Tea, Coffee, Biryani, Vadai, Sundal)..."
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

          {/* Category Filter Chips: All | Veg | Non-Veg | Snacks */}
          <div className="flex items-center space-x-2.5 overflow-x-auto pb-1 scrollbar-none pt-1">
            {/* All Chip */}
            <button
              onClick={() => setFoodTypeFilter('All')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all min-h-[44px] flex items-center justify-center space-x-1.5 cursor-pointer ${
                foodTypeFilter === 'All'
                  ? 'bg-amber-500 text-brand-maroon shadow-md scale-105 font-extrabold'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <span>All Dishes</span>
              {counts.all > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    foodTypeFilter === 'All'
                      ? 'bg-brand-maroon/20 text-brand-maroon'
                      : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  {counts.all}
                </span>
              )}
            </button>

            {/* Veg Chip */}
            <button
              onClick={() => setFoodTypeFilter('Veg')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all min-h-[44px] flex items-center justify-center space-x-1.5 cursor-pointer ${
                foodTypeFilter === 'Veg'
                  ? 'bg-emerald-600 text-white shadow-md scale-105 font-extrabold'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${foodTypeFilter === 'Veg' ? 'bg-emerald-200' : 'bg-emerald-500'}`} />
              <span>Veg</span>
              {counts.veg > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    foodTypeFilter === 'Veg'
                      ? 'bg-emerald-800 text-white'
                      : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  {counts.veg}
                </span>
              )}
            </button>

            {/* Non-Veg Chip */}
            <button
              onClick={() => setFoodTypeFilter('Non-Veg')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all min-h-[44px] flex items-center justify-center space-x-1.5 cursor-pointer ${
                foodTypeFilter === 'Non-Veg'
                  ? 'bg-red-600 text-white shadow-md scale-105 font-extrabold'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${foodTypeFilter === 'Non-Veg' ? 'bg-red-200' : 'bg-red-500'}`} />
              <span>Non-Veg</span>
              {counts.nonVeg > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    foodTypeFilter === 'Non-Veg'
                      ? 'bg-red-800 text-white'
                      : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  {counts.nonVeg}
                </span>
              )}
            </button>

            {/* Snacks Chip */}
            <button
              onClick={() => setFoodTypeFilter('Snacks')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all min-h-[44px] flex items-center justify-center space-x-1.5 cursor-pointer ${
                foodTypeFilter === 'Snacks'
                  ? 'bg-amber-600 text-white shadow-md scale-105 font-extrabold'
                  : 'bg-amber-50 dark:bg-zinc-800 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-100'
              }`}
            >
              <Coffee className="w-3.5 h-3.5 text-amber-500" />
              <span>Snacks & Tea</span>
              {counts.snacks > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    foodTypeFilter === 'Snacks'
                      ? 'bg-amber-800 text-white'
                      : 'bg-amber-200 dark:bg-zinc-700 text-amber-900 dark:text-amber-200'
                  }`}
                >
                  {counts.snacks}
                </span>
              )}
            </button>
          </div>

          {/* Quick Jump Bar when All Dishes is Active */}
          {foodTypeFilter === 'All' && !searchQuery.trim() && (
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">Quick jump:</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => scrollToSection('main-meals-section')}
                  className="px-3 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-semibold transition-colors flex items-center space-x-1"
                >
                  <Flame className="w-3 h-3 text-amber-500" />
                  <span>Main Meals ({mainMeals.length})</span>
                </button>
                <button
                  onClick={() => scrollToSection('snacks-section')}
                  className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 font-semibold transition-colors flex items-center space-x-1"
                >
                  <Coffee className="w-3 h-3 text-amber-500" />
                  <span>Snacks ({snackItems.length})</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content Loading / Error / Empty / Render */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <FoodCardSkeleton key={n} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : totalFilteredCount === 0 ? (
          <EmptyState
            title={foodTypeFilter === 'Snacks' ? 'No Snacks Found' : 'No Food Items Found'}
            description={
              foodTypeFilter === 'Snacks'
                ? 'No snack items match your search query.'
                : 'No scheduled items match your selected filters. Try clearing your search query.'
            }
            actionLabel="Reset Filters"
            onAction={() => {
              setFoodTypeFilter('All');
              setSearchQuery('');
            }}
          />
        ) : (
          <div className="space-y-12">
            {/* SECTION 1: MAIN MEALS & SPECIALTIES */}
            {foodTypeFilter !== 'Snacks' && mainMeals.length > 0 && (
              <section id="main-meals-section" className="space-y-6 scroll-mt-36">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-zinc-200/80 dark:border-zinc-800 pb-4">
                  <div>
                    <div className="inline-flex items-center space-x-1 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        {foodTypeFilter === 'Veg'
                          ? 'Pure Vegetarian'
                          : foodTypeFilter === 'Non-Veg'
                          ? 'Non-Vegetarian'
                          : 'Main Course & Specialties'}
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-brand-maroon dark:text-white">
                      {foodTypeFilter === 'Veg'
                        ? 'Vegetarian Delicacies'
                        : foodTypeFilter === 'Non-Veg'
                        ? 'Non-Vegetarian Specialties'
                        : 'Main Meals & Delicacies'}
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Freshly cooked Biriyanis, Parottas, Fried Rice, Noodles, Gravies & Egg specialties.
                    </p>
                  </div>
                  <div className="mt-3 sm:mt-0 inline-flex items-center px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    <span>{mainMeals.length} dishes available</span>
                  </div>
                </div>

                {/* Main Meals Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {mainMeals.map((food) => (
                    <FoodCard key={food.id} food={food} onOpenDetails={setSelectedFood} />
                  ))}
                </div>
              </section>
            )}

            {/* SECTION 2: DEDICATED SNACKS & HOT BEVERAGES SECTION */}
            {(foodTypeFilter === 'All' || foodTypeFilter === 'Snacks') && snackItems.length > 0 && (
              <section
                id="snacks-section"
                className="scroll-mt-36 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-transparent dark:from-amber-950/20 dark:via-zinc-900/60 dark:to-zinc-900/40 border border-amber-500/20 dark:border-amber-500/20 rounded-3xl p-5 sm:p-7 space-y-6 shadow-lg shadow-amber-500/5"
              >
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-amber-500/20 pb-4">
                  <div>
                    <div className="inline-flex items-center space-x-1 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1.5">
                      <Coffee className="w-4 h-4 text-amber-500" />
                      <span>Evening Specials & Refreshments</span>
                    </div>
                    <div className="flex items-center space-x-2.5">
                      <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-brand-maroon dark:text-amber-400">
                        Fresh Evening Snacks & Beverages
                      </h2>
                      <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-brand-maroon text-[11px] font-extrabold shadow-sm">
                        <Sparkles className="w-3 h-3" />
                        <span>Hot & Fresh</span>
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 mt-1">
                      Crispy hot vadas, protein-packed sundals, green gram & authentic South Indian filter coffee / tea.
                    </p>
                  </div>
                  <div className="mt-3 sm:mt-0 inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-xs font-bold text-amber-800 dark:text-amber-300">
                    <Coffee className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>{snackItems.length} snack items</span>
                  </div>
                </div>

                {/* Snacks Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {snackItems.map((food) => (
                    <FoodCard key={food.id} food={food} onOpenDetails={setSelectedFood} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Food Details Modal */}
      <FoodDetailsModal food={selectedFood} onClose={() => setSelectedFood(null)} />
    </div>
  );
};
