import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatters';

export const FloatingCartBar: React.FC = () => {
  const { totalItems, subtotal, openDrawer } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  // Do not render floating cart bar if cart is empty or on checkout / order-success pages
  if (totalItems === 0) return null;
  if (location.pathname.startsWith('/checkout') || location.pathname.startsWith('/order-success')) return null;

  const handleAction = () => {
    // If on mobile bottom nav area, open drawer or go to checkout
    if (window.innerWidth < 768) {
      openDrawer();
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-lg transition-all duration-300 animate-bounce-short">
      <div className="bg-gradient-to-r from-brand-maroon via-zinc-900 to-brand-maroon dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 text-white p-3.5 sm:p-4 rounded-3xl shadow-2xl border border-amber-500/40 backdrop-blur-md flex items-center justify-between">
        {/* Left Side: Icon & Summary */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={openDrawer}>
          <div className="relative p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-brand-maroon">
              {totalItems}
            </span>
          </div>
          <div>
            <div className="text-xs font-bold text-amber-400">
              {totalItems} {totalItems === 1 ? 'Item' : 'Items'} in Cart
            </div>
            <div className="text-sm font-extrabold text-white">
              {formatCurrency(subtotal)}
            </div>
          </div>
        </div>

        {/* Right Side: View Cart / Checkout Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={openDrawer}
            className="hidden sm:inline-flex px-3 py-2 text-xs font-bold text-zinc-300 hover:text-amber-400 transition-colors"
          >
            View Cart
          </button>
          <button
            onClick={handleAction}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-brand-maroon text-xs font-extrabold flex items-center space-x-1.5 shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <span>Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
