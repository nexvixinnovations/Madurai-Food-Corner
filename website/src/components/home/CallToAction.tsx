import React from 'react';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CallToAction: React.FC = () => {
  return (
    <section className="py-12 md:py-20 bg-gradient-to-r from-brand-maroon via-brand-maroon-dark to-black text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <img
            src="/logo.png"
            alt="Madurai Food Corner Logo"
            className="w-20 h-20 rounded-full mx-auto border-2 border-amber-400 object-cover shadow-2xl"
          />
          <h2 className="text-3xl sm:text-5xl font-extrabold font-serif text-amber-400 leading-tight">
            Hungry for Authentic Madurai Food?
          </h2>
          <p className="text-sm sm:text-base text-zinc-300 max-w-xl mx-auto leading-relaxed">
            Order online now for hot delivery or takeaway. Experience traditional South Indian delicacies prepared fresh to order.
          </p>

          <div className="pt-4 flex justify-center">
            <Link
              to="/menu"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-brand-maroon font-bold text-sm flex items-center justify-center space-x-2 shadow-xl shadow-amber-500/20 hover:scale-105 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Order Online Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
