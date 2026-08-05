import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Utensils, Package, Tag, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { totalItems, toggleDrawer } = useCart();

  const navItems = [
    { name: 'Home', path: '/', icon: <Home className="w-5 h-5" /> },
    { name: 'Menu', path: '/menu', icon: <Utensils className="w-5 h-5" /> },
    { name: 'Combos', path: '/combos', icon: <Package className="w-5 h-5" /> },
    { name: 'Offers', path: '/offers', icon: <Tag className="w-5 h-5" /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-brand-maroon/95 dark:bg-zinc-900/95 backdrop-blur-lg border-t border-amber-500/20 px-2 py-2 shadow-2xl">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center min-h-[48px] px-3 py-1 rounded-2xl transition-all ${
                active
                  ? 'text-amber-400 font-bold scale-105'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="text-[10px] tracking-wider mt-1">{item.name}</span>
            </Link>
          );
        })}

        {/* Cart Action Button with Badge */}
        <button
          onClick={toggleDrawer}
          className="relative flex flex-col items-center justify-center min-h-[48px] px-3 py-1 rounded-2xl text-amber-400 hover:text-amber-300 transition-all"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-brand-maroon animate-pulse">
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-wider mt-1 font-bold">Cart</span>
        </button>
      </div>
    </div>
  );
};
