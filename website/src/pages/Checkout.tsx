import React, { useState, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { websiteApi } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { CreditCard, Clock, User, Phone, Mail, CheckCircle2, ShieldCheck, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { RestaurantSettings } from '../types';
import { load } from '@cashfreepayments/cashfree-js';

export const Checkout: React.FC = () => {
  const { items, subtotal, clearCart, discountPreview, setDiscountSettings } = useCart();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [orderType, setOrderType] = useState<'Parcel' | 'Dine-In'>('Parcel');
  const [requiredDate, setRequiredDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod] = useState<'Online'>('Online');
  const [specialInstruction, setSpecialInstruction] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [disabledDates, setDisabledDates] = useState<string[]>([]);
  const [dateWiseEnabled, setDateWiseEnabled] = useState<boolean>(true);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);

  React.useEffect(() => {
    websiteApi.getRestaurantInfo().then((s) => {
      if (s) {
        setSettings(s);
        setDiscountSettings(s);
        if (s.date_wise_ordering_enabled !== undefined) {
          setDateWiseEnabled(s.date_wise_ordering_enabled);
        }
      }
    }).catch(() => {});

    // Fetch single source of truth closed dates from database ordering-calendar API
    websiteApi.getOrderingCalendar().then((calData) => {
      if (calData && Array.isArray(calData.closed_dates)) {
        setDisabledDates(calData.closed_dates);
      }
    }).catch(() => {});
  }, []);

  // Compute Order Value Discount parameters using discountPreview & settings
  const discountSettings = settings;
  const eligibleSubtotal = discountPreview ? discountPreview.eligibleSubtotal : subtotal;
  const discountPercentage = discountPreview && discountPreview.discountAmount > 0
    ? discountPreview.discountPercent
    : Number(settings?.tier1_percentage || 0);
  const discountAmount = discountPreview ? discountPreview.discountAmount : 0;
  const grandTotal = discountPreview ? discountPreview.grandTotal : subtotal;
  const amountToUnlock = discountPreview ? discountPreview.amountToUnlock : 0;

  React.useEffect(() => {
    console.log("Order Discount Settings:", discountSettings);
    console.log("Eligible Subtotal:", eligibleSubtotal);
    console.log("Discount Percentage:", discountPercentage);
    console.log("Discount Amount:", discountAmount);
    console.log("Grand Total:", grandTotal);
  }, [discountSettings, eligibleSubtotal, discountPercentage, discountAmount, grandTotal]);

  if (items.length === 0) {
    navigate('/menu');
    return null;
  }

  // Cutoff time format and calculation (e.g. 2:00 PM / 14:00 cutoff for same-day ordering)
  const cutoffTimeStr = settings?.ordering_start_time || settings?.website_order_window_start || '14:00';

  const formattedCutoffTime = useMemo(() => {
    if (!cutoffTimeStr) return '2:00 PM';
    const parts = cutoffTimeStr.split(':');
    const h = parseInt(parts[0], 10) || 14;
    const m = parseInt(parts[1] || '0', 10);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    const mStr = m < 10 ? `0${m}` : `${m}`;
    return `${h12}:${mStr} ${period}`;
  }, [cutoffTimeStr]);

  // Generate upcoming 14 calendar days starting from today for green/red date picker
  const availableCalendarDays = useMemo(() => {
    const list = [];
    const today = new Date();
    const currentTotalMin = today.getHours() * 60 + today.getMinutes();

    const [cutoffH, cutoffM] = cutoffTimeStr.split(':').map((n: string) => parseInt(n, 10) || 0);
    const cutoffTotalMin = cutoffH * 60 + cutoffM;
    const isPastCutoffToday = currentTotalMin >= cutoffTotalMin;

    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const year = d.getFullYear();
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      const iso = `${year}-${monthStr}-${dayStr}`;
      const dayNum = d.getDate();
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      const isToday = i === 0;

      const isSameDayClosed = isToday && isPastCutoffToday;
      const isClosed = !dateWiseEnabled || disabledDates.includes(iso) || isSameDayClosed;

      list.push({ iso, dayNum, dayName, monthName, isToday, isClosed, isSameDayClosed });
    }
    return list;
  }, [dateWiseEnabled, disabledDates, cutoffTimeStr]);

  // Selected date status check
  const selectedDayObj = useMemo(() => availableCalendarDays.find((d) => d.iso === requiredDate), [availableCalendarDays, requiredDate]);
  const isSelectedDateDisabled = !dateWiseEnabled || disabledDates.includes(requiredDate) || (selectedDayObj ? selectedDayObj.isClosed : false);

  // Ensure default requiredDate is set to the first OPEN (green) date
  React.useEffect(() => {
    if (availableCalendarDays.length > 0) {
      const firstOpen = availableCalendarDays.find((d) => !d.isClosed);
      if (firstOpen) {
        setRequiredDate(firstOpen.iso);
      }
    }
  }, [availableCalendarDays]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error('Please enter your Name and Phone Number');
      return;
    }

    if (customerPhone.trim().length !== 10) {
      toast.error('Please enter a valid 10-digit mobile Phone Number');
      return;
    }

    if (!dateWiseEnabled) {
      toast.error('Online ordering is currently closed by the restaurant management.');
      return;
    }

    const selectedDayObj = availableCalendarDays.find((d) => d.iso === requiredDate);
    if (selectedDayObj && selectedDayObj.isClosed) {
      if (selectedDayObj.isSameDayClosed) {
        toast.error(`Same-day ordering for today closed at ${formattedCutoffTime}. Please choose an upcoming date.`);
      } else {
        toast.error(`Ordering is closed for ${requiredDate}. Please choose an OPEN (GREEN) date.`);
      }
      return;
    }

    try {
      setIsSubmitting(true);

      const orderPayload = {
        customer: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail || undefined,
        },
        required_date: requiredDate,
        order_type: orderType,
        payment_method: paymentMethod,
        special_instruction: specialInstruction || undefined,
        items: items.map((i) => ({
          type: i.type,
          id: i.id,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
      };

      // 1. Place order in ERP Backend
      const newOrder = await websiteApi.placeOrder(orderPayload);
      console.log("Checkout API Response:", newOrder);

      // 2. Obtain Cashfree Payment Session from Backend
      toast.loading('Initiating Cashfree Payment Gateway...', { id: 'payment-loading' });

      let sessionData;
      try {
        const returnUrl = `${window.location.origin}/order-success/${newOrder.order_number}?order_id={order_id}&payment_status={order_status}`;
        sessionData = await websiteApi.createCashfreeSession({
          order_id: newOrder.id,
          order_number: newOrder.order_number,
          amount: newOrder.total_amount || grandTotal,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          return_url: returnUrl,
        });
      } catch (sessionErr: any) {
        toast.dismiss('payment-loading');
        console.warn('Cashfree payment session creation failed:', sessionErr.message);
        toast.error(`Cashfree Payment Error: ${sessionErr.message || 'Unable to initiate Cashfree session'}`);
        // Navigate to order success with pending payment notification
        clearCart();
        navigate(`/order-success/${newOrder.order_number}`);
        return;
      }

      toast.dismiss('payment-loading');

      // 3. Initialize Cashfree JS SDK & launch checkout with full-page redirect
      const isProduction = import.meta.env.VITE_CASHFREE_MODE === 'production';
      const cashfree = await load({ mode: isProduction ? 'production' : 'sandbox' });

      cashfree.checkout({
        paymentSessionId: sessionData.payment_session_id,
        redirectTarget: '_self',
      });

      // Trigger Confetti Celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      clearCart();
    } catch (err: any) {
      toast.dismiss('payment-loading');
      toast.error(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream dark:bg-zinc-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-brand-maroon dark:text-white">
            Order Checkout
          </h1>
          <p className="text-xs text-zinc-500">Provide your details to complete your Madurai Food Corner order.</p>
        </div>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Customer & Order Options */}
          <div className="lg:col-span-7 space-y-6">
            {/* Customer Contact Details */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-lg space-y-4">
              <div className="flex items-center space-x-2 text-brand-maroon dark:text-amber-400 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <User className="w-5 h-5" />
                <h3 className="text-base font-bold font-serif">Customer Information</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      required
                      placeholder="Enter your full name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="tel"
                      required
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={customerPhone}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setCustomerPhone(digitsOnly);
                      }}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-amber-500 font-mono tracking-wider"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Email Address (Optional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="email"
                    placeholder="For order receipt updates"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Order Type & Timing */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-lg space-y-4">
              <div className="flex items-center space-x-2 text-brand-maroon dark:text-amber-400 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <Clock className="w-5 h-5" />
                <h3 className="text-base font-bold font-serif">Order Type & Schedule</h3>
              </div>

              {/* Order Type Pills */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Select Order Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['Parcel', 'Dine-In'] as const).map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setOrderType(type)}
                      className={`py-3 rounded-2xl text-xs font-bold transition-all border ${
                        orderType === type
                          ? 'bg-amber-500 text-brand-maroon border-amber-600 shadow-md scale-[1.02]'
                          : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Select Pickup / Schedule Date *
                  </label>
                  {/* Green & Red Color Legend */}
                  <div className="flex items-center space-x-3 text-[10px] font-bold">
                    <span className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm"></span>
                      <span>🟢 OPEN</span>
                    </span>
                    <span className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow-sm"></span>
                      <span>🔴 CLOSED</span>
                    </span>
                  </div>
                </div>

                {!dateWiseEnabled && (
                  <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center space-x-2">
                    <span>🚫</span>
                    <span>Online ordering is currently CLOSED overall by the restaurant management.</span>
                  </div>
                )}

                {/* Green & Red Calendar Days Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {availableCalendarDays.map((day) => {
                    const isSelected = requiredDate === day.iso;
                    return (
                      <button
                        type="button"
                        key={day.iso}
                        onClick={() => {
                          if (day.isClosed) {
                            if (day.isSameDayClosed) {
                              toast.error(`Same-day ordering for today closed at ${formattedCutoffTime}. Please pick an OPEN (GREEN) date.`);
                            } else {
                              toast.error(`Ordering is CLOSED for ${day.dayName}, ${day.monthName} ${day.dayNum}. Please pick an OPEN (GREEN) date.`);
                            }
                          } else {
                            setRequiredDate(day.iso);
                          }
                        }}
                        className={`p-2.5 rounded-2xl text-center border transition-all flex flex-col items-center justify-center relative ${
                          day.isClosed
                            ? 'bg-red-500/10 dark:bg-red-950/30 border-red-500/40 text-red-600 dark:text-red-400 opacity-75 cursor-not-allowed'
                            : isSelected
                            ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-emerald-600 shadow-lg scale-105 font-extrabold ring-2 ring-emerald-400'
                            : 'bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase opacity-80">{day.dayName}</span>
                        <span className="text-base font-extrabold my-0.5">{day.dayNum}</span>
                        <span className="text-[9px] font-bold tracking-tight">{day.monthName}</span>

                        <span
                          className={`mt-1 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                            day.isClosed
                              ? 'bg-red-600 text-white'
                              : isSelected
                              ? 'bg-white text-emerald-800'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {day.isClosed ? 'CLOSED' : 'OPEN'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Fallback Custom Date Selector Input */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
                    <span>Selected Schedule Date:</span>
                    <span className="font-extrabold text-brand-maroon dark:text-amber-400">{requiredDate}</span>
                  </div>
                  <input
                    type="date"
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border text-xs font-semibold ${
                      isSelectedDateDisabled
                        ? 'border-red-500 text-red-600 bg-red-50 dark:bg-red-950/30'
                        : 'border-emerald-500 text-emerald-700 dark:text-emerald-300'
                    }`}
                  />
                  {isSelectedDateDisabled && (
                    <p className="mt-1.5 text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                      <span>🚫</span> Store ordering is closed for {requiredDate}. Please select an OPEN (GREEN) date.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Special Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Less spicy, Extra sambar chutney..."
                  value={specialInstruction}
                  onChange={(e) => setSpecialInstruction(e.target.value)}
                  className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-lg space-y-4">
              <div className="flex items-center space-x-2 text-brand-maroon dark:text-amber-400 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <CreditCard className="w-5 h-5" />
                <h3 className="text-base font-bold font-serif">Payment Method</h3>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-brand-maroon text-amber-400 border border-amber-500 shadow-md flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-5 h-5" />
                    <div>
                      <span className="text-sm font-extrabold block">Online Payment</span>
                      <span className="text-[10px] text-amber-200/80 font-normal">Instant Pay via UPI, Cards, Net Banking</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-500 text-brand-maroon rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Available
                  </span>
                </div>

                <div className="bg-amber-500/10 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <div className="flex items-center space-x-2 font-bold text-amber-700 dark:text-amber-400">
                    <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                    <span>Notice: Only Online Payment is Supported</span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    Only online payment is available due to order confirmation requirements and to prevent unconfirmed order issues. Your order will be sent directly to the kitchen upon payment confirmation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Receipt Summary Side Pane */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xl space-y-6 sticky top-28">
              <h3 className="text-lg font-bold font-serif text-brand-maroon dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3 flex items-center justify-between">
                <span>Your Order Summary</span>
                <span className="text-xs text-amber-500 font-sans">{items.length} items</span>
              </h3>

              {/* Items List */}
              <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                {items.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="flex justify-between text-xs">
                    <div>
                      <p className="font-bold text-zinc-800 dark:text-zinc-200">{item.name}</p>
                      <p className="text-[10px] text-zinc-400">{item.quantity}x {formatCurrency(item.unit_price)}</p>
                    </div>
                    <span className="font-bold text-brand-maroon dark:text-amber-400">
                      {formatCurrency(item.unit_price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pricing Math with Order Value Discount */}
              <div className="space-y-2 text-xs border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Subtotal</span>
                  <span className="font-semibold text-brand-maroon dark:text-amber-400">{formatCurrency(subtotal)}</span>
                </div>

                {discountAmount > 0 ? (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                    <span className="flex items-center space-x-1">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Order Discount ({discountPercentage}%)</span>
                    </span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                ) : settings?.order_discount_enabled && amountToUnlock > 0 ? (
                  <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 flex items-center justify-between">
                    <span>Add {formatCurrency(amountToUnlock)} more to unlock {settings.tier1_percentage || 10}% OFF</span>
                  </div>
                ) : null}

                <div className="flex justify-between text-zinc-500 pt-1">
                  <span>Taxes & Packing</span>
                  <span className="text-emerald-600 font-semibold">Included</span>
                </div>

                <div className="flex justify-between text-base font-extrabold text-brand-maroon dark:text-brand-gold pt-3 border-t border-zinc-200 dark:border-zinc-700">
                  <span>Grand Total</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-[11px] text-zinc-500 bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20">
                <ShieldCheck className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>100% Safe & Secure Order Processing. Direct kitchen confirmation.</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-brand-maroon font-bold text-sm flex items-center justify-center space-x-2 shadow-xl shadow-amber-500/20 hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Processing Order...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Confirm & Place Order ({formatCurrency(grandTotal)})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
