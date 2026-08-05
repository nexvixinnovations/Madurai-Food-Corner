const prisma = require('../prisma/client');

class MenuScheduleRepository {
  async findAll() {
    return prisma.menuSchedule.findMany({
      where: { isDeleted: false, isActive: true },
      include: { foodItem: true },
    });
  }

  async findById(id) {
    return prisma.menuSchedule.findFirst({
      where: { id, isDeleted: false },
      include: { foodItem: true },
    });
  }

  async create(data) {
    return prisma.menuSchedule.create({ data });
  }

  async update(id, data) {
    return prisma.menuSchedule.update({ where: { id }, data });
  }

  async softDelete(id) {
    return prisma.menuSchedule.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }
}

module.exports = new MenuScheduleRepository();
