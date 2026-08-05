const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

class PricingService {
  /**
   * Helper to get current day name in local/UTC context
   */
  getDayName(date = new Date()) {
    const d = new Date(date);
    return DAYS_OF_WEEK[d.getDay()];
  }

  /**
   * Check if a food item's available_days allows ordering on target date
   */
  isFoodAvailableOnDate(availableDaysStr, targetDate = new Date()) {
    if (!availableDaysStr || availableDaysStr.trim() === '' || availableDaysStr === 'Every Day') {
      return true;
    }
    const dayName = this.getDayName(targetDate);
    const allowedDays = availableDaysStr.split(',').map((s) => s.trim().toLowerCase());
    return allowedDays.includes(dayName.toLowerCase());
  }

  /**
   * Round a number to 2 decimal places (currency-safe)
   */
  round2(val) {
    return Math.round(val * 100) / 100;
  }

  /**
   * Calculate Order-Value Discount based on ELIGIBLE subtotal only.
   *
   * RULES:
   *   - Discount applies ONLY to eligibleSubtotal (food items + combos)
   *   - Special Offer items are NEVER eligible
   *   - Threshold check uses eligibleSubtotal ONLY (Special Offers don't help qualify)
   *   - Uses tier1_min_amount and tier1_percentage from settings (single-tier)
   *
   * @param {number} eligibleSubtotal - Sum of food + combo items only
   * @param {object} settings - Restaurant settings from DB
   * @returns {{ discount_percentage, discount_amount, eligible_after_discount, total_amount }}
   */
  calculateOrderValueDiscount(eligibleSubtotal, specialOfferSubtotal, settings) {
    const eligibleVal = this.round2(eligibleSubtotal || 0);
    const offerVal = this.round2(specialOfferSubtotal || 0);

    if (!settings || !settings.order_discount_enabled) {
      return {
        discount_percentage: 0,
        discount_amount: 0,
        total_amount: this.round2(eligibleVal + offerVal),
      };
    }

    const minAmount = parseFloat(settings.tier1_min_amount || 0);
    const pct = parseFloat(settings.tier1_percentage || 0);

    // Threshold check: eligibleSubtotal >= minimumAmount (Special Offers excluded from qualifying)
    let discountPercentage = 0;
    if (minAmount > 0 && pct > 0 && eligibleVal >= minAmount) {
      discountPercentage = pct;
    }

    const discountAmount = this.round2((eligibleVal * discountPercentage) / 100);
    const grandTotal = this.round2(Math.max(0, eligibleVal - discountAmount) + offerVal);

    return {
      discount_percentage: discountPercentage,
      discount_amount: discountAmount,
      total_amount: grandTotal,
    };
  }

