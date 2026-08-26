import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, Download, CreditCard, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { websiteApi } from '../services/api';
import { Order } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Loader } from '../components/common/Loader';
import { generateReceiptPdf } from '../utils/generateReceiptPdf';

export const OrderSuccess: React.FC = () => {
  const { orderNumber: pathOrderNum } = useParams<{ orderNumber: string }>();
  const [searchParams] = useSearchParams();

  // Load cached order from sessionStorage immediately for instant render
  const [order, setOrder] = useState<Order | null>(() => {
    try {
      const cached = sessionStorage.getItem('mfc_last_order');
      return cached ? (JSON.parse(cached) as Order) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false);

  const paymentStatusParam = searchParams.get('payment_status') || searchParams.get('status');
  const cfOrderIdParam = searchParams.get('order_id');
  const queryOrderNum = searchParams.get('order_number');

  const orderNumber = pathOrderNum || queryOrderNum || cfOrderIdParam || order?.order_number || order?.id || '';

  useEffect(() => {
    if (!orderNumber) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    websiteApi
      .trackOrder(orderNumber)
      .then(async (data) => {
        if (!isMounted) return;
        if (data) {
          setOrder(data);
          try {
            sessionStorage.setItem('mfc_last_order', JSON.stringify(data));
          } catch (_) { }
        }

        // If Cashfree redirected back with payment indicator, verify payment with server
        if (paymentStatusParam || cfOrderIdParam) {
          try {
            const verifyRes = await websiteApi.verifyPayment(orderNumber);
            if (verifyRes && verifyRes.paid) {
              const refreshedOrder = await websiteApi.trackOrder(orderNumber);
              if (isMounted && refreshedOrder) {
                setOrder(refreshedOrder);
                try {
                  sessionStorage.setItem('mfc_last_order', JSON.stringify(refreshedOrder));
                } catch (_) { }
              }
            }
          } catch (err) {
            console.warn('Payment auto-verification notice:', err);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not fetch server order details, using local cache:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [orderNumber, paymentStatusParam, cfOrderIdParam]);

  const isPaid =
    order?.payment_status?.toLowerCase() === 'paid' ||
    order?.payment_status?.toLowerCase() === 'success' ||
    paymentStatusParam === 'SUCCESS' ||
    paymentStatusParam === 'paid' ||
    paymentStatusParam === 'success';

  const hasAutoDownloadedRef = React.useRef<boolean>(false);

  // Single handler to generate and download receipt PDF
  const handleDownloadBill = useCallback(async (trigger?: boolean | React.MouseEvent) => {
    if (isPdfLoading) return;
    setIsPdfLoading(true);

    const isAuto = typeof trigger === 'boolean' ? trigger : false;

    try {
      const orderToPrint: Order = order ? order : {
        id: orderNumber || 'MFC-ORDER',
        order_number: orderNumber || 'MFC-ORDER',
        required_date: new Date().toISOString(),
        order_type: 'Parcel',
        payment_method: 'Online',
        payment_status: isPaid ? 'Paid' : 'Pending',
        status: 'Confirmed',
        total_amount: 0,
        subtotal: 0,
        order_items: [],
        created_at: new Date().toISOString(),
      };

      generateReceiptPdf(orderToPrint, isPaid);
      if (isAuto) {
        toast.success('Your order bill PDF has been downloaded automatically!', { id: 'auto-pdf-toast' });
      } else {
        toast.success('Bill PDF downloaded successfully!');
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      if (!isAuto) {
        toast.error('Failed to generate PDF. Please try again.');
      }
    } finally {
      setIsPdfLoading(false);
    }
  }, [order, orderNumber, isPaid, isPdfLoading]);

  // Auto-download PDF once when order details are ready
  useEffect(() => {
    if (!order || hasAutoDownloadedRef.current) return;

    const safeNum = order.order_number || order.id || orderNumber;
    if (!safeNum) return;

    const sessionKey = `mfc_autodownloaded_${safeNum}`;
    if (sessionStorage.getItem(sessionKey)) {
      hasAutoDownloadedRef.current = true;
      return;
    }

    // Short delay for smooth page render before triggering download
    const timer = setTimeout(() => {
      hasAutoDownloadedRef.current = true;
      try { sessionStorage.setItem(sessionKey, 'true'); } catch (_) { }
      handleDownloadBill(true);
    }, 700);

    return () => clearTimeout(timer);
  }, [order, orderNumber, handleDownloadBill]);

  if (isLoading && !order) {
    return <Loader fullScreen message="Confirming your order details with kitchen..." />;
  }

  const displayOrderNum = order?.order_number || orderNumber || 'MFC-ORDER';

  return (
    <div className="min-h-screen bg-brand-cream dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">

        {/* ─── Success Header Card ─── */}
        <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-amber-500/20 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto ring-8 ring-emerald-500/5">
            <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-brand-maroon dark:text-white">
              Order Placed Successfully!
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto">
              Thank you for dining with Madurai Food Corner. Your order has been sent to our kitchen team.
            </p>
          </div>

          {/* Order Number & Payment Status */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-brand-maroon dark:text-amber-400 font-mono text-sm sm:text-base font-extrabold">
              Order #: {displayOrderNum}
            </div>

            {isPaid ? (
              <span className="px-3.5 py-2 rounded-2xl text-xs font-extrabold bg-emerald-500 text-white flex items-center space-x-1.5 shadow-sm">
                <CreditCard className="w-3.5 h-3.5" />
                <span>PAID</span>
              </span>
            ) : (
              <span className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-amber-500 text-brand-maroon">
                {order?.payment_status || 'Pending'}
              </span>
            )}
          </div>

          {/* Single Download Bill Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleDownloadBill}
              disabled={isPdfLoading}
              className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-2xl bg-brand-maroon hover:bg-red-950 dark:bg-amber-600 dark:hover:bg-amber-500 text-white text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 disabled:opacity-70 cursor-pointer"
            >
              {isPdfLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              ) : (
                <Download className="w-4 h-4 text-amber-400" />
              )}
              <span>{isPdfLoading ? 'Generating PDF...' : 'Download Bill (PDF)'}</span>
            </button>
            <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500">
              Bill is auto-downloaded on page load
            </p>
          </div>
        </div>

        {/* ─── Receipt Details Card ─── */}
        {order && (
          <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div>
                <p className="text-xs text-zinc-400">Order Date</p>
                <p className="text-sm font-bold text-brand-maroon dark:text-amber-400">
                  {formatDate(order.created_at || order.required_date)}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-brand-maroon">
                  {order.status || 'Accepted'}
                </span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
              <div>
                <p className="text-zinc-400 font-semibold mb-0.5">Customer</p>
                <p className="font-bold text-zinc-800 dark:text-zinc-200">
                  {order.customers?.name || (order as any).customer_name || 'Valued Customer'}
                </p>
                <p className="text-zinc-500">
                  {order.customers?.phone || (order as any).customer_phone || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-zinc-400 font-semibold mb-0.5">Order Type & Payment</p>
                <p className="font-bold text-zinc-800 dark:text-zinc-200">{order.order_type || 'Parcel'}</p>
                <p className="text-zinc-500">
                  {order.payment_method || 'Online'} {isPaid ? '(Paid)' : ''}
                </p>
              </div>
            </div>

            {/* Special Instructions Note (if present) */}
            {order.special_instruction && (
              <div className="text-xs bg-amber-50/50 dark:bg-zinc-800/80 border border-amber-500/20 p-3.5 rounded-xl">
                <span className="font-bold text-amber-700 dark:text-amber-400">Special Note: </span>
                <span className="text-zinc-600 dark:text-zinc-300">{order.special_instruction}</span>
              </div>
            )}

            {/* Items Summary */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-3">
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                ITEMS PURCHASED:
              </p>

              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {order.order_items && order.order_items.length > 0 ? (
                  order.order_items.map((item, idx) => {
                    const itemName =
                      item.food_items?.name ||
                      item.combos?.name ||
                      item.special_offers?.title ||
                      (item as any).name ||
                      `Food Item ${idx + 1}`;
                    const lineTotal = item.line_total ?? (item.unit_price || 0) * (item.quantity || 1);

                    return (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs gap-3">
                        <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                          {item.quantity}x {itemName}
                        </span>
                        <span className="font-bold text-brand-maroon dark:text-amber-400 shrink-0">
                          {formatCurrency(lineTotal)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-zinc-500 py-2">Order items saved in system</p>
                )}
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 space-y-2 text-xs">
              {Number(order.discount_amount || 0) > 0 && (
                <>
                  <div className="flex justify-between text-zinc-500">
                    <span>Subtotal</span>
                    <span>{formatCurrency(order.subtotal || order.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>
                      Discount {Number(order.discount_percentage || 0) > 0 ? `(${order.discount_percentage}%)` : ''}
                    </span>
                    <span>- {formatCurrency(order.discount_amount || 0)}</span>
                  </div>
                </>
              )}

              {/* Grand Total */}
              <div className="flex justify-between items-center text-lg font-extrabold text-brand-maroon dark:text-brand-gold pt-3 border-t border-zinc-200 dark:border-zinc-700">
                <span>Total Paid / Due</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── Footer Action ─── */}
        <div className="flex justify-center pt-2">
          <Link
            to="/menu"
            className="px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-brand-maroon font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-lg transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Order More Dishes</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
