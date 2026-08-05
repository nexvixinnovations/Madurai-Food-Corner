const express = require('express');
const router = express.Router();
const comboController = require('../controllers/combo.controller');
const upload = require('../middleware/upload.middleware');

/**
 * Routes for /api/combos
 */

// GET all combos (supports search, available, offer_enabled)
router.get('/', comboController.getCombos);

// GET single combo by ID
router.get('/:id', comboController.getComboById);

// POST create new combo with optional image upload
router.post('/', upload.single('image'), comboController.createCombo);

// PUT update combo with optional image upload
router.put('/:id', upload.single('image'), comboController.updateCombo);

// DELETE combo and clean up Cloudinary image
router.delete('/:id', comboController.deleteCombo);

// PATCH toggle or set availability status
router.patch('/:id/status', comboController.toggleComboStatus);

module.exports = router;
