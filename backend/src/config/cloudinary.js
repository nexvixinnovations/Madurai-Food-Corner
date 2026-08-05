const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

/**
 * Upload local file to Cloudinary and clean up temporary file
 * @param {string} filePath - Path to local uploaded file
 * @param {string} folder - Optional Cloudinary folder
 * @returns {Promise<string>} - Cloudinary secure image URL
 */
const uploadToCloudinary = async (filePath, folder = 'madurai_food_corner/foods') => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your_cloudinary_cloud_name') {
    const path = require('path');
    const fileName = path.basename(filePath);
    return `/uploads/${fileName}`;
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'image',
    });

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error.message);
    const path = require('path');
    const fileName = path.basename(filePath);
    return `/uploads/${fileName}`;
  }
};

/**
 * Extract public ID from Cloudinary URL and delete image asset
 * @param {string} imageUrl - Full Cloudinary image URL
 * @returns {Promise<object>} - Cloudinary deletion response
 */
const deleteFromCloudinary = async (imageUrl) => {
  if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
    return null;
  }

  try {
    // Extract public_id from Cloudinary URL format:
    // https://res.cloudinary.com/<cloud>/image/upload/v<version>/<folder>/<public_id>.<ext>
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');

    if (uploadIndex === -1) return null;

    // Everything after /upload/v12345/ or /upload/
    const pathParts = urlParts.slice(uploadIndex + 1);
    
    // Skip version tag if present (starts with 'v' followed by digits)
    if (pathParts[0] && /^v\d+$/.test(pathParts[0])) {
      pathParts.shift();
    }

    const fileWithExt = pathParts.join('/');
    const publicId = fileWithExt.substring(0, fileWithExt.lastIndexOf('.'));

    if (publicId) {
      return await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error('Failed to delete image from Cloudinary:', error.message);
  }

  return null;
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
};
