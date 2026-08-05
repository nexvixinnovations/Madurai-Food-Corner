const prisma = require('../config/prisma');

class SettingService {
  async getSettings() {
    return prisma.settings.findFirst();
  }

  async updateSettings(id, data) {
    if (id) {
      return prisma.settings.update({ where: { id }, data });
    }
    return prisma.settings.create({ data });
  }
}

module.exports = new SettingService();
