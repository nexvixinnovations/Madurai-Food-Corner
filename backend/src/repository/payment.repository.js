const prisma = require('../prisma/client');

class PaymentRepository {
  async create(paymentData) {
    return prisma.payment.create({ data: paymentData });
  }

  async findByOrderId(orderId) {
    return prisma.payment.findMany({ where: { orderId } });
  }

  async updateStatus(id, status, details = {}) {
    return prisma.payment.update({
      where: { id },
      data: { status, ...details },
    });
  }
}

module.exports = new PaymentRepository();
