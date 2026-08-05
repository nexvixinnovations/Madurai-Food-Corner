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
}

module.exports = new PaymentService();
