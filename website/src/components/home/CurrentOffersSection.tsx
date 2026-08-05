import React from 'react';
import { Offer } from '../../types';
import { OfferCard } from '../cards/OfferCard';
import { Tag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CurrentOffersSectionProps {
  offers: Offer[];
  isLoading: boolean;
}

export const CurrentOffersSection: React.FC<CurrentOffersSectionProps> = ({ offers, isLoading }) => {
  if (!isLoading && offers.length === 0) return null;

  return (
    <section className="py-16 bg-brand-maroon-dark text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center space-x-1 text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">
              <Tag className="w-4 h-4 text-amber-400" />
              <span>Limited Time Specials</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-serif text-amber-400">
              Active Offers & Savings
            </h2>
          </div>

          <Link
            to="/offers"
            className="mt-4 sm:mt-0 inline-flex items-center space-x-1.5 text-sm font-bold text-amber-300 hover:text-amber-200 transition-colors"
          >
            <span>View All Offers</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-48 bg-white/10 rounded-3xl animate-pulse" />
            <div className="h-48 bg-white/10 rounded-3xl animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {offers.slice(0, 2).map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
