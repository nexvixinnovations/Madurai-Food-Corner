const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authRepository = require('../repository/auth.repository');
const config = require('../config');
const ApiError = require('../utils/apiError');

class AuthService {
  async registerUser({ name, email, password, phone, role }) {
    const existingUser = await authRepository.findByEmail(email);
    if (existingUser) {
      throw new ApiError(400, 'User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await authRepository.createUser({
      name,
      email,
      passwordHash,
      phone,
      role: role || 'STAFF',
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async loginUser({ email, password }) {
    const user = await authRepository.findByEmail(email);
    if (!user || !user.isActive) {
      throw new ApiError(401, 'Invalid credentials or account is inactive');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async getUserProfile(userId) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User profile not found');
    }
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

module.exports = new AuthService();
