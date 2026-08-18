import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, Download, CreditCard } from 'lucide-react';
import { websiteApi } from '../services/api';
import { Order } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Loader } from '../components/common/Loader';
import { generateReceiptPdf } from '../utils/generateReceiptPdf';

export const OrderSuccess: React.FC = () => {
  const { orderNumber: pathOrderNum } = useParams<{ orderNumber: string }>();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const paymentStatusParam = searchParams.get('payment_status');
  const cfOrderIdParam = searchParams.get('order_id');
  const queryOrderNum = searchParams.get('order_number');

  const orderNumber = pathOrderNum || queryOrderNum || cfOrderIdParam;

  useEffect(() => {
    if (orderNumber) {
      setIsLoading(true);
      websiteApi
        .trackOrder(orderNumber)
        .then(async (data) => {
          setOrder(data);
          // If Cashfree redirected back with payment status info, trigger payment verification
          if (paymentStatusParam || cfOrderIdParam) {
            try {
              const verifyRes = await websiteApi.verifyPayment(orderNumber);
              if (verifyRes && verifyRes.paid) {
                // Re-fetch updated order status from backend
                const refreshedOrder = await websiteApi.trackOrder(orderNumber);
                setOrder(refreshedOrder);
              }
            } catch (err) {
              console.warn('Payment status auto-verification failed:', err);
            }
          }
        })
        .catch((err) => console.error('Failed to track order:', err))
        .finally(() => setIsLoading(false));
    }
  }, [orderNumber, paymentStatusParam, cfOrderIdParam]);

  if (isLoading) return <Loader fullScreen message="Confirming your order with kitchen..." />;

  const isPaid = order?.payment_status?.toLowerCase() === 'paid' || paymentStatusParam === 'SUCCESS' || paymentStatusParam === 'PAID';

  return (
    <div className="min-h-screen bg-brand-cream dark:bg-zinc-950 py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Celebration Header */}
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-amber-500/20 shadow-2xl text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <h1 className="text-3xl font-extrabold font-serif text-brand-maroon dark:text-white">
            Order Placed Successfully!
          </h1>
          <p className="text-xs text-zinc-500">
            Thank you for dining with Madurai Food Corner. Your order has been sent to our kitchen team.
          </p>

          <div className="inline-flex items-center space-x-3">
            <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-brand-maroon dark:text-amber-400 font-mono text-base font-extrabold">
              Order #: {order?.order_number || orderNumber}
            </div>

            {isPaid ? (
              <span className="px-3 py-1.5 rounded-2xl text-xs font-extrabold bg-emerald-500 text-white flex items-center space-x-1">
                <CreditCard className="w-3.5 h-3.5" />
                <span>PAID (Cashfree)</span>
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-2xl text-xs font-bold bg-amber-500 text-brand-maroon">
                {order?.payment_status || 'Pending'}
              </span>
            )}
          </div>
        </div>

        {/* Receipt Details Card */}
        {order && (
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div>
                <p className="text-xs text-zinc-400">Order Date</p>
                <p className="text-sm font-bold text-brand-maroon dark:text-amber-400">
                  {formatDate(order.created_at || order.required_date)}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-zinc-400">Order Status</p>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-brand-maroon">
                  {order.status}
                </span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-zinc-400 font-semibold">Customer</p>
                <p className="font-bold text-zinc-800 dark:text-zinc-200">{order.customers?.name || 'Valued Customer'}</p>
                <p className="text-zinc-500">{order.customers?.phone}</p>
              </div>
              <div>
                <p className="text-zinc-400 font-semibold">Order Type & Payment</p>
                <p className="font-bold text-zinc-800 dark:text-zinc-200">{order.order_type}</p>
                <p className="text-zinc-500">{order.payment_method || 'Online'} ({isPaid ? 'PAID' : 'Pending'})</p>
              </div>
            </div>

            {/* Items Summary */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-2">
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                Items Purchased:
              </p>
              <div className="space-y-2">
                {order.order_items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                      {item.quantity}x {item.food_items?.name || item.combos?.name || item.special_offers?.title || 'Food Item'}
                    </span>
                    <span className="font-bold text-brand-maroon dark:text-amber-400">
                      {formatCurrency(item.line_total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Grand Total */}
            <div className="flex justify-between items-center text-lg font-extrabold text-brand-maroon dark:text-brand-gold pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <span>Total Paid / Due</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {order && (
            <button
              type="button"
              onClick={() => generateReceiptPdf(order)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-brand-maroon hover:bg-red-950 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg transition-all"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Download Receipt (PDF)</span>
            </button>
          )}

          <Link
            to="/menu"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-brand-maroon font-bold text-xs flex items-center justify-center space-x-2 shadow-lg transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Order More Dishes</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
