import React from 'react';
import { Clock, Plus, Tag } from 'lucide-react';
import { FoodItem } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';

interface FoodCardProps {
  food: FoodItem;
  onOpenDetails?: (food: FoodItem) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({ food, onOpenDetails }) => {
  const { addItem } = useCart();

  const isOffer = food.offer_enabled && food.offer_price && Number(food.offer_price) > 0;
  const activePrice = isOffer ? Number(food.offer_price) : Number(food.price);
  const isVeg = food.food_type?.toLowerCase() === 'veg';
  const hasImage = food.image_url && food.image_url.trim() !== '';

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      type: 'food',
      id: food.id,
      name: food.name,
      image_url: food.image_url,
      food_type: food.food_type,
      price: food.price,
      unit_price: activePrice,
      preparation_time: food.preparation_time,
    });
  };

  return (
    <div
      onClick={() => onOpenDetails && onOpenDetails(food)}
      className="group bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80 shadow-md hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col cursor-pointer active:scale-[0.99]"
    >
      {/* Real Cloudinary Image Header (Only rendered when real image_url exists - NO MOCK/PLACEHOLDER IMAGES) */}
      {hasImage ? (
        <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          <img
            src={food.image_url!}
            alt={food.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          <div className="absolute top-3 left-3 flex items-center space-x-1.5">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 ${
                isVeg ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-emerald-200' : 'bg-red-200'}`} />
              <span>{food.food_type || 'Veg'}</span>
            </span>

            {isOffer && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-brand-maroon flex items-center space-x-1 shadow-sm">
                <Tag className="w-3 h-3" />
                <span>Offer</span>
              </span>
            )}
          </div>

          {food.preparation_time && (
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-medium text-white flex items-center space-x-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{food.preparation_time}m</span>
            </div>
          )}
        </div>
      ) : (
        /* Clean Text-Based Header For Items Without Image */
        <div className="p-4 sm:p-5 pb-0 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 ${
                isVeg ? 'bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-red-600/10 text-red-600 dark:text-red-400 border border-red-500/20'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span>{food.food_type || 'Veg'}</span>
            </span>

            {isOffer && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-brand-maroon flex items-center space-x-1 shadow-sm">
                <Tag className="w-3 h-3" />
                <span>Offer</span>
              </span>
            )}
          </div>

          {food.preparation_time && (
            <div className="text-[10px] font-medium text-zinc-400 flex items-center space-x-1">
              <Clock className="w-3 h-3 text-amber-500" />
              <span>{food.preparation_time}m</span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
            {food.category}
          </span>
          <h3 className="text-base sm:text-lg font-bold text-brand-maroon dark:text-white line-clamp-1 group-hover:text-amber-500 transition-colors">
            {food.name}
          </h3>
          {food.description && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
              {food.description}
            </p>
          )}
        </div>

        {/* Price & Touch-Friendly Add Button */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <div>
            {isOffer && (
              <span className="text-xs text-zinc-400 line-through mr-1.5">
                {formatCurrency(food.price)}
              </span>
            )}
            <span className="text-lg sm:text-xl font-extrabold text-brand-maroon dark:text-brand-gold">
              {formatCurrency(activePrice)}
            </span>
          </div>

          <button
            onClick={handleQuickAdd}
            className="px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-brand-maroon font-bold text-xs flex items-center space-x-1 shadow-md transition-all min-h-[44px] min-w-[44px] justify-center"
            title="Add to Cart"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};
