const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const brandController = require('../../../controllers/subadmin/user/UploadBrandImagesPharmacy');
const {  subAdminMiddleware } = require('../../../middleware/auth');
 
// --- MULTER CONFIGURATION ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Fixed: Exactly the path you want
    const uploadDir = 'uploads/user/brandImage/';
   
    console.log('Setting upload directory to:', uploadDir);
   
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('Directory created:', uploadDir);
    }
   
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'brand-' + uniqueSuffix + path.extname(file.originalname);
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});
 
const fileFilter = (req, file, cb) => {
  console.log('File received:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype
  });
 
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
 
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, GIF images are allowed!'), false);
  }
};
 
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
  fileFilter: fileFilter
});
 
// Multer error handler
const multerErrorHandler = (err, req, res, next) => {
  if (err) {
    console.log('Multer Error:', err.message);
   
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size is too large. Maximum 5MB allowed.'
        });
      }
      if (err.code === 'Unexpected field') {
        return res.status(400).json({
          success: false,
          message: `Unexpected field. Use 'brandImage' as field name in Postman.`
        });
      }
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};
 
// Log middleware
const logUpload = (req, res, next) => {
  if (req.file) {
    console.log('File uploaded:', {
      filename: req.file.filename,
      path: req.file.path,
      size: (req.file.size / 1024).toFixed(2) + 'KB'
    });
  }
  next();
};
 
// --- ROUTES ---
 
// Create brand
router.post('/sub/add',
  upload.single('brandImage'),
  multerErrorHandler,
  logUpload,
  subAdminMiddleware,
  brandController.createBrand
);
 
// Get all brands
router.get('/sub/get-all', subAdminMiddleware, brandController.getBrands);
 
 
// Update brand
router.put('/sub/update/:id',
  upload.single('brandImage'),
  multerErrorHandler,
  logUpload,
  subAdminMiddleware,
  brandController.updateBrand
);
 
// Delete brand
router.delete('/sub/delete/:id',subAdminMiddleware, brandController.deleteBrand);
 
module.exports = router;
 