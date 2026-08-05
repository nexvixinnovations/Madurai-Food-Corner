const prisma = require('../prisma/client');

class AuthRepository {
  async findByEmail(email) {
    return prisma.user.findFirst({
      where: { email, isDeleted: false },
    });
  }

  async findById(id) {
    return prisma.user.findFirst({
      where: { id, isDeleted: false },
    });
  }

  async createUser(userData) {
    return prisma.user.create({
      data: userData,
    });
  }
}

module.exports = new AuthRepository();
