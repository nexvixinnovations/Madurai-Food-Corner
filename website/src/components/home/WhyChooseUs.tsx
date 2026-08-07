import React from 'react';
import { ShieldCheck, Flame, HeartHandshake } from 'lucide-react';

export const WhyChooseUs: React.FC = () => {
  const features = [
    {
      icon: <Flame className="w-8 h-8 text-amber-500" />,
      title: 'Heritage Madurai Recipes',
      description: 'Handcrafted traditional spice masalas blended daily for legendary taste.',
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-amber-500" />,
      title: 'Fresh Meat & Vegetables',
      description: 'Strict hygiene protocols, 100% fresh meat and farm-picked vegetables.',
    },
    {
      icon: <HeartHandshake className="w-8 h-8 text-amber-500" />,
      title: 'Unmatched Customer Care',
      description: 'Dedicated team ensuring every order exceeds your dining expectations.',
    },
  ];

  return (
    <section className="py-10 md:py-20 bg-brand-cream dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8 md:mb-16">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
            The Madurai Promise
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-serif text-brand-maroon dark:text-white mt-2">
            Why Food Lovers Choose Us
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-3 leading-relaxed">
            We preserve centuries-old South Indian cooking traditions to serve you pure authentic bliss with every single bite.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-md hover:shadow-xl hover:border-amber-500/30 transition-all duration-300 flex flex-col items-center text-center space-y-4 group"
            >
              <div className="p-4 rounded-2xl bg-amber-500/10 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-brand-maroon dark:text-amber-400">
                {feature.title}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
