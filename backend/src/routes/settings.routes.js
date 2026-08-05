const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const upload = require('../middleware/upload.middleware');

/**
 * Routes for /api/settings
 */

// GET restaurant settings
router.get('/', settingsController.getSettings);

// PUT update restaurant settings (supports optional logo and banner file uploads)
router.put(
  '/',
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
  ]),
  settingsController.updateSettings
);

// PATCH toggle operational statuses (online ordering, delivery, takeaway, dinein, maintenance mode)
router.patch('/status', settingsController.updateSettingsStatus);

module.exports = router;