  /**
   * Central Authoritative Order Pricing & Line Items Calculation
   *
   * Item types:
   *   'food'  — Regular food item (eligible for discount)
   *   'combo' — Combo meal (eligible for discount)
   *   'offer' — Special Offer item (NOT eligible for discount, not counted toward threshold)
   */
  async calculateOrderPricing({ items, order_type = 'Parcel', required_date = new Date() }) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new ApiError(400, 'Order must contain at least one item.');
    }

    const settings = await prisma.settings.findFirst().catch(() => null);

    const calculatedLineItems = [];
    let eligibleSubtotal = 0;       // food + combo items only
    let specialOfferSubtotal = 0;   // special offer items only

    const normalizedOrderType = (order_type || 'Parcel').trim().toLowerCase();
    const isParcel = normalizedOrderType === 'parcel' || normalizedOrderType === 'takeaway' || normalizedOrderType === 'take away';

    for (const item of items) {
      if (!item || !item.id) continue;
      const itemType = (item.type || 'food').toLowerCase();
      const qty = parseInt(item.quantity || 1, 10);
      if (isNaN(qty) || qty <= 0) continue;

      if (itemType === 'food') {
        // ─── NORMAL FOOD ITEM (eligible for percentage discount) ───
        const food = await prisma.food_items.findUnique({ where: { id: item.id } });
        if (!food) {
          throw new ApiError(404, `Food item with ID ${item.id} not found.`);
        }

        if (food.available === false) {
          throw new ApiError(400, `Food item '${food.name}' is currently unavailable.`);
        }

        if (!this.isFoodAvailableOnDate(food.available_days, required_date)) {
          const dayName = this.getDayName(required_date);
          throw new ApiError(400, `'${food.name}' is not available on ${dayName}. Available days: ${food.available_days}.`);
        }

        // Use individual item offer price if enabled
        const unitPrice = food.offer_enabled && food.offer_price && parseFloat(food.offer_price) > 0
          ? parseFloat(food.offer_price)
          : parseFloat(food.price);

        const lineTotal = this.round2(unitPrice * qty);
        eligibleSubtotal += lineTotal;

        calculatedLineItems.push({
          food_item_id: food.id,
          combo_id: null,
          special_offer_id: null,
          quantity: qty,
          unit_price: unitPrice,
          line_total: lineTotal,
          item_name: food.name,
          item_type: 'food',
        });

      } else if (itemType === 'combo') {
        // ─── COMBO MEAL (eligible for percentage discount) ───
        const combo = await prisma.combos.findUnique({
          where: { id: item.id },
          include: { combo_items: { include: { food_items: true } } },
        });

        if (!combo) {
          throw new ApiError(404, `Combo with ID ${item.id} not found.`);
        }

        if (combo.available === false) {
          throw new ApiError(400, `Combo '${combo.name}' is currently unavailable.`);
        }

        let unitPrice;
        if (combo.offer_enabled && combo.offer_price && parseFloat(combo.offer_price) > 0) {
          unitPrice = parseFloat(combo.offer_price);
        } else if (isParcel) {
          unitPrice = parseFloat(combo.parcel_price || combo.price);
        } else {
          unitPrice = parseFloat(combo.dine_in_price || combo.price);
        }

        const lineTotal = this.round2(unitPrice * qty);
        eligibleSubtotal += lineTotal;

        calculatedLineItems.push({
          food_item_id: null,
          combo_id: combo.id,
          special_offer_id: null,
          quantity: qty,
          unit_price: unitPrice,
          line_total: lineTotal,
          item_name: combo.name,
          item_type: 'combo',
        });

      } else if (itemType === 'offer') {
        // ─── SPECIAL OFFER ITEM (NOT eligible for percentage discount) ───
        const offer = await prisma.special_offers.findUnique({
          where: { id: item.id },
          include: { special_offer_items: { include: { food_items: true } } },
        });

        if (!offer) {
          throw new ApiError(404, `Special offer with ID ${item.id} not found.`);
        }

        if (offer.available === false) {
          throw new ApiError(400, `Special offer '${offer.title}' is currently unavailable.`);
        }

        // Offer price is fixed — no additional percentage discount applied
        const unitPrice = parseFloat(offer.offer_price || offer.price || 99);
        const lineTotal = this.round2(unitPrice * qty);
        specialOfferSubtotal += lineTotal;  // goes into NON-eligible bucket

        calculatedLineItems.push({
          food_item_id: null,
          combo_id: null,
          special_offer_id: offer.id,
          quantity: qty,
          unit_price: unitPrice,
          line_total: lineTotal,
          item_name: offer.title,
          item_type: 'offer',
        });
      }
    }

    eligibleSubtotal = this.round2(eligibleSubtotal);
    specialOfferSubtotal = this.round2(specialOfferSubtotal);
    const subtotal = this.round2(eligibleSubtotal + specialOfferSubtotal);

    // Apply Order-Value Discount (eligible items only, eligible threshold only)
    const discountResult = this.calculateOrderValueDiscount(eligibleSubtotal, specialOfferSubtotal, settings);

    logger.info('[PricingService] Order pricing calculated', {
      eligibleSubtotal,
      specialOfferSubtotal,
      subtotal,
      discount_percentage: discountResult.discount_percentage,
      discount_amount: discountResult.discount_amount,
      total_amount: discountResult.total_amount,
    });

    return {
      calculatedLineItems,
      subtotal,
      eligible_subtotal: eligibleSubtotal,
      special_offer_subtotal: specialOfferSubtotal,
      discount_percentage: discountResult.discount_percentage,
      discount_amount: discountResult.discount_amount,
      total_amount: discountResult.total_amount,
    };
  }

  /**
   * Preview-only calculation for frontend display (does NOT create any order).
   * Returns discount breakdown for a given cart without side effects.
   */
  async previewCartDiscount({ eligibleSubtotal, specialOfferSubtotal }) {
    const settings = await prisma.settings.findFirst().catch(() => null);
    const result = this.calculateOrderValueDiscount(
      eligibleSubtotal || 0,
      specialOfferSubtotal || 0,
      settings
    );

    const discountEnabled = settings?.order_discount_enabled ?? false;
    const minAmount = parseFloat(settings?.tier1_min_amount || 0);
    const pct = parseFloat(settings?.tier1_percentage || 0);

    return {
      ...result,
      discount_enabled: discountEnabled,
      min_amount: minAmount,
      discount_percent: pct,
      eligible_subtotal: this.round2(eligibleSubtotal || 0),
      special_offer_subtotal: this.round2(specialOfferSubtotal || 0),
    };
  }
}

module.exports = new PricingService();
