const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');

class MenuScheduleService {
  async getMenuSchedules() {
    return prisma.menu_schedule.findMany({
      include: { food_items: true },
    });
  }

  async createMenuSchedule(data) {
    return prisma.menu_schedule.create({ data });
  }

  async deleteMenuSchedule(id) {
    const existing = await prisma.menu_schedule.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, 'Menu schedule entry not found');
    }
    return prisma.menu_schedule.delete({ where: { id } });
  }
}

module.exports = new MenuScheduleService();
