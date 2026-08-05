const prisma = require('../prisma/client');

class SettingRepository {
  async findAll() {
    return prisma.setting.findMany();
  }

  async findByKey(key) {
    return prisma.setting.findUnique({ where: { key } });
  }

  async upsert(key, value, description = '') {
    return prisma.setting.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    });
  }
}

module.exports = new SettingRepository();
