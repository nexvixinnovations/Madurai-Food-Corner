const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/media.controller');
const memoryUpload = require('../middleware/mediaUpload.middleware');

/**
 * Routes for /api/media
 */

// GET list media assets
router.get('/', mediaController.listMedia);

// POST upload single media file
router.post('/upload', memoryUpload.single('file'), mediaController.uploadSingleMedia);

// POST upload multiple media files
router.post('/uploads', memoryUpload.array('files', 10), mediaController.uploadMultipleMedia);

// DELETE media asset by public_id (wildcard pattern to support slashes in public_id)
router.delete('/*', mediaController.deleteMedia);

module.exports = router;
