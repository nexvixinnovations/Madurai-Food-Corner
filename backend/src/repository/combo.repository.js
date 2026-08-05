const prisma = require('../prisma/client');

class ComboRepository {
  async findAll() {
    return prisma.combo.findMany({
      where: { isDeleted: false },
      include: {
        comboItems: {
          include: { foodItem: true },
        },
      },
    });
  }

  async findById(id) {
    return prisma.combo.findFirst({
      where: { id, isDeleted: false },
      include: {
        comboItems: {
          include: { foodItem: true },
        },
      },
    });
  }

  async create(comboData) {
    return prisma.combo.create({ data: comboData });
  }

  async update(id, data) {
    return prisma.combo.update({ where: { id }, data });
  }

  async softDelete(id) {
    return prisma.combo.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }
}

module.exports = new ComboRepository();
