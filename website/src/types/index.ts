export interface FoodItem {
  id: string;
  name: string;
  category: string;
  food_type: 'Veg' | 'Non-Veg' | 'Eggetarian' | string;
  image_url?: string | null;
  price: number;
  offer_enabled?: boolean;
  offer_price?: number | null;
  available?: boolean;
  display_order?: number;
  preparation_time?: number; // in minutes
  description?: string;
  created_at?: string;
}

export interface ComboItemRelation {
  id: string;
  combo_id: string;
  food_item_id: string;
  quantity: number;
  food_items?: FoodItem;
}

export interface Combo {
  id: string;
  name: string;
  image_url?: string | null;
  price: number;
  dine_in_price?: number | null;
  parcel_price?: number | null;
  offer_enabled?: boolean;
  offer_price?: number | null;
  available?: boolean;
  created_at?: string;
  combo_items?: ComboItemRelation[];
}

export interface SpecialOfferItemRelation {
  id?: string;
  special_offer_id?: string;
  food_item_id?: string;
  quantity: number;
  food_items?: FoodItem;
}

export interface Offer {
  id: string;
  tag_name?: string | null;
  title: string;
  description?: string | null;
  image_url?: string | null;
  price?: number | null;
  offer_enabled?: boolean;
  offer_price?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  available?: boolean;
  special_offer_items?: SpecialOfferItemRelation[];
}

export interface CartItem {
  type: 'food' | 'combo' | 'offer';
  id: string;
  name: string;
  image_url?: string | null;
  food_type?: 'Veg' | 'Non-Veg' | string;
  price: number;
  unit_price: number;
  quantity: number;
  preparation_time?: number;
  includedItemsSummary?: string;
  /** True if this item is a Special Offer (₹99 SPECIAL etc.) — excluded from percentage discount */
  is_special_offer?: boolean;
}

export interface Customer {
  id?: string;
  name: string;
  phone: string;
  email?: string | null;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  food_item_id?: string | null;
  combo_id?: string | null;
  special_offer_id?: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  food_items?: FoodItem | null;
  combos?: Combo | null;
  special_offers?: Offer | null;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  order_source?: string;
  required_date: string;
  required_time?: string | null;
  order_type: 'Parcel' | 'Dine-In' | 'Take Away' | 'Delivery' | string;
  payment_method?: string;
  payment_status?: string;
  status: 'Pending' | 'Accepted' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled' | string;
  subtotal?: number;
  eligible_subtotal?: number;
  special_offer_subtotal?: number;
  discount_percentage?: number;
  discount_amount?: number;
  total_amount: number;
  special_instruction?: string | null;
  created_at?: string;
  customers?: Customer | null;
  order_items?: OrderItem[];
}

export interface RestaurantSettings {
  id?: string;
  restaurant_name: string;
  logo_url?: string | null;
  banner_url?: string | null;
  phone_number: string;
  alternate_phone?: string | null;
  email?: string | null;
  website?: string | null;
  gst_number?: string | null;
  fssai_number?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  opening_time?: string | null;
  closing_time?: string | null;
  currency: string;
  currency_symbol: string;
  delivery_charge: number;
  free_delivery_minimum_amount: number;
  packing_charge: number;
  minimum_order_amount: number;
  enable_online_ordering: boolean;
  enable_delivery: boolean;
  enable_takeaway: boolean;
  enable_dinein: boolean;
  maintenance_mode: boolean;
  disabled_dates?: string | string[];
  date_wise_ordering_enabled?: boolean;
  // ─── Order Value Percentage Discount ───
  order_discount_enabled?: boolean;
  /** Minimum eligible subtotal (food + combo only) to qualify for the discount */
  tier1_min_amount?: number | null;
  /** Discount percentage applied to the eligible subtotal */
  tier1_percentage?: number | null;
  // ─── Ordering Window ───
  ordering_schedule_enabled?: boolean;
  ordering_start_time?: string | null;
  ordering_end_time?: string | null;
  ordering_time_scope?: string | null;
  ordering_target_date?: string | null;
  tax_percentage: number;
  invoice_prefix?: string;
  order_prefix?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: any;
}

/** Discount preview computed from cart contents + backend settings */
export interface DiscountPreview {
  eligibleSubtotal: number;
  specialOfferSubtotal: number;
  discountPercent: number;
  discountAmount: number;
  grandTotal: number;
  isDiscountEnabled: boolean;
  minimumAmount: number;
  amountToUnlock: number; // > 0 means not yet qualified
}

