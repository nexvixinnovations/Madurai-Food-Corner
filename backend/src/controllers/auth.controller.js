const authService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);
  res.status(201).json(new ApiResponse(201, user, 'User registered successfully'));
});

const login = asyncHandler(async (req, res) => {
  const data = await authService.loginUser(req.body);
  res.status(200).json(new ApiResponse(200, data, 'Login successful'));
});

const getProfile = asyncHandler(async (req, res) => {
  const profile = await authService.getUserProfile(req.user.id);
  res.status(200).json(new ApiResponse(200, profile, 'User profile fetched successfully'));
});

module.exports = {
  register,
  login,
  getProfile,
};
