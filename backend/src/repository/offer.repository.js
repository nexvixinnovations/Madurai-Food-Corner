const prisma = require('../prisma/client');

class OfferRepository {
  async findAllActive() {
    return prisma.specialOffer.findMany({
      where: {
        isDeleted: false,
        isActive: true,
        validUntil: { gte: new Date() },
      },
    });
  }

  async findByCode(code) {
    return prisma.specialOffer.findFirst({
      where: { code, isDeleted: false, isActive: true },
    });
  }

  async findById(id) {
    return prisma.specialOffer.findFirst({
      where: { id, isDeleted: false },
    });
  }

  async create(data) {
    return prisma.specialOffer.create({ data });
  }

  async update(id, data) {
    return prisma.specialOffer.update({ where: { id }, data });
  }

  async softDelete(id) {
    return prisma.specialOffer.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }
}

module.exports = new OfferRepository();
