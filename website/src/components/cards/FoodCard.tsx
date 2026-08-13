import React from 'react';
import { Plus, Tag } from 'lucide-react';
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
  const isAvailable = food.available !== false && food.online_available !== false;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAvailable) return;
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
      onClick={() => isAvailable && onOpenDetails && onOpenDetails(food)}
      className={`group bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80 shadow-md transition-all duration-300 flex flex-col ${
        isAvailable ? 'hover:shadow-xl hover:shadow-amber-500/10 cursor-pointer active:scale-[0.99]' : 'opacity-70 cursor-not-allowed'
      }`}
    >
      {/* Real Cloudinary Image Header */}
      {hasImage ? (
        <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          <img
            src={food.image_url!}
            alt={food.name}
            loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isAvailable ? 'group-hover:scale-105' : 'filter grayscale-[40%]'
            }`}
          />

          {/* White Fade Overlay & Not Available Notification Badge */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-white/75 dark:bg-zinc-950/75 backdrop-blur-[2px] flex items-center justify-center z-10">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-red-600 text-white shadow-xl tracking-wider uppercase border border-red-400/30">
                Not Available
              </span>
            </div>
          )}

          <div className="absolute top-3 left-3 flex items-center space-x-1.5 z-20">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 ${
                isVeg ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-emerald-200' : 'bg-red-200'}`} />
              <span>{food.food_type || 'Veg'}</span>
            </span>

            {isOffer && isAvailable && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-brand-maroon flex items-center space-x-1 shadow-sm">
                <Tag className="w-3 h-3" />
                <span>Offer</span>
              </span>
            )}
          </div>
        </div>
      ) : (
        /* Clean Text-Based Header For Items Without Image */
        <div className="relative p-4 sm:p-5 pb-0 flex items-center justify-between">
          {!isAvailable && (
            <div className="absolute inset-0 bg-white/75 dark:bg-zinc-950/75 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-t-3xl">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-red-600 text-white shadow-xl tracking-wider uppercase border border-red-400/30">
                Not Available
              </span>
            </div>
          )}

          <div className="flex items-center space-x-1.5">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 ${
                isVeg ? 'bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-red-600/10 text-red-600 dark:text-red-400 border border-red-500/20'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span>{food.food_type || 'Veg'}</span>
            </span>

            {isOffer && isAvailable && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-brand-maroon flex items-center space-x-1 shadow-sm">
                <Tag className="w-3 h-3" />
                <span>Offer</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
            {food.category}
          </span>
          <h3 className={`text-base sm:text-lg font-bold text-brand-maroon dark:text-white line-clamp-1 transition-colors ${
            isAvailable ? 'group-hover:text-amber-500' : 'text-zinc-400 dark:text-zinc-500'
          }`}>
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
            {isOffer && isAvailable && (
              <span className="text-xs text-zinc-400 line-through mr-1.5">
                {formatCurrency(food.price)}
              </span>
            )}
            <span className={`text-lg sm:text-xl font-extrabold ${isAvailable ? 'text-brand-maroon dark:text-brand-gold' : 'text-zinc-400 dark:text-zinc-600'}`}>
              {formatCurrency(activePrice)}
            </span>
          </div>

          {isAvailable ? (
            <button
              onClick={handleQuickAdd}
              className="px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-brand-maroon font-bold text-xs flex items-center space-x-1 shadow-md transition-all min-h-[44px] min-w-[44px] justify-center"
              title="Add to Cart"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          ) : (
            <button
              disabled
              className="px-3.5 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 font-bold text-xs flex items-center justify-center cursor-not-allowed border border-zinc-200 dark:border-zinc-700/50"
            >
              <span>Not Available</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
