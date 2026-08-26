import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, ShoppingBag, Download, CreditCard, Loader2, RotateCcw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { websiteApi } from '../services/api';
import { Order } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Loader } from '../components/common/Loader';
import { generateReceiptPdf } from '../utils/generateReceiptPdf';

type PaymentOutcome = 'VERIFYING' | 'PAID' | 'FAILED' | 'PENDING';

export const OrderSuccess: React.FC = () => {
  const { orderNumber: pathOrderNum } = useParams<{ orderNumber: string }>();
  const [searchParams] = useSearchParams();

  // Load cached order from sessionStorage for initial layout if available
  const [order, setOrder] = useState<Order | null>(() => {
    try {
      const cached = sessionStorage.getItem('mfc_last_order');
      return cached ? (JSON.parse(cached) as Order) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false);
  const [paymentOutcome, setPaymentOutcome] = useState<PaymentOutcome>('VERIFYING');

  const cfOrderIdParam = searchParams.get('order_id');
  const queryOrderNum = searchParams.get('order_number');
  const orderNumber = pathOrderNum || queryOrderNum || cfOrderIdParam || order?.order_number || order?.id || '';

  const hasAutoDownloadedRef = useRef<boolean>(false);

  // Authoritative server-side payment verification
  const verifyPaymentStatus = useCallback(async (targetNum: string) => {
    if (!targetNum) return;
    setIsVerifying(true);

    try {
      // 1. Ask backend to query Cashfree's real PG Order Status API
      const verifyRes = await websiteApi.verifyPayment(targetNum);

      if (verifyRes && verifyRes.paid === true && verifyRes.status === 'PAID') {
        setPaymentOutcome('PAID');
      } else if (
        verifyRes &&
        (verifyRes.status === 'FAILED' ||
          verifyRes.status === 'CANCELLED' ||
          verifyRes.status === 'EXPIRED' ||
          verifyRes.status === 'USER_DROPPED')
      ) {
        setPaymentOutcome('FAILED');
      } else {
        setPaymentOutcome('PENDING');
      }

      // 2. Fetch fresh updated order record from database
      const refreshedOrder = await websiteApi.trackOrder(targetNum);
      if (refreshedOrder) {
        setOrder(refreshedOrder);
        try {
          sessionStorage.setItem('mfc_last_order', JSON.stringify(refreshedOrder));
        } catch (_) {}

        // Fallback check against DB record if Cashfree verification didn't return outcome
        const dbPayStatus = refreshedOrder.payment_status?.toLowerCase();
        if (dbPayStatus === 'paid' || dbPayStatus === 'success') {
          setPaymentOutcome('PAID');
        } else if (dbPayStatus === 'failed' || dbPayStatus === 'cancelled') {
          setPaymentOutcome('FAILED');
        }
      }
    } catch (err) {
      console.warn('Payment verification notice:', err);
      // If verification API errors out, check local/DB order payment status
      if (order?.payment_status?.toLowerCase() === 'paid') {
        setPaymentOutcome('PAID');
      } else if (order?.payment_status?.toLowerCase() === 'failed') {
        setPaymentOutcome('FAILED');
      } else {
        setPaymentOutcome('PENDING');
      }
    } finally {
      setIsVerifying(false);
      setIsLoading(false);
    }
  }, [order?.payment_status]);

  useEffect(() => {
    if (!orderNumber) {
      setIsLoading(false);
      setPaymentOutcome('PENDING');
      return;
    }

    let isMounted = true;

    // Track order & verify with Cashfree
    websiteApi
      .trackOrder(orderNumber)
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setOrder(data);
          try {
            sessionStorage.setItem('mfc_last_order', JSON.stringify(data));
          } catch (_) {}
        }
      })
      .catch((err) => {
        console.warn('Could not fetch local cache:', err);
      })
      .finally(() => {
        if (isMounted) {
          verifyPaymentStatus(orderNumber);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [orderNumber, verifyPaymentStatus]);

  const isPaid = paymentOutcome === 'PAID';

  // Handler to generate and download receipt PDF
  const handleDownloadBill = useCallback(
    async (trigger?: boolean | React.MouseEvent) => {
      if (isPdfLoading || !isPaid) return;
      setIsPdfLoading(true);

      const isAuto = typeof trigger === 'boolean' ? trigger : false;

      try {
        const orderToPrint: Order = order
          ? { ...order, payment_status: 'Paid' }
          : {
              id: orderNumber || 'MFC-ORDER',
              order_number: orderNumber || 'MFC-ORDER',
              required_date: new Date().toISOString(),
              order_type: 'Parcel',
              payment_method: 'Online',
              payment_status: 'Paid',
              status: 'Accepted',
              total_amount: 0,
              subtotal: 0,
              order_items: [],
              created_at: new Date().toISOString(),
            };

        generateReceiptPdf(orderToPrint, true);
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
    },
    [order, orderNumber, isPaid, isPdfLoading]
  );

  // Auto-download PDF only when payment outcome is verified as PAID
  useEffect(() => {
    if (!order || paymentOutcome !== 'PAID' || hasAutoDownloadedRef.current) return;

    const safeNum = order.order_number || order.id || orderNumber;
    if (!safeNum) return;

    const sessionKey = `mfc_autodownloaded_${safeNum}`;
    if (sessionStorage.getItem(sessionKey)) {
      hasAutoDownloadedRef.current = true;
      return;
    }

    const timer = setTimeout(() => {
      hasAutoDownloadedRef.current = true;
      try {
        sessionStorage.setItem(sessionKey, 'true');
      } catch (_) {}
      handleDownloadBill(true);
    }, 700);

    return () => clearTimeout(timer);
  }, [order, orderNumber, paymentOutcome, handleDownloadBill]);

  if (isLoading && !order) {
    return <Loader fullScreen message="Verifying your payment status with payment gateway..." />;
  }

  const displayOrderNum = order?.order_number || orderNumber || 'MFC-ORDER';

  return (
    <div className="min-h-screen bg-brand-cream dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
        {/* ─── Outcome Header Card ─── */}
        <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xl text-center space-y-4">
          {/* Status Icon */}
          {paymentOutcome === 'PAID' ? (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto ring-8 ring-emerald-500/5">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
          ) : paymentOutcome === 'FAILED' ? (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto ring-8 ring-red-500/5">
              <XCircle className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto ring-8 ring-amber-500/5">
              <Clock className="w-10 h-10 sm:w-12 sm:h-12 animate-pulse" />
            </div>
          )}

          {/* Status Headings */}
          <div className="space-y-1">
            {paymentOutcome === 'PAID' ? (
              <>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-brand-maroon dark:text-white">
                  Payment & Order Confirmed!
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto">
                  Thank you for dining with Madurai Food Corner. Your payment was verified and sent to the kitchen.
                </p>
              </>
            ) : paymentOutcome === 'FAILED' ? (
              <>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-red-600 dark:text-red-400">
                  Payment Unsuccessful
                </h1>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
                  Your payment could not be verified or was cancelled at the payment gateway. No amount was captured.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-amber-600 dark:text-amber-400">
                  Payment Pending Verification
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto">
                  We are awaiting final confirmation from your bank/UPI gateway. Please wait a moment.
                </p>
              </>
            )}
          </div>

          {/* Order Meta Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-brand-maroon dark:text-amber-400 font-mono text-sm sm:text-base font-extrabold">
              Order #: {displayOrderNum}
            </div>

            {paymentOutcome === 'PAID' ? (
              <span className="px-3.5 py-2 rounded-2xl text-xs font-extrabold bg-emerald-500 text-white flex items-center space-x-1.5 shadow-sm">
                <CreditCard className="w-3.5 h-3.5" />
                <span>PAID (VERIFIED)</span>
              </span>
            ) : paymentOutcome === 'FAILED' ? (
              <span className="px-3.5 py-2 rounded-2xl text-xs font-extrabold bg-red-600 text-white flex items-center space-x-1.5 shadow-sm">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>PAYMENT FAILED</span>
              </span>
            ) : (
              <span className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-amber-500 text-brand-maroon flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>PENDING</span>
              </span>
            )}
          </div>

          {/* Action Buttons based on Payment Outcome */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {paymentOutcome === 'PAID' && (
              <div>
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
                  Bill is auto-downloaded on verified payment
                </p>
              </div>
            )}

            {paymentOutcome === 'FAILED' && (
              <div className="space-y-2">
                <Link
                  to="/checkout"
                  className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retry Payment & Place Order</span>
                </Link>
                <p className="text-[11px] text-zinc-500">
                  You can retry payment with UPI, Card, or Netbanking.
                </p>
              </div>
            )}

            {paymentOutcome === 'PENDING' && (
              <button
                type="button"
                onClick={() => verifyPaymentStatus(orderNumber)}
                disabled={isVerifying}
                className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-brand-maroon text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
              >
                {isVerifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                <span>Check Payment Status Again</span>
              </button>
            )}
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
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    paymentOutcome === 'PAID'
                      ? 'bg-emerald-500 text-white'
                      : paymentOutcome === 'FAILED'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                      : 'bg-amber-500 text-brand-maroon'
                  }`}
                >
                  {paymentOutcome === 'PAID' ? 'Accepted' : paymentOutcome === 'FAILED' ? 'Payment Failed' : 'Pending Payment'}
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
                <p className="text-zinc-400 font-semibold mb-0.5">Order Type & Payment Status</p>
                <p className="font-bold text-zinc-800 dark:text-zinc-200">{order.order_type || 'Parcel'}</p>
                <p className={`font-semibold ${paymentOutcome === 'PAID' ? 'text-emerald-600' : paymentOutcome === 'FAILED' ? 'text-red-600' : 'text-amber-600'}`}>
                  Online ({paymentOutcome === 'PAID' ? 'Paid' : paymentOutcome === 'FAILED' ? 'Failed' : 'Pending'})
                </p>
              </div>
            </div>

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
                <span>Total Amount</span>
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
            <span>{paymentOutcome === 'PAID' ? 'Order More Dishes' : 'Back to Menu'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
