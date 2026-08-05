import React from 'react';
import { Award, ShieldCheck, Heart, Sparkles } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-brand-cream dark:bg-zinc-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Madurai Heritage & Taste</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-serif text-brand-maroon dark:text-white">
            Our Culinary Legacy
          </h1>
          <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Welcome to Madurai Food Corner — where centuries of South Indian cooking traditions, authentic spices, and heartfelt hospitality come together under one roof.
          </p>
        </div>

        {/* Hero Showcase Card with Uploaded Logo */}
        <div className="bg-gradient-to-r from-brand-maroon via-brand-maroon-dark to-black rounded-3xl p-8 lg:p-12 text-white shadow-2xl border border-amber-500/30 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-4 flex justify-center">
            <img
              src="/logo.png"
              alt="Madurai Food Corner Logo"
              className="w-56 h-56 rounded-full object-cover border-4 border-amber-400 shadow-2xl"
            />
          </div>
          <div className="lg:col-span-8 space-y-4">
            <h2 className="text-3xl font-bold font-serif text-amber-400">
              Preserving the Real Taste of Madurai
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Madurai is celebrated world over as the food capital of Tamil Nadu — famous for round-the-clock street food stalls, aromatic Biryani, Kari Dosa, and heavenly Jigarthanda. At Madurai Food Corner, we adhere strictly to authentic recipes, slow-wood-fire cooking methods, and freshly stone-ground spices to deliver pure nostalgia on your plate.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs text-amber-300">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>100% Traditional</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span>FSSAI Certified</span>
              </div>
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-amber-400" />
                <span>Made with Love</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
