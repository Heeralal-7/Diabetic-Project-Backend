// routes/admin/User/footerContent.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
 
const router = express.Router();
 
const {
  // Existing functions
  createContent,
  getContent,
  getPolicy,
  updateContent,
  createPolicy,
  updatePolicy,
 
  // New banks logos functions
  createBanksLogo,
  getBanksLogo,
  updateBanksLogo,
  updateBanksLogoImage,
  deleteBanksLogo,
  deleteAllBanksLogos,
  reorderBanksLogos
} = require("../../../controllers/admin/User/footerContent");
 
const { adminMiddleware } = require("../../../middleware/auth");
 
/* ---- EXPRESS MIDDLEWARE ---- */
router.use(express.urlencoded({ extended: true }));
router.use(express.json());
 
/* ---- MULTER CONFIGURATION ---- */
const uploadDir = "uploads/user/footer";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
 
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    // Use original name with timestamp to avoid conflicts
    const originalName = path.parse(file.originalname).name;
    cb(null, `${originalName}-${uniqueSuffix}${fileExtension}`);
  }
});
 
const fileFilter = (req, file, cb) => {
  // Allowed image types
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
 
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPEG, PNG, GIF, SVG, WebP)!'), false);
  }
};
 
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 20 // Max 20 files
  }
});
 
// Footer content ke liye Multer configuration
const iconUploads = upload.fields([
  { name: "easyIcon", maxCount: 1 },
  { name: "affordableIcon", maxCount: 1 },
  { name: "accessibleIcon", maxCount: 1 }
]);
 
// ✅ Multiple banks logos ke liye - IMPORTANT: field name must match controller
const multipleBanksLogosUpload = upload.array('banksLogos', 20); // Max 20 logos at once
 
// ✅ Single bank logo update ke liye
const singleBanksLogoUpload = upload.single('banksLogo');
 
/* ---- CUSTOM MIDDLEWARE FOR PATH NORMALIZATION ---- */
const normalizeMulterPaths = (req, res, next) => {
  const normalizePath = (pathString) => {
    if (!pathString || typeof pathString !== 'string') {
      return pathString;
    }
    // Replace backslashes with forward slashes
    return pathString.replace(/\\/g, '/');
  };
 
  // Handle array of files (for multiple uploads)
  if (Array.isArray(req.files)) {
    req.files.forEach(file => {
      if (file.path) {
        file.path = normalizePath(file.path);
      }
    });
  }
 
  // Handle single file
  if (req.file && req.file.path) {
    req.file.path = normalizePath(req.file.path);
  }
 
  // Handle files object (for fields upload)
  if (req.files && typeof req.files === 'object') {
    Object.keys(req.files).forEach(fieldName => {
      if (Array.isArray(req.files[fieldName])) {
        req.files[fieldName].forEach(file => {
          if (file.path) {
            file.path = normalizePath(file.path);
          }
        });
      }
    });
  }
 
  next();
};
 
/* ---- CUSTOM MIDDLEWARE FOR CACHE BUSTING ---- */
const addCacheBusting = (req, res, next) => {
  const originalSend = res.send;
 
  res.send = function(data) {
    try {
      if (typeof data === 'string') {
        try {
          const jsonData = JSON.parse(data);
         
          const addCacheBustingToPath = (pathString) => {
            if (!pathString || pathString === "") return pathString;
            // Check if already has query string
            if (pathString.includes('?')) {
              return pathString + '&t=' + Date.now();
            } else {
              return pathString + '?t=' + Date.now();
            }
          };
         
          // Handle different response structures
          if (jsonData.data) {
            // For banks logos array
            if (jsonData.data.banksLogos && Array.isArray(jsonData.data.banksLogos)) {
              jsonData.data.banksLogos = jsonData.data.banksLogos.map(logo => ({
                ...logo,
                url: addCacheBustingToPath(logo.url)
              }));
            }
           
            // For single logo in data object
            if (jsonData.data.logo && jsonData.data.logo.url) {
              jsonData.data.logo.url = addCacheBustingToPath(jsonData.data.logo.url);
            }
           
            // For single image fields
            const imageFields = ['easyIcon', 'affordableIcon', 'accessibleIcon'];
            imageFields.forEach(field => {
              if (jsonData.data[field] && jsonData.data[field] !== "") {
                jsonData.data[field] = addCacheBustingToPath(jsonData.data[field]);
              }
            });
          }
         
          data = JSON.stringify(jsonData);
        } catch (e) {
          // JSON parse error - ignore, send data as is
        }
      }
    } catch (error) {
      console.error("Cache busting error:", error);
    }
   
    originalSend.call(this, data);
  };
 
  next();
};
 
