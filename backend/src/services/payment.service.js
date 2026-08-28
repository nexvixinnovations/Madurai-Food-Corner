const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const { validateCreatePayment, validateUpdatePaymentStatus } = require('../validators/payment.validator');

class PaymentService {
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
   * Fetch all payment logs with filters & search. Sorted newest first.
   */
  async getAllPayments({ status, payment_gateway, payment_method, date, order_number, customer_name, search }) {
    const where = {};

    if (status && typeof status === 'string' && status.trim()) {
      where.status = { equals: status.trim(), mode: 'insensitive' };
    }

    if (payment_gateway && typeof payment_gateway === 'string' && payment_gateway.trim()) {
      where.payment_gateway = { equals: payment_gateway.trim(), mode: 'insensitive' };
    }

    if (date) {
      const parsedDate = this.parseDate(date);
      if (parsedDate) {
        const nextDay = new Date(parsedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        where.paid_at = {
          gte: parsedDate,
          lt: nextDay,
        };
      }
    }

    // Order & Customer relation filters
    const orderWhere = {};
    if (order_number && typeof order_number === 'string' && order_number.trim()) {
      orderWhere.order_number = { contains: order_number.trim(), mode: 'insensitive' };
    }
    if (customer_name && typeof customer_name === 'string' && customer_name.trim()) {
      orderWhere.customers = { name: { contains: customer_name.trim(), mode: 'insensitive' } };
    }
    if (Object.keys(orderWhere).length > 0) {
      where.orders = orderWhere;
    }

    // Search by transaction_id, order_number, or customer_name
    if (search && typeof search === 'string' && search.trim()) {
      const query = search.trim();
      where.OR = [
        { transaction_id: { contains: query, mode: 'insensitive' } },
        { orders: { order_number: { contains: query, mode: 'insensitive' } } },
        { orders: { customers: { name: { contains: query, mode: 'insensitive' } } } },
      ];
    }

    return await prisma.payments.findMany({
      where,
      include: {
        orders: {
          include: {
            customers: true,
            order_items: {
              include: {
                food_items: true,
                combos: true,
              },
            },
          },
        },
      },
      orderBy: [
        { paid_at: 'desc' },
        { id: 'desc' },
      ],
    });
  }

  /**
   * Fetch payment details by ID
   */
  async getPaymentById(id) {
    const payment = await prisma.payments.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            customers: true,
            order_items: {
              include: {
                food_items: true,
                combos: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new ApiError(404, 'Payment record not found.');
    }

    return payment;
  }

  /**
   * Fetch payment history records for one order ID
   */
  async getPaymentsByOrderId(orderId) {
    const order = await prisma.orders.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new ApiError(404, 'Order with the specified ID does not exist.');
    }

    return await prisma.payments.findMany({
      where: { order_id: orderId },
      orderBy: { paid_at: 'desc' },
    });
  }

  /**
   * Create payment record and automatically update linked order's payment & order status
   */
  async createPayment(data) {
    validateCreatePayment(data);

    // Verify order exists
    const order = await prisma.orders.findUnique({ where: { id: data.order_id } });
    if (!order) {
      throw new ApiError(404, 'Order with the specified ID does not exist.');
    }

    const amount = parseFloat(data.amount);
    const paymentStatus = data.status ? data.status.trim() : 'Paid';
    const paymentGateway = data.payment_gateway ? data.payment_gateway.trim() : (data.payment_method || 'Cash');
    const transactionId = data.transaction_id ? data.transaction_id.trim() : null;
    const paidAt = data.paid_at ? new Date(data.paid_at) : new Date();

    return await prisma.$transaction(async (tx) => {
      // Idempotency check: if a payment with this transaction_id already exists, update and return it without creating duplicates
      if (transactionId) {
        const existingPayment = await tx.payments.findFirst({
          where: { transaction_id: transactionId },
          include: {
            orders: {
              include: {
                customers: true,
              },
            },
          },
        });

        if (existingPayment) {
          if (existingPayment.status.toLowerCase() === paymentStatus.toLowerCase()) {
            return existingPayment;
          }

          const updatedPayment = await tx.payments.update({
            where: { id: existingPayment.id },
            data: { status: paymentStatus },
            include: {
              orders: {
                include: {
                  customers: true,
                },
              },
            },
          });

          await tx.orders.update({
            where: { id: data.order_id },
            data: {
              payment_status: paymentStatus,
              payment_method: data.payment_method ? data.payment_method.trim() : order.payment_method,
              ...(paymentStatus.toLowerCase() === 'paid' && order.status && order.status.toLowerCase() === 'pending'
                ? { status: 'Accepted' }
                : {}),
            },
          });

          return updatedPayment;
        }
      }

      // 1. Create Payment record
      const payment = await tx.payments.create({
        data: {
          order_id: data.order_id,
          transaction_id: transactionId,
          payment_gateway: paymentGateway,
          amount,
          status: paymentStatus,
          paid_at: paidAt,
        },
      });

      // 2. Prepare Order update payload
      const orderUpdate = {
        payment_status: paymentStatus,
        payment_method: data.payment_method ? data.payment_method.trim() : order.payment_method,
      };

      // Auto Logic: If payment is Paid & order status is Pending, update order status to Accepted
      if (paymentStatus.toLowerCase() === 'paid' && order.status && order.status.toLowerCase() === 'pending') {
        orderUpdate.status = 'Accepted';
      }

      await tx.orders.update({
        where: { id: data.order_id },
        data: orderUpdate,
      });

      return await tx.payments.findUnique({
        where: { id: payment.id },
        include: {
          orders: {
            include: {
              customers: true,
            },
          },
        },
      });
    });
  }

  /**
   * Update payment status and automatically sync linked order status
   */
  async updatePaymentStatus(id, newStatus) {
    const existingPayment = await this.getPaymentById(id);
    validateUpdatePaymentStatus(newStatus);

    const formattedStatus = newStatus.trim();
    const orderId = existingPayment.order_id;
    const order = existingPayment.orders;

    return await prisma.$transaction(async (tx) => {
      // 1. Update Payment status
      const updatedPayment = await tx.payments.update({
        where: { id },
        data: {
          status: formattedStatus,
          paid_at: formattedStatus.toLowerCase() === 'paid' ? new Date() : existingPayment.paid_at,
        },
      });

      // 2. Prepare Order update payload
      const orderUpdate = {
        payment_status: formattedStatus,
      };

      // Auto Logic: If payment is Paid & order status is Pending, update order status to Accepted
      if (formattedStatus.toLowerCase() === 'paid' && order && order.status && order.status.toLowerCase() === 'pending') {
        orderUpdate.status = 'Accepted';
      }

      await tx.orders.update({
        where: { id: orderId },
        data: orderUpdate,
      });

      return await tx.payments.findUnique({
        where: { id },
        include: {
          orders: {
            include: {
              customers: true,
            },
          },
        },
      });
    });
  }

  /**
   * Safety Reconciliation: Identify orders sitting in 'Pending' payment status for > 15 minutes
   * Checks Cashfree API and marks them appropriately (or logs alerts).
   */
  async reconcileStuckPendingPayments(maxAgeMinutes = 15) {
    const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    const stuckOrders = await prisma.orders.findMany({
      where: {
        payment_status: { in: ['Pending', 'pending'] },
        payment_method: { in: ['Online', 'Cashfree', 'online'] },
        created_at: { lt: cutoffTime },
      },
      include: { payments: true },
      take: 20,
    });

    if (stuckOrders.length === 0) return { reconciled: 0, totalStuck: 0 };

    const cashfreeService = require('./cashfree.service');
    let reconciledCount = 0;

    for (const ord of stuckOrders) {
      try {
        const cfOrder = await cashfreeService.getOrderDetails(ord.order_number).catch(() => null);
        if (cfOrder && cfOrder.order_status === 'PAID') {
          await this.createPayment({
            order_id: ord.id,
            transaction_id: cfOrder.cf_order_id || `CF_RECON_${ord.order_number}`,
            payment_gateway: 'Cashfree',
            amount: cfOrder.order_amount || ord.total_amount,
            status: 'Paid',
          });
          reconciledCount++;
          console.log(`[PAYMENT RECONCILIATION] Resolved stuck order #${ord.order_number} to PAID`);
        } else if (cfOrder && ['EXPIRED', 'TERMINATED', 'CANCELLED', 'FAILED'].includes(cfOrder.order_status)) {
          await prisma.orders.update({
            where: { id: ord.id },
            data: { payment_status: 'Failed' },
          });
          reconciledCount++;
          console.log(`[PAYMENT RECONCILIATION] Marked stuck order #${ord.order_number} as FAILED (${cfOrder.order_status})`);
        } else {
          console.warn(`[PAYMENT RECONCILIATION ALERT] Order #${ord.order_number} pending for > ${maxAgeMinutes}m. Cashfree status: ${cfOrder?.order_status || 'UNKNOWN'}`);
        }
      } catch (err) {
        console.error(`[PAYMENT RECONCILIATION ERROR] Order #${ord.order_number}:`, err.message);
      }
    }

    return { reconciled: reconciledCount, totalStuck: stuckOrders.length };
  }
}

module.exports = new PaymentService();
