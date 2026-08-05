const express = require('express');
const router = express.Router();

const foodItemRoutes = require('./foodItem.routes');
const menuScheduleRoutes = require('./menuSchedule.routes');
const comboRoutes = require('./combo.routes');
const offerRoutes = require('./offer.routes');
const orderRoutes = require('./order.routes');
const paymentRoutes = require('./payment.routes');
const reportRoutes = require('./report.routes');
const settingRoutes = require('./setting.routes');

// Centralized Feature Modules Router
router.use('/food-items', foodItemRoutes);
router.use('/menu-schedules', menuScheduleRoutes);
router.use('/combos', comboRoutes);
router.use('/offers', offerRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingRoutes);

module.exports = router;
