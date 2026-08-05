import React from 'react';
import { FoodItem } from '../../types';
import { FoodCard } from '../cards/FoodCard';
import { FoodCardSkeleton } from '../common/Skeleton';
import { ArrowRight, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FeaturedFoodsProps {
  foods: FoodItem[];
  isLoading: boolean;
  onOpenDetails: (food: FoodItem) => void;
}

export const FeaturedFoods: React.FC<FeaturedFoodsProps> = ({ foods, isLoading, onOpenDetails }) => {
  return (
    <section className="py-16 bg-brand-cream dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center space-x-1 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Chef's Choice</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-serif text-brand-maroon dark:text-white">
              Today's Popular Delicacies
            </h2>
          </div>

          <Link
            to="/menu"
            className="mt-4 sm:mt-0 inline-flex items-center space-x-1.5 text-sm font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
          >
            <span>View Full Menu</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid Display */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <FoodCardSkeleton key={n} />
            ))}
          </div>
        ) : foods.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            No featured food items available right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {foods.slice(0, 8).map((food) => (
              <FoodCard key={food.id} food={food} onOpenDetails={onOpenDetails} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
