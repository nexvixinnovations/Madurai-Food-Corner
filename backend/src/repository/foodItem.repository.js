const prisma = require('../prisma/client');

class FoodItemRepository {
  async findAll(filter = {}) {
    return prisma.foodItem.findMany({
      where: { ...filter, isDeleted: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id) {
    return prisma.foodItem.findFirst({
      where: { id, isDeleted: false },
    });
  }

  async create(data) {
    return prisma.foodItem.create({
      data,
    });
  }

  async update(id, data) {
    return prisma.foodItem.update({
      where: { id },
      data,
    });
  }

  async softDelete(id) {
    return prisma.foodItem.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }
}

module.exports = new FoodItemRepository();
