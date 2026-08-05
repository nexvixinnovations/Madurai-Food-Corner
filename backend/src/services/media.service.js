const { cloudinary } = require('../config/cloudinary');
const ApiError = require('../utils/apiError');
const { validateFolder, validatePublicId } = require('../validators/media.validator');

class MediaService {
  /**
   * Helper to format transformed URLs
   */
  generateTransformedUrls(result) {
    const secureUrl = result.secure_url;
    const publicId = result.public_id;

    // Check if uploaded file is image or document
    const isImage = ['jpg', 'jpeg', 'png', 'webp', 'svg'].includes((result.format || '').toLowerCase());

    let optimizedUrl = secureUrl;
    let thumbnailUrl = secureUrl;
    let webpUrl = secureUrl;

    if (isImage) {
      optimizedUrl = cloudinary.url(publicId, { fetch_format: 'auto', quality: 'auto', secure: true });
      thumbnailUrl = cloudinary.url(publicId, { crop: 'thumb', width: 200, height: 200, fetch_format: 'auto', quality: 'auto', secure: true });
      webpUrl = cloudinary.url(publicId, { fetch_format: 'webp', quality: 'auto', secure: true });
    }

    return {
      secure_url: secureUrl,
      public_id: publicId,
      width: result.width || null,
      height: result.height || null,
      format: result.format || null,
      bytes: result.bytes || null,
      folder: result.folder || null,
      optimized_url: optimizedUrl,
      thumbnail_url: thumbnailUrl,
      webp_url: webpUrl,
    };
  }

  /**
   * Stream a single file buffer to Cloudinary
   */
  async uploadSingle(file, folderParam = 'general') {
    if (!file || !file.buffer) {
      throw new ApiError(400, 'No file buffer provided for upload.');
    }

    const folderPath = validateFolder(folderParam);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folderPath,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Stream Upload Error:', error);
            return reject(new ApiError(500, `Cloudinary Upload Failed: ${error.message}`));
          }
          resolve(this.generateTransformedUrls(result));
        }
      );

      uploadStream.end(file.buffer);
    });
  }

  /**
   * Stream multiple files in parallel
   */
  async uploadMultiple(files, folderParam = 'general') {
    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new ApiError(400, 'No file buffers provided for upload.');
    }

    const uploadPromises = files.map((file) => this.uploadSingle(file, folderParam));
    return await Promise.all(uploadPromises);
  }

  /**
   * Delete asset from Cloudinary by public_id
   */
  async delete(publicId) {
    validatePublicId(publicId);

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      if (result.result !== 'ok' && result.result !== 'not found') {
        throw new ApiError(400, `Failed to delete media with public_id '${publicId}'.`);
      }
      return { success: true, message: `Media '${publicId}' deleted successfully.` };
    } catch (err) {
      console.error('Cloudinary Delete Error:', err.message);
      throw new ApiError(500, `Cloudinary Delete Failed: ${err.message}`);
    }
  }

  /**
   * Replace existing media asset (delete old asset and upload new file)
   */
  async replace(oldPublicId, file, folderParam = 'general') {
    if (oldPublicId) {
      try {
        await this.delete(oldPublicId);
      } catch (e) {
        console.warn('Previous asset deletion skipped:', e.message);
      }
    }
    return await this.uploadSingle(file, folderParam);
  }

  /**
   * Helper to generate optimized URL on demand
   */
  generateOptimizedUrl(publicId) {
    validatePublicId(publicId);
    return cloudinary.url(publicId, { fetch_format: 'auto', quality: 'auto', secure: true });
  }

  /**
   * Helper to generate thumbnail URL on demand
   */
  generateThumbnail(publicId) {
    validatePublicId(publicId);
    return cloudinary.url(publicId, { crop: 'thumb', width: 200, height: 200, fetch_format: 'auto', quality: 'auto', secure: true });
  }

  /**
   * List uploaded assets from Cloudinary using Search API / Resources API
   */
  async listMedia({ folder = 'foods', page = 1, limit = 20 }) {
    const folderPath = validateFolder(folder);
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;

    try {
      const resources = await cloudinary.api.resources({
        type: 'upload',
        prefix: folderPath,
        max_results: limitNum,
      });

      const mediaList = (resources.resources || []).map((res) => this.generateTransformedUrls(res));

      return {
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: mediaList.length,
        },
        media: mediaList,
      };
    } catch (err) {
      console.error('Cloudinary List Media Error:', err.message);
      return {
        pagination: { page: pageNum, limit: limitNum, total: 0 },
        media: [],
      };
    }
  }
}

module.exports = new MediaService();
