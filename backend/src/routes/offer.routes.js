const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offer.controller');
const upload = require('../middleware/upload.middleware');

/**
 * Routes for /api/offers
 */

// GET all offers (supports search, available, active filters)
router.get('/', offerController.getOffers);

// GET single offer by ID
router.get('/:id', offerController.getOfferById);

// POST create new offer with optional image upload
router.post('/', upload.single('image'), offerController.createOffer);

// PUT update offer with optional image upload
router.put('/:id', upload.single('image'), offerController.updateOffer);

// DELETE offer and clean up Cloudinary image
router.delete('/:id', offerController.deleteOffer);

// PATCH toggle or set availability status
router.patch('/:id/status', offerController.toggleOfferStatus);

module.exports = router;
