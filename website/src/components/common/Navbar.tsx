import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Sun, Moon, Menu as MenuIcon, X, Phone, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { websiteApi } from '../../services/api';
import { RestaurantSettings } from '../../types';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const { totalItems, toggleDrawer } = useCart();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  useEffect(() => {
    websiteApi
      .getRestaurantInfo()
      .then((data) => setSettings(data))
      .catch(() => null);
  }, []);

  const { data: orderingStatus } = useQuery({
    queryKey: ['orderingStatus'],
    queryFn: () => websiteApi.getOrderingStatus(),
    refetchInterval: 30000,
  });

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: "Today's Menu", path: '/menu' },
    { name: 'Combos', path: '/combos' },
    { name: 'Offers', path: '/offers' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  // ─── Automatic Order Value Discount Advertisement ───
  // Reads tier1_min_amount and tier1_percentage from settings.
  // Only shown when order_discount_enabled = true and both values are valid.
  let offerAdText = '';
  let offerAdSubtext = '';
  if (settings?.order_discount_enabled) {
    const minAmount = Number(settings.tier1_min_amount || 0);
    const pct = Number(settings.tier1_percentage || 0);
    if (minAmount > 0 && pct > 0) {
      offerAdText = `🔥 GET ${pct}% OFF ON ORDERS OF ₹${minAmount} OR MORE!`;
      offerAdSubtext = 'Applicable on regular menu items and combos. Special offers excluded.';
    }
  }

  const scheduleBannerText = orderingStatus?.enabled ? orderingStatus.bannerText : '';

  return (
    <header className="sticky top-0 z-50 w-full text-white shadow-xl">
      {/* Daily Ordering Acceptance Window Banner */}
      {scheduleBannerText && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-brand-maroon px-4 py-1.5 text-center text-xs font-black tracking-wide flex items-center justify-center space-x-2 shadow-md border-b border-amber-600/30">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>📢 {scheduleBannerText}</span>
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
        </div>
      )}

      {/* Dynamic Order Value Discount Advertisement Banner (Auto-Advertised from Backend Settings) */}
      {offerAdText && (
        <div className="bg-gradient-to-r from-brand-maroon via-[#5C1A0F] to-brand-maroon text-amber-400 px-4 py-2 text-center shadow-md">
          <div className="flex items-center justify-center space-x-2 text-xs font-black tracking-wide">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span>{offerAdText}</span>
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
          </div>
          {offerAdSubtext && (
            <p className="text-[10px] text-amber-300/70 mt-0.5 font-normal tracking-normal">
              {offerAdSubtext}
            </p>
          )}
        </div>
      )}

      {/* Top Contact Bar */}
      <div className="bg-[#120704] border-b border-amber-500/20 text-[#f59e0b] px-4 py-1.5 text-xs font-semibold">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center space-x-5 text-amber-200/90">
            <span className="flex items-center space-x-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>9952250435 / 7708382018</span>
            </span>
          </div>
          <div className="hidden sm:block tracking-widest uppercase font-bold text-[10px] text-amber-400/80">
            Authentic South Indian Cuisine
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="bg-[#170a05]/95 dark:bg-[#0b0402]/95 backdrop-blur-md border-b border-amber-500/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo & Brand Name */}
            <Link to="/" className="flex items-center space-x-3.5 group">
              <div className="relative">
                <img
                  src="/logo.png"
                  alt="Madurai Food Corner Logo"
                  className="w-12 h-12 rounded-full border-2 border-amber-400 object-cover shadow-lg group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 rounded-full ring-2 ring-amber-400/30 ring-offset-1 ring-offset-black pointer-events-none" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-amber-400 group-hover:text-amber-300 transition-colors">
                  Madurai Food Corner
                </span>
                <span className="text-[10px] text-amber-200/80 uppercase tracking-widest -mt-0.5 font-bold">
                  Restaurant & Catering
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-7">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-semibold transition-all relative py-1.5 ${
                    isActive(link.path)
                      ? 'text-amber-400 font-bold'
                      : 'text-zinc-200 hover:text-amber-300'
                  }`}
                >
                  {link.name}
                  {isActive(link.path) && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full shadow-sm shadow-amber-400/50" />
                  )}
                </Link>
              ))}
            </nav>

            {/* Right Action Icons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-full bg-zinc-900/60 hover:bg-zinc-800 border border-amber-500/20 text-amber-300 transition-colors shadow-inner"
                title="Toggle Light/Dark Theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-amber-200" />}
              </button>

              <button
                onClick={toggleDrawer}
                className="relative px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#170a05] font-bold shadow-md shadow-amber-500/20 hover:shadow-amber-500/40 transition-all flex items-center space-x-2 border border-amber-400/50"
              >
                <ShoppingBag className="w-4 h-4 text-[#170a05]" />
                <span className="text-xs font-extrabold tracking-wide">Cart</span>
                {totalItems > 0 && (
                  <span className="ml-1 bg-red-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border border-amber-300">
                    {totalItems}
                  </span>
                )}
              </button>

              <button
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="lg:hidden p-2 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#120704] border-b border-amber-500/20 px-4 pt-3 pb-6 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive(link.path)
                    ? 'bg-amber-500 text-[#170a05] font-bold shadow-md shadow-amber-500/20'
                    : 'text-zinc-200 hover:bg-amber-500/10 hover:text-amber-400'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};
