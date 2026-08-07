import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Hero: React.FC = () => {
  return (
    <section className="relative min-h-[70svh] sm:min-h-[82vh] lg:min-h-[88vh] bg-[#0c0503] text-white overflow-hidden flex items-center">

      {/* ── FULL-BLEED REALISTIC FEAST BACKGROUND IMAGE ── */}
      <div className="absolute inset-0 z-0 overflow-hidden">

        {/* Entrance + smooth subtle breathing scale */}
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1.0, opacity: 1 }}
          transition={{ duration: 1.8, ease: 'easeOut' }}
        >
          <motion.img
            src="/hero_madurai_feast.png"
            alt="Madurai Food Feast - Crispy Dosa, Seeraga Samba Biryani, Filter Coffee and Jigarthanda"
            className="w-full h-full object-cover object-[70%_center] lg:object-center"
            animate={{ scale: [1.0, 1.03, 1.0] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        {/* ── GRADIENT VIGNETTE OVERLAYS FOR OPTIMAL TEXT LEGIBILITY ── */}

        {/* Left dark shadow gradient for text overlay */}
        <div className="absolute inset-y-0 left-0 w-full lg:w-[60%] bg-gradient-to-r from-[#0c0503] via-[#0c0503]/90 to-transparent z-10 pointer-events-none" />

        {/* Top edge subtle fade */}
        <div className="absolute inset-x-0 top-0 h-[25%] bg-gradient-to-b from-[#0c0503] via-[#0c0503]/60 to-transparent z-10 pointer-events-none" />

        {/* Bottom edge fade */}
        <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-[#0c0503] via-[#0c0503]/70 to-transparent z-10 pointer-events-none" />

        {/* Dynamic radial glow overlay centered around the food */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 75% 50%, rgba(245, 158, 11, 0.08) 0%, rgba(12, 5, 3, 0.4) 60%, rgba(12, 5, 3, 0.85) 100%)',
          }}
        />
      </div>

      {/* ── HERO CONTENT (LEFT ALIGNED) ── */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-10 sm:py-16 lg:py-24">
        <div className="max-w-2xl flex flex-col items-start text-left space-y-5 sm:space-y-6">

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-extrabold leading-[1.1] sm:leading-[1.1] tracking-tight"
            style={{
              textShadow: '0 2px 10px rgba(0,0,0,0.9), 0 8px 30px rgba(0,0,0,0.85)',
            }}
          >
            <span className="text-white">Taste the </span>
            <span className="text-[#f59e0b]">Pride of</span>
            <br />
            <span className="text-[#f59e0b]">Madurai</span>
          </motion.h1>

          {/* Subheading Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-base sm:text-lg md:text-xl text-zinc-200 font-normal leading-relaxed max-w-xl"
            style={{
              textShadow: '0 2px 6px rgba(0,0,0,0.95)',
            }}
          >
            Experience traditional South Indian culinary mastery — from legendary
            Kari Dosa, aromatic Seeraga Samba Biryani, fluffy Idlis, to refreshing
            Jigarthanda.
          </motion.p>

          {/* Call to Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4 w-full sm:w-auto"
          >
            <Link
              to="/menu"
              className="px-6 sm:px-7 py-3.5 rounded-xl
                         bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600
                         hover:from-amber-400 hover:to-amber-500
                         text-[#120704] font-extrabold text-sm sm:text-base
                         flex items-center justify-center gap-2.5
                         shadow-xl shadow-amber-500/25
                         hover:scale-[1.02] hover:shadow-amber-500/40
                         transition-all duration-200 border border-amber-400/60
                         w-full sm:w-auto"
            >
              <Utensils className="w-4 h-4 text-[#120704]" />
              <span>Explore Today's Menu</span>
              <ArrowRight className="w-4 h-4 text-[#120704]" />
            </Link>

            <Link
              to="/combos"
              className="px-6 sm:px-7 py-3.5 rounded-xl
                         bg-[#23140d]/80 hover:bg-[#331d13]
                         text-white font-bold text-sm sm:text-base
                         flex items-center justify-center gap-2
                         backdrop-blur-md border border-[#523829] hover:border-amber-500/50
                         transition-all duration-200 w-full sm:w-auto"
            >
              <span>View Special Combos</span>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
