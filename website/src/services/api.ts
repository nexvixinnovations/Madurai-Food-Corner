import axios from 'axios';
import { ApiResponse, FoodItem, Combo, Offer, Order, RestaurantSettings } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/website';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

/**
 * Customer Website API Services
 */
export const websiteApi = {
  // Get Today's Scheduled Menu
  getTodayMenu: async (params?: { search?: string; category?: string }): Promise<FoodItem[]> => {
    const res = await apiClient.get<ApiResponse<any[]>>('/menu', { params });
    const rawData = res.data.data || [];
    return rawData.map((item: any) => {
      if (item.food_items) {
        return {
          ...item.food_items,
          display_order: item.display_order ?? item.food_items.display_order,
          available: item.available ?? item.food_items.available,
        };
      }
      return item;
    });
  },

  // Get Available Combos
  getCombos: async (): Promise<Combo[]> => {
    const res = await apiClient.get<ApiResponse<Combo[]>>('/combos');
    return res.data.data;
  },

  // Get Active Offers
  getActiveOffers: async (): Promise<Offer[]> => {
    const res = await apiClient.get<ApiResponse<Offer[]>>('/offers');
    return res.data.data;
  },

  // Place Customer Order
  placeOrder: async (orderPayload: any): Promise<Order> => {
    const res = await apiClient.post<ApiResponse<Order>>('/orders', orderPayload);
    return res.data.data;
  },

  // Track Order Status
  trackOrder: async (orderNumber: string): Promise<Order> => {
    const res = await apiClient.get<ApiResponse<Order>>(`/orders/track/${encodeURIComponent(orderNumber)}`);
    return res.data.data;
  },

  // Get Restaurant Information & Business Timings
  getRestaurantInfo: async (): Promise<RestaurantSettings> => {
    const res = await apiClient.get<ApiResponse<RestaurantSettings>>('/restaurant-info');
    return res.data.data;
  },

  // Get Public Ordering Calendar Closed Dates
  getOrderingCalendar: async (): Promise<{ closed_dates: string[] }> => {
    const res = await apiClient.get<ApiResponse<{ closed_dates: string[] }>>('/ordering-calendar');
    return res.data.data;
  },

  // Get Ordering Window Status & Banner Info
  getOrderingStatus: async (date?: string): Promise<any> => {
    const res = await apiClient.get<ApiResponse<any>>('/ordering-status', { params: { date } });
    return res.data.data;
  },

  // Create Cashfree Payment Session
  createCashfreeSession: async (payload: {
    order_id?: string;
    order_number?: string;
    amount?: number;
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    return_url?: string;
  }): Promise<{ payment_session_id: string; order_id: string }> => {
    const res = await apiClient.post<ApiResponse<{ payment_session_id: string; order_id: string }>>(
      '/payments/create-session',
      payload
    );
    return res.data.data;
  },

  // Verify Cashfree Payment Status
  verifyPayment: async (orderId: string): Promise<any> => {
    const res = await apiClient.post<ApiResponse<any>>('/payments/verify', { order_id: orderId });
    return res.data.data;
  },
};
