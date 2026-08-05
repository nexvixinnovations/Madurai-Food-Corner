import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { websiteApi } from '../services/api';
import { OfferCard } from '../components/cards/OfferCard';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { Sparkles } from 'lucide-react';
import { SpecialOfferItemRelation } from '../types';

export const Offers: React.FC = () => {
  const { data: offers = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['offers'],
    queryFn: () => websiteApi.getActiveOffers(),
  });

  const { data: foods = [] } = useQuery({
    queryKey: ['todayMenu'],
    queryFn: () => websiteApi.getTodayMenu(),
  });

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
  const combinedOffers = React.useMemo(() => {
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

  return (
    <div className="min-h-screen bg-brand-cream dark:bg-zinc-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header & Prominent ₹99 Title Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 text-amber-600 dark:text-amber-400 text-xs font-extrabold uppercase tracking-widest shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>Madurai Food Corner Special</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold font-serif text-brand-maroon dark:text-white leading-tight">
            🎉 Limited Period Special Deals
          </h1>


        </div>

        {/* Offers Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-72 bg-zinc-200 dark:bg-zinc-800 rounded-3xl animate-pulse" />
            <div className="h-72 bg-zinc-200 dark:bg-zinc-800 rounded-3xl animate-pulse" />
          </div>
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : combinedOffers.length === 0 ? (
          <EmptyState
            title="No Active Offers Currently"
            description="There are no active promotional offers at this exact moment. Check back soon for new festival specials!"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {combinedOffers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