/* ---- ERROR HANDLING MIDDLEWARE ---- */
const handleMulterErrors = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      // Unexpected field, skip it
      return next();
    }
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB per file.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 20 logos can be uploaded at once.'
      });
    }
    if (error.code === 'LIMIT_PART_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many parts in the form.'
      });
    }
  }
 
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'File upload error'
    });
  }
 
  next();
};
 
/* ==================== MULTIPLE BANKS LOGOS ROUTES ==================== */
 
// ✅ CREATE Multiple Banks Logos (Upload multiple logos)
router.post("/create-banks-logo",
  adminMiddleware,
  multipleBanksLogosUpload,
  normalizeMulterPaths,
  handleMulterErrors,
  addCacheBusting,
  createBanksLogo
);
 
// ✅ GET All Banks Logos (Admin)
router.get("/get-banks-logo",
  adminMiddleware,
  addCacheBusting,
  getBanksLogo
);
 
// ✅ GET All Banks Logos (Public)
router.get("/get-banks-logo-user",
  addCacheBusting,
  getBanksLogo
);
 
// ✅ UPDATE Single Bank Logo Details (Name, Order, Status)
router.put("/update-banks-logo/:logoId",
  adminMiddleware,
  updateBanksLogo
);
 
// ✅ UPDATE Single Bank Logo Image (Replace image)
router.put("/update-banks-logo-image/:logoId",
  adminMiddleware,
  singleBanksLogoUpload,
  normalizeMulterPaths,
  handleMulterErrors,
  addCacheBusting,
  updateBanksLogoImage
);
 
// ✅ DELETE Single Bank Logo
router.delete("/delete-banks-logo/:logoId",
  adminMiddleware,
  deleteBanksLogo
);
 
// ✅ DELETE ALL Bank Logos
router.delete("/delete-all-banks-logo",
  adminMiddleware,
  deleteAllBanksLogos
);
 
// ✅ REORDER Bank Logos
router.put("/reorder-banks-logo",
  adminMiddleware,
  reorderBanksLogos
);
 
/* ==================== FOOTER CONTENT ROUTES ==================== */
 
// Create Footer Content
router.post("/create-footer",
  adminMiddleware,
  iconUploads,
  normalizeMulterPaths,
  handleMulterErrors,
  addCacheBusting,
  createContent
);
 
// Get Footer Content (Admin)
router.get("/get-footer",
  adminMiddleware,
  addCacheBusting,
  getContent
);
 
// Get Footer Content (Public)
router.get("/get-footer-user",
  addCacheBusting,
  getContent
);
 
// Update Footer Content
router.put("/update-footer/:id",
  adminMiddleware,
  iconUploads,
  normalizeMulterPaths,
  handleMulterErrors,
  addCacheBusting,
  updateContent
);
 
/* ==================== POLICY ROUTES ==================== */
 
// Create Policy
router.post("/create-policy",
  adminMiddleware,
  createPolicy
);
 
// Get Policy (Admin)
router.get("/get-policy",
  adminMiddleware,
  getPolicy
);
 
// Get Policy (Public)
router.get("/get-policy-user",
  getPolicy
);
 
// Update Policy
router.put("/update-policy",
  adminMiddleware,
  updatePolicy
);
 
module.exports = router;
 