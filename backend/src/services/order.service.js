const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const orderingCalendarService = require('./orderingCalendar.service');
const pricingService = require('./pricing.service');
const { validateCreateOrder, validateUpdateOrderStatus } = require('../validators/order.validator');

class OrderService {
  /**
   * Helper to parse date string for date field comparisons
   */
  parseDate(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  /**
   * Auto-generate sequential date-formatted order number based on order channel.
   * Website format: MFCW-[DATE]-[MONTH]-[ORDER NUMBER] (e.g. MFCW-24-07-001)
   * Shop POS format: MFCS-[DATE]-[MONTH]-[ORDER NUMBER] (e.g. MFCS-25-07-001)
   */
  async generateOrderNumber(orderSource = 'website') {
    const isWebsite = (orderSource || 'website').trim().toLowerCase() === 'website';
    const channelPrefix = isWebsite ? 'MFCW' : 'MFCS';

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `${channelPrefix}-${day}-${month}-`;

    const latestOrder = await prisma.orders.findMany({
      where: {
        order_number: {
          startsWith: prefix,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 1,
    });

    let sequence = 1;
    if (latestOrder.length > 0) {
      const parts = latestOrder[0].order_number.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    let orderNumber = `${prefix}${String(sequence).padStart(3, '0')}`;
    let existing = await prisma.orders.findUnique({ where: { order_number: orderNumber } });
    while (existing) {
      sequence++;
      orderNumber = `${prefix}${String(sequence).padStart(3, '0')}`;
      existing = await prisma.orders.findUnique({ where: { order_number: orderNumber } });
    }

    return orderNumber;
  }

  /**
   * Get all orders with search, filters (status, payment_status, required_date, source, customer), and sorting
   */
  async getAllOrders({ status, payment_status, required_date, order_source, phone, name, search }) {
    const where = {};

    if (status && typeof status === 'string' && status.trim()) {
      where.status = { equals: status.trim(), mode: 'insensitive' };
    }

    if (payment_status && typeof payment_status === 'string' && payment_status.trim()) {
      where.payment_status = { equals: payment_status.trim(), mode: 'insensitive' };
    }

    if (order_source && typeof order_source === 'string' && order_source.trim()) {
      where.order_source = { equals: order_source.trim(), mode: 'insensitive' };
    }

    if (required_date) {
      const parsedReqDate = this.parseDate(required_date);
      if (parsedReqDate) {
        where.required_date = parsedReqDate;
        
        // 3 PM Clearing Logic: If today's orders are requested, and it's past 3 PM, clear the display.
        const now = new Date();
        const todayUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        const isToday = parsedReqDate.getTime() === todayUtc.getTime();
        
        if (isToday && now.getHours() >= 15) {
          // Force empty result to clear the display in the admin app
          where.id = 'cleared_after_3pm';
        }
      }
    }

    // Customer filters
    const customerWhere = {};
    if (phone && typeof phone === 'string' && phone.trim()) {
      customerWhere.phone = { contains: phone.trim() };
    }
    if (name && typeof name === 'string' && name.trim()) {
      customerWhere.name = { contains: name.trim(), mode: 'insensitive' };
    }
    if (Object.keys(customerWhere).length > 0) {
      where.customers = customerWhere;
    }

    // Search by order_number, customer phone, or customer name
    if (search && typeof search === 'string' && search.trim()) {
      const query = search.trim();
      where.OR = [
        { order_number: { contains: query, mode: 'insensitive' } },
        { customers: { phone: { contains: query } } },
        { customers: { name: { contains: query, mode: 'insensitive' } } },
      ];
    }

    return await prisma.orders.findMany({
      where,
      include: {
        customers: true,
        order_items: {
          include: {
            food_items: true,
            combos: true,
            special_offers: true,
          },
        },
        payments: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  /**
   * Get complete single order by ID
   */
  async getOrderById(id) {
    const order = await prisma.orders.findUnique({
      where: { id },
      include: {
        customers: true,
        order_items: {
          include: {
            food_items: true,
            combos: true,
          },
        },
        payments: true,
      },
    });

    if (!order) {
      throw new ApiError(404, 'Order not found.');
    }

    return order;
  }

  /**
   * Create new customer order with automatic pricing calculations, customer reuse, and Prisma transaction
   */
  async createOrder(data) {
    validateCreateOrder(data);

    // Check if date-wise ordering constraint applies ONLY FOR WEBSITE ORDERS
    const orderSource = (data.order_source || 'website').trim().toLowerCase();
    const isWebsiteOrder = orderSource === 'website';

    const reqDateStr = data.required_date ? new Date(data.required_date).toISOString().split('T')[0] : null;

    if (isWebsiteOrder && reqDateStr) {
      const orderingWindowService = require('./orderingWindow.service');
      const windowStatus = await orderingWindowService.getOrderingStatus(reqDateStr);
      if (windowStatus.enabled && !windowStatus.isOpen) {
        logger.warn(`[OrderService] Website order rejected: Ordering time window closed for ${reqDateStr}`);
        throw new ApiError(409, windowStatus.statusText || 'Ordering is currently closed for the selected date.', { code: 'ORDERING_WINDOW_CLOSED' });
      }

      const currentSettings = await prisma.settings.findFirst().catch(() => null);
      if (currentSettings && currentSettings.date_wise_ordering_enabled === false) {
        logger.warn(`[OrderService] Website order rejected: Date-wise ordering disabled globally by restaurant settings`);
        throw new ApiError(400, 'Online ordering is currently closed by the restaurant management.');
      }

      // Query database ordering_calendar model single source of truth
      const isClosedInDb = await orderingCalendarService.isDateClosed(reqDateStr);
      if (isClosedInDb) {
        logger.warn(`[OrderService] Website order rejected: Selected order date ${reqDateStr} is CLOSED in Neon DB ordering_calendar`);
        throw new ApiError(400, 'Ordering is closed for the selected date.');
      }

      if (currentSettings) {
        let disabled = [];
        try {
          disabled = typeof currentSettings.disabled_dates === 'string'
            ? JSON.parse(currentSettings.disabled_dates || '[]')
            : (currentSettings.disabled_dates || []);
        } catch (e) {
          disabled = [];
        }

        if (Array.isArray(disabled) && disabled.includes(reqDateStr)) {
          throw new ApiError(400, `Ordering is closed for the selected date (${reqDateStr}).`);
        }

        // Check Same-Day Cutoff Time (e.g., 2:00 PM / 14:00 cutoff for same-day ordering)
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffset);
        const todayIso = `${istTime.getFullYear()}-${String(istTime.getMonth() + 1).padStart(2, '0')}-${String(istTime.getDate()).padStart(2, '0')}`;

        if (reqDateStr === todayIso) {
          const cutoffTimeStr = currentSettings.ordering_start_time || currentSettings.website_order_window_start || '14:00';
          const [cutoffH, cutoffM] = cutoffTimeStr.split(':').map((n) => parseInt(n, 10) || 0);
          const currentTotalMin = istTime.getHours() * 60 + istTime.getMinutes();
          const cutoffTotalMin = cutoffH * 60 + cutoffM;

          if (currentTotalMin >= cutoffTotalMin) {
            const fmtCutoff = orderingWindowService.format12Hour(cutoffTimeStr);
            logger.warn(`[OrderService] Same-day order rejected for ${todayIso}: current time passed cutoff (${fmtCutoff})`);
            throw new ApiError(400, `Same-day ordering for today closed at ${fmtCutoff}. Please select an upcoming date.`);
          }
        }
      }
    }

    const requiredDate = this.parseDate(data.required_date);
    let requiredTime = null;
    if (data.required_time) {
      const timeParts = data.required_time.split(':');
      if (timeParts.length >= 2) {
        const dummyDate = new Date();
        dummyDate.setHours(parseInt(timeParts[0], 10), parseInt(timeParts[1], 10), 0, 0);
        requiredTime = dummyDate;
      }
    }

    // 1. Process Order Items & Calculate Pricing Automatically via Central PricingService
    const {
      calculatedLineItems,
      subtotal,
      eligible_subtotal,
      special_offer_subtotal,
      discount_percentage,
      discount_amount,
      total_amount,
    } = await pricingService.calculateOrderPricing({
      items: data.items,
      order_type: data.order_type,
      required_date: requiredDate || new Date(),
    });

    // 2. Generate Sequential Order Number by Channel (MFCW for website, MFCS for shop/POS)
    const orderNumber = await this.generateOrderNumber(data.order_source);

    const customerPhone = (data.customer.phone && data.customer.phone.trim()) ? data.customer.phone.trim() : '9999999999';
    const customerName = (data.customer.name && data.customer.name.trim()) ? data.customer.name.trim() : 'Counter Customer';
    const customerEmail = data.customer.email ? data.customer.email.trim() : null;

    // 3. Execute Database Transaction for Customer, Order Header, Order Items, & Initial Payment
    return await prisma.$transaction(async (tx) => {
      // Find or create customer
      let customer = await tx.customers.findFirst({
        where: { phone: customerPhone },
      });

      if (!customer) {
        customer = await tx.customers.create({
          data: {
            name: customerName,
            phone: customerPhone,
            email: customerEmail,
          },
        });
      }

      // Determine initial payment status: MUST be 'Pending' by default for all unverified / online orders
      const isExplicitCash = data.payment_method && ['cash', 'pos cash', 'counter cash'].includes(data.payment_method.trim().toLowerCase());
      const initialPaymentStatus = data.payment_status
        ? data.payment_status.trim()
        : isExplicitCash
        ? 'Paid'
        : 'Pending';

      const initialOrderStatus = data.status
        ? data.status.trim()
        : initialPaymentStatus.toLowerCase() === 'paid'
        ? 'Accepted'
        : 'Pending';

      // Create Order Header
      const newOrder = await tx.orders.create({
        data: {
          order_number: orderNumber,
          customer_id: customer.id,
          order_source: data.order_source ? data.order_source.trim() : 'website',
          required_date: requiredDate,
          required_time: requiredTime,
          order_type: data.order_type.trim(),
          payment_method: data.payment_method ? data.payment_method.trim() : 'Online',
          payment_status: initialPaymentStatus,
          status: initialOrderStatus,
          subtotal: subtotal,
          eligible_subtotal: eligible_subtotal,
          special_offer_subtotal: special_offer_subtotal,
          discount_percentage: discount_percentage,
          discount_amount: discount_amount,
          total_amount: total_amount,
          special_instruction: data.special_instruction ? data.special_instruction.trim() : null,
          order_items: {
            create: calculatedLineItems.map(item => ({
              food_item_id: item.food_item_id,
              combo_id: item.combo_id,
              special_offer_id: item.special_offer_id || null,
              quantity: item.quantity,
              unit_price: item.unit_price,
              line_total: item.line_total,
            })),
          },
          ...(data.payment_method ? {
            payments: {
              create: {
                payment_gateway: data.payment_method.trim(),
                amount: total_amount,
                status: initialPaymentStatus,
              },
            },
          } : {}),
        },
        include: {
          customers: true,
          order_items: {
            include: {
              food_items: true,
              combos: true,
            },
          },
          payments: true,
        },
      });

      return newOrder;
    });
  }

  /**
   * Update order fields (status, payment_status, required_date, required_time, etc.)
   */
  async updateOrder(id, data) {
    await this.getOrderById(id);

    const updateData = {};
    if (data.status) {
      validateUpdateOrderStatus(data.status);
      updateData.status = data.status.trim();
    }
    if (data.payment_status) updateData.payment_status = data.payment_status.trim();
    if (data.payment_method) updateData.payment_method = data.payment_method.trim();
    if (data.order_type) updateData.order_type = data.order_type.trim();
    if (data.special_instruction !== undefined) updateData.special_instruction = data.special_instruction ? data.special_instruction.trim() : null;
    if (data.required_date) updateData.required_date = this.parseDate(data.required_date);

    if (data.required_time) {
      const timeParts = data.required_time.split(':');
      if (timeParts.length >= 2) {
        const dummyDate = new Date();
        dummyDate.setHours(parseInt(timeParts[0], 10), parseInt(timeParts[1], 10), 0, 0);
        updateData.required_time = dummyDate;
      }
    }

    return await prisma.orders.update({
      where: { id },
      data: updateData,
      include: {
        customers: true,
        order_items: {
          include: {
            food_items: true,
            combos: true,
          },
        },
        payments: true,
      },
    });
  }

  /**
   * Update status of an order
   */
  async updateOrderStatus(id, status) {
    await this.getOrderById(id);
    validateUpdateOrderStatus(status);

    return await prisma.orders.update({
      where: { id },
      data: { status: status.trim() },
      include: {
        customers: true,
        order_items: {
          include: {
            food_items: true,
            combos: true,
          },
        },
        payments: true,
      },
    });
  }

  /**
   * Delete order and associated order_items and payment records
   */
  async deleteOrder(id) {
    await this.getOrderById(id);

    return await prisma.orders.delete({
      where: { id },
    });
  }
}

module.exports = new OrderService();
