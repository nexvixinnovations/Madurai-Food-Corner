import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';

export const CartDrawer: React.FC = () => {
  const { items, isDrawerOpen, closeDrawer, updateQuantity, removeItem, subtotal, totalItems } = useCart();
  const navigate = useNavigate();

  if (!isDrawerOpen) return null;

  const handleCheckout = () => {
    closeDrawer();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeDrawer}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Responsive Drawer Container (Bottom Sheet on mobile, Right Drawer on desktop) */}
        <div className="fixed inset-x-0 bottom-0 md:inset-y-0 md:left-auto md:right-0 md:w-full md:max-w-md flex flex-col pointer-events-none">
          <motion.div
            initial={{ y: '100%', x: 0 }}
            animate={{ y: 0, x: 0 }}
            exit={{ y: '100%', x: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="pointer-events-auto w-full h-[85vh] md:h-full bg-white dark:bg-zinc-900 shadow-2xl flex flex-col rounded-t-3xl md:rounded-none border-t md:border-t-0 md:border-l border-amber-500/20 overflow-hidden"
          >
            {/* Mobile Drag Indicator Pill */}
            <div className="md:hidden w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto my-2.5 flex-shrink-0" />

            {/* Drawer Header */}
            <div className="px-6 py-4 md:py-6 bg-brand-maroon text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-amber-500 text-brand-maroon">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-serif leading-tight">Your Order Cart</h2>
                  <p className="text-xs text-amber-300 font-sans">{totalItems} items selected</p>
                </div>
              </div>
              <button
                onClick={closeDrawer}
                className="p-2.5 rounded-full hover:bg-white/10 text-white transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400">
                  <ShoppingBag className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mb-4 stroke-1" />
                  <p className="text-base font-semibold text-zinc-600 dark:text-zinc-300 mb-1">Your Cart is Empty</p>
                  <p className="text-xs text-zinc-400 mb-6">Looks like you haven't added any items yet.</p>
                  <button
                    onClick={() => {
                      closeDrawer();
                      navigate('/menu');
                    }}
                    className="px-6 py-3 rounded-2xl bg-amber-500 text-brand-maroon font-bold text-xs hover:bg-amber-400 transition-colors min-h-[48px]"
                  >
                    Browse Menu
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="flex items-center space-x-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/50 dark:border-zinc-700/50"
                  >
                    <img
                      src={item.image_url || '/logo.png'}
                      alt={item.name}
                      className="w-14 h-14 md:w-16 md:h-16 rounded-xl object-cover border border-amber-500/20 flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo.png';
                      }}
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs md:text-sm font-bold text-brand-maroon dark:text-brand-gold truncate">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {formatCurrency(item.unit_price)} each
                      </p>
                      <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                        Total: {formatCurrency(item.unit_price * item.quantity)}
                      </p>
                    </div>

                    {/* Quantity Controls with min 48px touch targets */}
                    <div className="flex flex-col items-end space-y-1">
                      <div className="flex items-center space-x-1 bg-white dark:bg-zinc-700 p-1 rounded-xl border border-zinc-200 dark:border-zinc-600">
                        <button
                          onClick={() => updateQuantity(item.id, item.type, item.quantity - 1)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-600 min-h-[36px] min-w-[36px]"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold w-5 text-center text-brand-maroon dark:text-amber-400">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.type, item.quantity + 1)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-600 min-h-[36px] min-w-[36px]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id, item.type)}
                        className="text-red-500 hover:text-red-700 text-xs p-1 min-h-[32px] flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary & Checkout */}
            {items.length > 0 && (
              <div className="p-4 md:p-6 bg-zinc-50 dark:bg-zinc-800/80 border-t border-zinc-200 dark:border-zinc-700 space-y-3 flex-shrink-0">
                <div className="space-y-1.5 text-xs md:text-sm">
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Subtotal</span>
                    <span className="font-semibold text-brand-maroon dark:text-amber-400">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-brand-maroon dark:text-brand-gold pt-1.5 border-t border-zinc-200 dark:border-zinc-700">
                    <span>Total Amount</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-brand-maroon font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-all min-h-[52px]"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
