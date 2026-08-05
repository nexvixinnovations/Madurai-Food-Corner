import React from 'react';
import { Package, Check, Plus } from 'lucide-react';
import { Combo } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';

interface ComboCardProps {
  combo: Combo;
}

export const ComboCard: React.FC<ComboCardProps> = ({ combo }) => {
  const { addItem } = useCart();

  const isOffer = combo.offer_enabled && combo.offer_price && Number(combo.offer_price) > 0;
  const activePrice = isOffer ? Number(combo.offer_price) : Number(combo.price);

  const dineInPrice = Number(combo.dine_in_price || combo.price);
  const parcelPrice = Number(combo.parcel_price || combo.price);

  // Extract component food items & their real Cloudinary images
  const componentItems = combo.combo_items || [];
  const validComponentImages = componentItems
    .map((ci) => ({
      name: ci.food_items?.name || '',
      url: ci.food_items?.image_url || null,
    }))
    .filter((ci) => ci.url && ci.url.trim() !== '');

  // Extract included food items text summary
  const itemsList = componentItems.length > 0
    ? componentItems.map((ci) => `${ci.quantity}x ${ci.food_items ? ci.food_items.name : 'Item'}`)
    : [combo.name];

  const includedSummary = itemsList.join(' • ');

  const handleAddCombo = (orderType: 'Dine-In' | 'Parcel' = 'Parcel') => {
    const selectedUnitPrice = isOffer
      ? activePrice
      : orderType === 'Dine-In'
      ? dineInPrice
      : parcelPrice;

    addItem({
      type: 'combo',
      id: combo.id,
      name: `${combo.name} (${orderType})`,
      image_url: validComponentImages[0]?.url || combo.image_url || null,
      price: combo.price,
      unit_price: selectedUnitPrice,
      includedItemsSummary: includedSummary,
    });
  };

  return (
    <div className="group bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-amber-500/20 shadow-lg hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Dynamic Combo Images Display (No fake combo images) */}
        {validComponentImages.length >= 2 ? (
          <div className="relative h-48 sm:h-56 w-full p-2 bg-zinc-950 flex items-center justify-between gap-1.5 overflow-hidden">
            <div className="flex-1 h-full rounded-2xl overflow-hidden relative border border-white/10">
              <img
                src={validComponentImages[0].url!}
                alt={validComponentImages[0].name}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/75 backdrop-blur-xs px-2 py-1 rounded-lg text-[10px] font-bold text-white truncate">
                {validComponentImages[0].name}
              </div>
            </div>

            {/* Visual '+' Badge Between Component Images */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-brand-maroon font-black flex items-center justify-center z-10 shadow-xl text-lg shrink-0 border-2 border-zinc-900">
              +
            </div>

            <div className="flex-1 h-full rounded-2xl overflow-hidden relative border border-white/10">
              <img
                src={validComponentImages[1].url!}
                alt={validComponentImages[1].name}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/75 backdrop-blur-xs px-2 py-1 rounded-lg text-[10px] font-bold text-white truncate">
                {validComponentImages[1].name}
              </div>
            </div>

            <div className="absolute top-3 left-3 z-20">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 text-brand-maroon flex items-center space-x-1 shadow-md">
                <Package className="w-3 h-3" />
                <span>Combo Deal</span>
              </span>
            </div>
          </div>
        ) : validComponentImages.length === 1 ? (
          <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-zinc-900">
            <img
              src={validComponentImages[0].url!}
              alt={combo.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute top-3 left-3">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 text-brand-maroon flex items-center space-x-1 shadow-md">
                <Package className="w-3 h-3" />
                <span>Combo Deal</span>
              </span>
            </div>
          </div>
        ) : combo.image_url ? (
          <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-zinc-900">
            <img
              src={combo.image_url}
              alt={combo.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>
        ) : (
          /* Clean Header for Combos Without Images (No Broken Icons) */
          <div className="p-5 bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 border-b border-amber-500/10">
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500 text-brand-maroon mb-2">
              <Package className="w-3 h-3" />
              <span>Combo Package</span>
            </span>
            <h3 className="text-xl font-bold font-serif text-brand-maroon dark:text-white leading-tight">
              {combo.name}
            </h3>
          </div>
        )}

        {/* Included Items Checklist */}
        <div className="p-5 sm:p-6 space-y-4">
          <h3 className="text-lg sm:text-xl font-bold font-serif text-brand-maroon dark:text-white leading-tight">
            {combo.name}
          </h3>

          <div className="space-y-2">
            <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
              Included Items:
            </p>
            <ul className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
              {itemsList.map((item, idx) => (
                <li key={idx} className="flex items-center space-x-2">
                  <span className="p-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Pricing & Add to Cart */}
      <div className="p-5 sm:p-6 pt-0 border-t border-zinc-100 dark:border-zinc-800/80 mt-4 space-y-3">
        {isOffer ? (
          <div className="flex items-baseline space-x-3">
            <span className="text-sm text-zinc-400 line-through font-semibold">
              {formatCurrency(combo.price)}
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(combo.offer_price!)}
            </span>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded">
              OFFER PRICE
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
              <span className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Dine-In</span>
              <span className="text-base font-black text-brand-maroon dark:text-brand-gold">
                {formatCurrency(dineInPrice)}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-center">
              <span className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Parcel</span>
              <span className="text-base font-black text-brand-maroon dark:text-brand-gold">
                {formatCurrency(parcelPrice)}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => handleAddCombo('Dine-In')}
            className="flex-1 py-3 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-brand-maroon font-bold text-xs flex items-center justify-center space-x-1 shadow-md hover:scale-[1.02] transition-all min-h-[44px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Dine-In</span>
          </button>
          <button
            onClick={() => handleAddCombo('Parcel')}
            className="flex-1 py-3 px-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-md hover:scale-[1.02] transition-all min-h-[44px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Parcel</span>
          </button>
        </div>
      </div>
    </div>
  );
};
