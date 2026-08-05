import React from 'react';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatters';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Percent, TrendingUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { websiteApi } from '../services/api';


export const Cart: React.FC = () => {
  const { items, updateQuantity, removeItem, clearCart, discountPreview, setDiscountSettings } = useCart();
  const navigate = useNavigate();

  // Fetch discount settings from backend to ensure discount preview is accurate
  useQuery({
    queryKey: ['restaurant-info-for-cart'],
    queryFn: async () => {
      const settings = await websiteApi.getRestaurantInfo();
      setDiscountSettings(settings);
      return settings;
    },
    staleTime: 30_000,
  });

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-brand-cream dark:bg-zinc-950 py-16 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
          <ShoppingBag className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mx-auto stroke-1" />
          <h2 className="text-2xl font-bold font-serif text-brand-maroon dark:text-white">Your Cart is Empty</h2>
          <p className="text-xs text-zinc-500">You haven't added any food items, combos, or offers to your cart yet.</p>
          <Link
            to="/menu"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-amber-500 text-brand-maroon font-bold text-xs hover:bg-amber-400 transition-colors shadow-md"
          >
            <span>Browse Today's Menu</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const dp = discountPreview;

  return (
    <div className="min-h-screen bg-brand-cream dark:bg-zinc-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold font-serif text-brand-maroon dark:text-white">
            Shopping Cart ({items.length} items)
          </h1>
          <button
            onClick={clearCart}
            className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center space-x-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Cart</span>
          </button>
        </div>

        {/* Discount progress message */}
        {dp && dp.isDiscountEnabled && (
          <div
            className={`w-full px-5 py-3 rounded-2xl flex items-center space-x-3 text-sm font-semibold border
              ${dp.amountToUnlock <= 0
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
              }`}
          >
            <TrendingUp className="w-5 h-5 shrink-0" />
            {dp.amountToUnlock <= 0 ? (
              <span>🎉 You've unlocked {dp.discountPercent}% OFF on your regular items and combos!</span>
            ) : (
              <span>
                Add {formatCurrency(dp.amountToUnlock)} more from regular items or combos to unlock{' '}
                <span className="font-extrabold">{dp.discountPercent}% OFF</span>.
                <span className="font-normal opacity-75"> (Special Offers don't count toward this.)</span>
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Items Table */}
          <div className="lg:col-span-8 space-y-4">
            {items.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-md flex items-center space-x-4"
              >
                <img
                  src={item.image_url || '/logo.png'}
                  alt={item.name}
                  className="w-20 h-20 rounded-2xl object-cover border border-amber-500/20"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-brand-maroon dark:text-white truncate">
                      {item.name}
                    </h3>
                    {item.is_special_offer && (
                      <span className="shrink-0 px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-bold border border-orange-200 dark:border-orange-700">
                        SPECIAL OFFER
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Price: {formatCurrency(item.unit_price)}
                    {item.is_special_offer && (
                      <span className="ml-2 text-orange-500 text-[10px]">
                        (Discount excluded — fixed price)
                      </span>
                    )}
                  </p>
                  <p className="text-sm font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                    Line Total: {formatCurrency(item.unit_price * item.quantity)}
                  </p>
                </div>

                <div className="flex items-center space-x-3 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-2xl">
                  <button
                    onClick={() => updateQuantity(item.id, item.type, item.quantity - 1)}
                    className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold w-6 text-center text-brand-maroon dark:text-amber-400">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.type, item.quantity + 1)}
                    className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.id, item.type)}
                  className="p-2 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Order Summary Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xl space-y-4">
              <h3 className="text-lg font-bold font-serif text-brand-maroon dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3">
                Order Summary
              </h3>

              <div className="space-y-3 text-xs">
                {/* Eligible items subtotal */}
                {dp && dp.eligibleSubtotal > 0 && (
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Eligible Items (Regular + Combos)</span>
                    <span className="font-semibold text-brand-maroon dark:text-amber-400">
                      {formatCurrency(dp.eligibleSubtotal)}
                    </span>
                  </div>
                )}

                {/* Special offer items subtotal */}
                {dp && dp.specialOfferSubtotal > 0 && (
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span className="flex items-center space-x-1">
                      <span>Special Offers</span>
                      <span className="text-orange-500 font-bold text-[9px] border border-orange-300 rounded px-1">FIXED PRICE</span>
                    </span>
                    <span className="font-semibold text-orange-500">
                      {formatCurrency(dp.specialOfferSubtotal)}
                    </span>
                  </div>
                )}

                {/* Show plain subtotal if no breakdown needed */}
                {(!dp || (dp.eligibleSubtotal === 0 && dp.specialOfferSubtotal === 0)) && (
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Subtotal</span>
                    <span className="font-semibold text-brand-maroon dark:text-amber-400">
                      {formatCurrency(items.reduce((s, i) => s + i.unit_price * i.quantity, 0))}
                    </span>
                  </div>
                )}

                {/* Order Value Discount */}
                {dp && dp.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold border-t border-zinc-100 dark:border-zinc-800 pt-2">
                    <span className="flex items-center space-x-1">
                      <Percent className="w-3 h-3" />
                      <span>Order Discount ({dp.discountPercent}%)</span>
                    </span>
                    <span>-{formatCurrency(dp.discountAmount)}</span>
                  </div>
                )}

                {/* Discount not applied nudge */}
                {dp && dp.isDiscountEnabled && dp.discountAmount === 0 && dp.minimumAmount > 0 && (
                  <div className="text-[10px] text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2">
                    <strong>{dp.discountPercent}% OFF</strong> unlocks when Regular + Combo total ≥{' '}
                    {formatCurrency(dp.minimumAmount)}. Special Offers excluded.
                  </div>
                )}

                {/* Grand Total */}
                <div className="flex justify-between text-base font-extrabold text-brand-maroon dark:text-brand-gold pt-3 border-t border-zinc-200 dark:border-zinc-700">
                  <span>Grand Total</span>
                  <span>{formatCurrency(dp ? dp.grandTotal : items.reduce((s, i) => s + i.unit_price * i.quantity, 0))}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-brand-maroon font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-all"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
