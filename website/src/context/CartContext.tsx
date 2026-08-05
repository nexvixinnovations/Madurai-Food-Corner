import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartItem, DiscountPreview, RestaurantSettings } from '../types';
import toast from 'react-hot-toast';

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeItem: (id: string, type: 'food' | 'combo' | 'offer') => void;
  updateQuantity: (id: string, type: 'food' | 'combo' | 'offer', quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalItems: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  /** Discount preview — requires settings to be provided via setDiscountSettings */
  discountPreview: DiscountPreview | null;
  /** Call this with loaded settings to enable discount calculation */
  setDiscountSettings: (settings: RestaurantSettings | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/**
 * Compute discount breakdown based on current cart items and restaurant settings.
 * RULES:
 *   - Only food + combo items (is_special_offer = false/undefined) are eligible
 *   - Special offer items are excluded from both threshold and discount
 *   - Threshold check: eligibleSubtotal >= tier1_min_amount
 *   - Discount: eligibleSubtotal × tier1_percentage / 100
 */
function computeDiscountPreview(items: CartItem[], settings: RestaurantSettings | null): DiscountPreview {
  const round2 = (v: number) => Math.round(v * 100) / 100;

  const offerItems = items.filter((i) => i.type === 'offer' || Boolean(i.is_special_offer));
  const eligibleItems = items.filter((i) => i.type !== 'offer' && !i.is_special_offer);

  const eligibleSubtotal = round2(eligibleItems.reduce((sum, i) => sum + Number(i.unit_price) * i.quantity, 0));
  const specialOfferSubtotal = round2(offerItems.reduce((sum, i) => sum + Number(i.unit_price) * i.quantity, 0));

  const discountEnabled = Boolean(settings?.order_discount_enabled);
  const minAmount = Number(settings?.tier1_min_amount || 0);
  const pct = Number(settings?.tier1_percentage || 0);

  let discountPercent = 0;
  if (discountEnabled && pct > 0 && minAmount > 0 && eligibleSubtotal >= minAmount) {
    discountPercent = pct;
  }

  const discountAmount = round2((eligibleSubtotal * discountPercent) / 100);
  const grandTotal = round2(Math.max(0, eligibleSubtotal - discountAmount) + specialOfferSubtotal);

  const amountToUnlock =
    discountEnabled && minAmount > 0 && eligibleSubtotal < minAmount
      ? round2(minAmount - eligibleSubtotal)
      : 0;

  return {
    eligibleSubtotal,
    specialOfferSubtotal,
    discountPercent,
    discountAmount,
    grandTotal,
    isDiscountEnabled: discountEnabled,
    minimumAmount: minAmount,
    amountToUnlock,
  };
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('mfc_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [discountSettings, setDiscountSettingsState] = useState<RestaurantSettings | null>(null);

  useEffect(() => {
    localStorage.setItem('mfc_cart', JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<CartItem, 'quantity'>, qty: number = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === item.id && i.type === item.type);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += qty;
        return updated;
      }
      return [...prev, { ...item, quantity: qty }];
    });
    toast.success(`Added "${item.name}" to your cart!`, {
      icon: '🛒',
      style: {
        borderRadius: '10px',
        background: '#3B1B10',
        color: '#D4AF37',
      },
    });
  };

  const removeItem = (id: string, type: 'food' | 'combo' | 'offer') => {
    setItems((prev) => prev.filter((i) => !(i.id === id && i.type === type)));
    toast.error('Item removed from cart');
  };

  const updateQuantity = (id: string, type: 'food' | 'combo' | 'offer', quantity: number) => {
    if (quantity <= 0) {
      removeItem(id, type);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === id && i.type === type ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);

  const setDiscountSettings = (settings: RestaurantSettings | null) => {
    setDiscountSettingsState(settings);
  };

  // Recompute discount preview whenever items or settings change
  const discountPreview = computeDiscountPreview(items, discountSettings);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        totalItems,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        discountPreview,
        setDiscountSettings,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
