import React from 'react';
import { Offer, FoodItem, SpecialOfferItemRelation } from '../../types';
import { OfferCard, EnhancedOffer } from '../cards/OfferCard';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CurrentOffersSectionProps {
  offers: Offer[];
  foods?: FoodItem[];
  isLoading: boolean;
}

export const CurrentOffersSection: React.FC<CurrentOffersSectionProps> = ({ offers, foods = [], isLoading }) => {
  // Helper map for food names to Cloudinary image URLs
  const foodImageMap = React.useMemo(() => {
    const map = new Map<string, string>();
    foods.forEach((f) => {
      if (f.name && f.image_url) {
        map.set(f.name.toLowerCase().trim(), f.image_url);
      }
    });
    return map;
  }, [foods]);

  // Process promotional offers from DB
  const combinedOffers: EnhancedOffer[] = React.useMemo(() => {
    return offers.map((offer) => {
      const componentImages: { name: string; url: string }[] = [];

      // Extract component images from special_offer_items relation or title
      if (offer.special_offer_items && offer.special_offer_items.length > 0) {
        offer.special_offer_items.forEach((soi: SpecialOfferItemRelation) => {
          if (soi.food_items?.name && soi.food_items?.image_url) {
            componentImages.push({
              name: soi.food_items.name,
              url: soi.food_items.image_url,
            });
          }
        });
      } else if (offer.title.includes('+')) {
        const titleWithoutTag = offer.title.split(':').pop() || offer.title;
        const parts = titleWithoutTag.split('+').map((p) => p.trim());
        parts.forEach((partName) => {
          const matchedUrl = foodImageMap.get(partName.toLowerCase());
          if (matchedUrl) {
            componentImages.push({ name: partName, url: matchedUrl });
          }
        });
      }

      return {
        ...offer,
        componentImages: componentImages.length > 0 ? componentImages : undefined,
        isComboOffer: false,
      };
    });
  }, [offers, foodImageMap]);

  if (!isLoading && combinedOffers.length === 0) return null;

  return (
    <section className="py-10 md:py-16 bg-brand-maroon-dark text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 md:mb-12">
          <div>
            <div className="inline-flex items-center space-x-1 text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Limited Time Specials</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-serif text-amber-400">
              Special Offers & Deals
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
            <div className="h-56 bg-white/10 rounded-3xl animate-pulse" />
            <div className="h-56 bg-white/10 rounded-3xl animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {combinedOffers.slice(0, 4).map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
