const prisma = require('../prisma/client');

class ReportRepository {
  async getSalesSummary(startDate, endDate) {
    return prisma.order.aggregate({
      _sum: { finalAmount: true },
      _count: { id: true },
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'DELIVERED',
        isDeleted: false,
      },
    });
  }

  async getTopSellingItems(limit = 5) {
    return prisma.orderItem.groupBy({
      by: ['foodItemId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });
  }
}

module.exports = new ReportRepository();
