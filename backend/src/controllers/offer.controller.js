const offerService = require('../services/offer.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Controller: Get all offers with search, available, active filters
 * GET /api/offers
 */
const getOffers = asyncHandler(async (req, res) => {
  const { search, available, active } = req.query;
  const offers = await offerService.getAllOffers({ search, available, active });
  res.status(200).json(new ApiResponse(200, offers, 'Special offers retrieved successfully'));
});

/**
 * Controller: Get single offer by ID
 * GET /api/offers/:id
 */
const getOfferById = asyncHandler(async (req, res) => {
  const offer = await offerService.getOfferById(req.params.id);
  res.status(200).json(new ApiResponse(200, offer, 'Special offer details retrieved successfully'));
});

/**
 * Controller: Create new special offer with image upload
 * POST /api/offers
 */
const createOffer = asyncHandler(async (req, res) => {
  const newOffer = await offerService.createOffer(req.body, req.file);
  res.status(201).json(new ApiResponse(201, newOffer, 'Special offer created successfully'));
});

/**
 * Controller: Update existing special offer with optional image upload
 * PUT /api/offers/:id
 */
const updateOffer = asyncHandler(async (req, res) => {
  const updatedOffer = await offerService.updateOffer(req.params.id, req.body, req.file);
  res.status(200).json(new ApiResponse(200, updatedOffer, 'Special offer updated successfully'));
});

/**
 * Controller: Delete special offer and clean up Cloudinary image
 * DELETE /api/offers/:id
 */
const deleteOffer = asyncHandler(async (req, res) => {
  await offerService.deleteOffer(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Special offer deleted successfully'));
});

/**
 * Controller: Toggle availability status of a special offer
 * PATCH /api/offers/:id/status
 */
const toggleOfferStatus = asyncHandler(async (req, res) => {
  const { available } = req.body;
  const updatedOffer = await offerService.toggleOfferStatus(req.params.id, available);
  res.status(200).json(new ApiResponse(200, updatedOffer, 'Special offer availability status updated successfully'));
});

module.exports = {
  getOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
  toggleOfferStatus,
};
