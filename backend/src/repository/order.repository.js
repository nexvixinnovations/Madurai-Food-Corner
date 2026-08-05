const prisma = require('../prisma/client');

class OrderRepository {
  async findAll(filter = {}) {
    return prisma.order.findMany({
      where: { ...filter, isDeleted: false },
      include: {
        customer: true,
        orderItems: {
          include: { foodItem: true, combo: true },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id) {
    return prisma.order.findFirst({
      where: { id, isDeleted: false },
      include: {
        customer: true,
        orderItems: {
          include: { foodItem: true, combo: true },
        },
        payments: true,
      },
    });
  }

  async create(orderData) {
    return prisma.order.create({
      data: orderData,
      include: {
        orderItems: true,
      },
    });
  }

  async updateStatus(id, status) {
    return prisma.order.update({
      where: { id },
      data: { status },
    });
  }

  async updatePaymentStatus(id, paymentStatus) {
    return prisma.order.update({
      where: { id },
      data: { paymentStatus },
    });
  }
}

module.exports = new OrderRepository();
