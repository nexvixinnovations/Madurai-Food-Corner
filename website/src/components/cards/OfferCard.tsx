import React from 'react';
import { Tag, Calendar, ShoppingBag } from 'lucide-react';
import { Offer } from '../../types';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';

interface ComponentImage {
  name: string;
  url: string;
}

export interface EnhancedOffer extends Offer {
  componentImages?: ComponentImage[];
  isComboOffer?: boolean;
}

interface OfferCardProps {
  offer: EnhancedOffer;
}

export const OfferCard: React.FC<OfferCardProps> = ({ offer }) => {
  const { addItem } = useCart();

  const isPriceOffer = offer.offer_price && offer.price;
  const activePrice = offer.offer_price ? Number(offer.offer_price) : Number(offer.price || 0);

  const componentImages = offer.componentImages || [];

  const handleAddToCart = () => {
    addItem({
      // IMPORTANT: type must be 'offer' and is_special_offer must be true
      // so that the cart discount calculation excludes this item from:
      //   1. The eligible subtotal threshold check
      //   2. The percentage discount application
      type: 'offer',
      id: offer.id,
      name: offer.title,
      image_url: componentImages[0]?.url || offer.image_url || null,
      price: Number(offer.price || activePrice),
      unit_price: activePrice,
      is_special_offer: true,
    });
  };

  return (
    <div className="group bg-zinc-900 text-white rounded-3xl overflow-hidden border border-amber-500/30 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col justify-between">
      {/* Dynamic Combo-Style Component Images Header */}
      {componentImages.length >= 2 ? (
        <div className="relative h-48 sm:h-56 w-full p-2 bg-zinc-950 flex items-center justify-between gap-1.5 overflow-hidden">
          <div className="flex-1 h-full rounded-2xl overflow-hidden relative border border-white/10">
            <img
              src={componentImages[0].url}
              alt={componentImages[0].name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
            />
            <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/80 backdrop-blur-xs px-2 py-1 rounded-lg text-[10px] font-bold text-amber-400 truncate">
              {componentImages[0].name}
            </div>
          </div>

          {/* Visual '+' Badge Between Component Images */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-brand-maroon font-black flex items-center justify-center z-10 shadow-xl text-lg shrink-0 border-2 border-zinc-900">
            +
          </div>

          <div className="flex-1 h-full rounded-2xl overflow-hidden relative border border-white/10">
            <img
              src={componentImages[1].url}
              alt={componentImages[1].name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
            />
            <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/80 backdrop-blur-xs px-2 py-1 rounded-lg text-[10px] font-bold text-amber-400 truncate">
              {componentImages[1].name}
            </div>
          </div>

          <div className="absolute top-3 left-3 z-20">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 text-brand-maroon flex items-center space-x-1 shadow-md">
              <Tag className="w-3 h-3" />
              <span>₹99 Special Offer</span>
            </span>
          </div>
        </div>
      ) : componentImages.length === 1 || offer.image_url ? (
        <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-zinc-950">
          <img
            src={componentImages[0]?.url || offer.image_url || '/logo.png'}
            alt={offer.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/logo.png';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
          <div className="absolute top-3 left-3 z-10">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-500 text-brand-maroon flex items-center space-x-1 shadow-md">
              <Tag className="w-3 h-3" />
              <span>Special Offer</span>
            </span>
          </div>
        </div>
      ) : (
        <div className="relative p-6 bg-gradient-to-r from-brand-maroon to-zinc-900 border-b border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-brand-maroon flex items-center space-x-1 shadow-md">
              <Tag className="w-3.5 h-3.5" />
              <span>₹99 Special Deal</span>
            </span>
            {offer.end_date && (
              <span className="text-[11px] text-amber-200 flex items-center space-x-1 font-medium">
                <Calendar className="w-3 h-3 text-amber-400" />
                <span>Valid till {formatDate(offer.end_date)}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Offer Content Info */}
      <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold font-serif text-amber-400 leading-snug">
            {offer.title}
          </h3>
          {offer.description && (
            <p className="text-xs text-zinc-300 line-clamp-2 mt-2 leading-relaxed">
              {offer.description}
            </p>
          )}
        </div>

        {/* Price & Add to Cart Button */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <div>
            {isPriceOffer && (
              <span className="text-xs text-zinc-400 line-through mr-2">
                {formatCurrency(offer.price)}
              </span>
            )}
            <span className="text-2xl font-black text-amber-400">
              {formatCurrency(activePrice)}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            className="py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-brand-maroon font-bold text-xs flex items-center space-x-1.5 shadow-md hover:scale-[1.02] transition-all min-h-[48px]"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add Offer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
