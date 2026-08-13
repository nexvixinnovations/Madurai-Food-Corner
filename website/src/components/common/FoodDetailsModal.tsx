import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Plus, Minus, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { FoodItem } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';

interface FoodDetailsModalProps {
  food: FoodItem | null;
  onClose: () => void;
}

export const FoodDetailsModal: React.FC<FoodDetailsModalProps> = ({ food, onClose }) => {
  const [quantity, setQuantity] = useState<number>(1);
  const { addItem } = useCart();

  if (!food) return null;

  const isOffer = food.offer_enabled && food.offer_price && food.offer_price > 0;
  const activePrice = isOffer ? food.offer_price! : food.price;
  const isVeg = food.food_type?.toLowerCase() === 'veg';
  const isAvailable = food.available !== false && food.online_available !== false;

  const handleAddToCart = () => {
    if (!isAvailable) {
      toast.error('This item is not available to order');
      return;
    }
    addItem(
      {
        type: 'food',
        id: food.id,
        name: food.name,
        image_url: food.image_url,
        food_type: food.food_type,
        price: food.price,
        unit_price: activePrice,
        preparation_time: food.preparation_time,
      },
      quantity
    );
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-amber-500/20"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Image & Header */}
          <div className="relative h-64 w-full bg-zinc-800 overflow-hidden">
            <img
              src={food.image_url || '/logo.png'}
              alt={food.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center space-x-1 ${
                isVeg ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isVeg ? 'bg-emerald-200' : 'bg-red-200'}`} />
                <span>{food.food_type || 'Veg'}</span>
              </span>
              {isOffer && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-brand-maroon flex items-center space-x-1">
                  <Tag className="w-3 h-3" />
                  <span>Special Offer</span>
                </span>
              )}
            </div>

            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
                {food.category}
              </span>
              <h2 className="text-2xl font-bold font-serif leading-tight">
                {food.name}
              </h2>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6">
            {/* Prep Time & Pricing */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-zinc-500 dark:text-zinc-400 space-x-1">
              </div>

              <div className="text-right">
                {isOffer && (
                  <span className="text-xs text-zinc-400 line-through mr-2">
                    {formatCurrency(food.price)}
                  </span>
                )}
                <span className="text-2xl font-extrabold text-brand-maroon dark:text-brand-gold">
                  {formatCurrency(activePrice)}
                </span>
              </div>
            </div>

            {/* Description */}
            {food.description && (
              <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {food.description}
              </p>
            )}

            {/* Quantity Selector & Add to Cart Button */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
              {food.available !== false && food.online_available !== false ? (
                <>
                  <div className="flex items-center space-x-3 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold w-6 text-center text-brand-maroon dark:text-amber-400">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="flex-1 ml-4 py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-brand-maroon font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-all active:scale-[0.98]"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart ({formatCurrency(activePrice * quantity)})</span>
                  </button>
                </>
              ) : food.available !== false && food.online_available === false ? (
                <button
                  onClick={() => toast.error('This item is available in-store only')}
                  className="w-full py-3.5 px-6 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold text-sm flex items-center justify-center space-x-2 border border-zinc-200 dark:border-zinc-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                >
                  <span>Available In-Store Only</span>
                </button>
              ) : (
                <button
                  onClick={() => toast.error('This item is not available today')}
                  className="w-full py-3.5 px-6 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 font-bold text-sm flex items-center justify-center space-x-2 border border-zinc-200 dark:border-zinc-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <span>Not Available Today</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
