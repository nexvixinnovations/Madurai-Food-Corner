const mediaService = require('../services/media.service');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Controller: Upload single media file
 * POST /api/media/upload
 */
const uploadSingleMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Please select a file to upload.');
  }

  const folder = req.body.folder || req.query.folder || 'general';
  const result = await mediaService.uploadSingle(req.file, folder);

  res.status(201).json(new ApiResponse(201, result, 'Media uploaded successfully.'));
});

/**
 * Controller: Upload multiple media files
 * POST /api/media/uploads
 */
const uploadMultipleMedia = asyncHandler(async (req, res) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    throw new ApiError(400, 'Please select at least one file to upload.');
  }

  const folder = req.body.folder || req.query.folder || 'general';
  const results = await mediaService.uploadMultiple(req.files, folder);

  res.status(201).json(new ApiResponse(201, results, 'Multiple media files uploaded successfully.'));
});

/**
 * Controller: Delete media by public_id
 * DELETE /api/media/* or DELETE /api/media/:publicId
 */
const deleteMedia = asyncHandler(async (req, res) => {
  // Public ID can be passed in route params, wildcard param, or query string
  const publicId = req.params[0] || req.params.publicId || req.query.public_id;
  const result = await mediaService.delete(publicId);

  res.status(200).json(new ApiResponse(200, result, 'Media deleted successfully.'));
});

/**
 * Controller: List uploaded media assets
 * GET /api/media
 */
const listMedia = asyncHandler(async (req, res) => {
  const { folder, page, limit } = req.query;
  const data = await mediaService.listMedia({ folder, page, limit });

  res.status(200).json(new ApiResponse(200, data, 'Media assets retrieved successfully.'));
});

module.exports = {
  uploadSingleMedia,
  uploadMultipleMedia,
  deleteMedia,
  listMedia,
};
