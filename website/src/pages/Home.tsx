import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { websiteApi } from '../services/api';
import { FoodItem } from '../types';

import { Hero } from '../components/home/Hero';
import { CurrentOffersSection } from '../components/home/CurrentOffersSection';
import { FeaturedFoods } from '../components/home/FeaturedFoods';
import { WhyChooseUs } from '../components/home/WhyChooseUs';
import { CallToAction } from '../components/home/CallToAction';
import { FoodDetailsModal } from '../components/common/FoodDetailsModal';

export const Home: React.FC = () => {
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  // Fetch Today's Menu
  const { data: foods = [], isLoading: foodsLoading } = useQuery({
    queryKey: ['todayMenu'],
    queryFn: () => websiteApi.getTodayMenu(),
  });

  // Fetch Offers
  const { data: offers = [], isLoading: offersLoading } = useQuery({
    queryKey: ['offers'],
    queryFn: () => websiteApi.getActiveOffers(),
  });

  return (
    <div className="min-h-screen bg-brand-cream dark:bg-zinc-950">
      <Hero />
      <CurrentOffersSection offers={offers} foods={foods} isLoading={offersLoading} />
      <FeaturedFoods foods={foods} isLoading={foodsLoading} onOpenDetails={setSelectedFood} />
      <WhyChooseUs />
      <CallToAction />

      {/* Food Modal */}
      <FoodDetailsModal food={selectedFood} onClose={() => setSelectedFood(null)} />
    </div>
  );
};

