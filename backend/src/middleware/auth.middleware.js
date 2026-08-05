const jwt = require('jsonwebtoken');
const config = require('../config');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../prisma/client');

const verifyJwt = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    throw new ApiError(401, 'Unauthorized request. No token provided.');
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isActive: true, isDeleted: true },
    });

    if (!user || !user.isActive || user.isDeleted) {
      throw new ApiError(401, 'Invalid or deactivated user account.');
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || 'Invalid access token');
  }
});

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, 'Forbidden. You do not have permission to perform this action.');
    }
    next();
  };
};

module.exports = {
  verifyJwt,
  authorizeRoles,
};
