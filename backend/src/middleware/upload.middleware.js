const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/apiError');

// Storage configuration (saving temporarily to uploads directory before Cloudinary transfer)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    let ext = path.extname(file.originalname || '').toLowerCase();
    if (!ext) {
      if (file.mimetype === 'image/png' || file.mimetype === 'image/x-png') ext = '.png';
      else if (file.mimetype === 'image/webp') ext = '.webp';
      else ext = '.jpg';
    }
    cb(null, `food-${uniqueSuffix}${ext}`);
  },
});

// File filter restricting to JPG, JPEG, PNG, WEBP
const fileFilter = (req, file, cb) => {
  // Log diagnostic file details during development
  console.log('📸 [Upload Middleware] File Received:', {
    fieldname: file?.fieldname,
    originalname: file?.originalname,
    mimetype: file?.mimetype,
    size: file?.size
  });

  const allowedMimetypes = [
    'image/jpeg',
    'image/jpg',
    'image/pjpeg',
    'image/png',
    'image/x-png',
    'image/webp'
  ];

  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  const isMimeValid = allowedMimetypes.includes(file.mimetype?.toLowerCase());
  const isExtValid = allowedExtensions.includes(ext);

  // Accept if valid mimetype OR valid extension, or wildcard image type
  if (isMimeValid || isExtValid || file.mimetype?.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP.'), false);
  }
};

// Multer upload middleware configuration (10MB limit)
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 Megabytes
  },
  fileFilter,
});

module.exports = upload;
