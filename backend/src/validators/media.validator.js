const ApiError = require('../utils/apiError');

/**
 * Validate Folder parameter
 */
const ALLOWED_FOLDERS = ['foods', 'combos', 'offers', 'settings', 'documents', 'general'];

const validateFolder = (folder) => {
  if (!folder) return 'restaurant/general';

  const cleanFolder = folder.toLowerCase().trim();
  if (ALLOWED_FOLDERS.includes(cleanFolder)) {
    return `restaurant/${cleanFolder}`;
  }

  // Allow custom subfolders under restaurant prefix
  return `restaurant/${cleanFolder}`;
};

/**
 * Validate Public ID parameter
 */
const validatePublicId = (publicId) => {
  if (!publicId || typeof publicId !== 'string' || !publicId.trim()) {
    throw new ApiError(400, 'Cloudinary public_id parameter is required.');
  }
};

module.exports = {
  ALLOWED_FOLDERS,
  validateFolder,
  validatePublicId,
};
