const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
 
// Controller Import
const controller = require("../../../controllers/subadmin/user/careProgramEdit");
const { subAdminMiddleware } = require("../../../middleware/auth");
 
/* ---- EXPRESS MIDDLEWARE ---- */
router.use(express.urlencoded({ extended: true }));
router.use(express.json());
 
/* ---- MULTER CONFIGURATION ---- */
const createUploadDirectories = () => {
  const directories = [
    "uploads/care-program/",
    "uploads/care-program/doctors/",
    "uploads/care-program/features/",
    "uploads/care-program/banner/",
    "uploads/care-program/side-images/"
  ];
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
};
createUploadDirectories();
 
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir = "uploads/care-program/";
    if (file.fieldname === 'bannerImage') uploadDir += "banner/";
    else if (file.fieldname.includes('doctor')) uploadDir += "doctors/";
    else if (file.fieldname.includes('feature')) uploadDir += "features/";
    else if (file.fieldname === 'sideImage') uploadDir += "side-images/";
   
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalName = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    cb(null, `${originalName}-${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  }
});
 
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only image files are allowed!'), false);
};
 
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});
 
// --- Upload Configs ---
const singleBannerUpload = upload.single('bannerImage');
const singleDoctorUpload = upload.single('doctorImage');
const singleFeatureUpload = upload.single('featureImage');
const singleSideUpload = upload.single('sideImage');
const singleImageUpload = upload.single('image');
 
const multipleImagesUpload = upload.array('images', 20);
const multipleDoctorsUpload = upload.array('doctorImages', 20);
const multipleFeaturesUpload = upload.array('featureImages', 20);
 
// Main Update Middleware
const mainUpdateUpload = upload.fields([
  { name: 'bannerImage', maxCount: 1 },
  { name: 'sideImage', maxCount: 1 },
  { name: 'doctorImages', maxCount: 10 },
  { name: 'featureImages', maxCount: 10 }
]);
 
const mixedUpload = upload.fields([
  { name: 'bannerImage', maxCount: 1 },
  { name: 'doctorImages', maxCount: 10 },
  { name: 'featureImages', maxCount: 10 },
  { name: 'sideImage', maxCount: 1 }
]);
 
/* ---- CUSTOM MIDDLEWARE ---- */
const normalizeMulterPaths = (req, res, next) => {
  const normalize = (p) => p ? p.replace(/\\/g, '/') : p;
 
  if (req.file && req.file.path) req.file.path = normalize(req.file.path);
  if (Array.isArray(req.files)) req.files.forEach(f => { if(f.path) f.path = normalize(f.path); });
  if (req.files && typeof req.files === 'object') {
    Object.values(req.files).flat().forEach(f => { if(f.path) f.path = normalize(f.path); });
  }
  next();
};
 
const handleMulterErrors = (err, req, res, next) => {
  if (err) return res.status(400).json({ success: false, message: err.message || 'Upload error' });
  next();
};
 
/* ==================== SUB-ADMIN ROUTES ==================== */
 
// Get published content (Public)
router.get("/sub/get", controller.getPublishedContent);
 
// Sub-Admin - Get all content
router.get("/sub/get-all", subAdminMiddleware, controller.getAllContent);
router.post("/sub/create", subAdminMiddleware, controller.createContent);
 
// *** MAIN UPDATE (With Images & Data) ***
router.put("/sub/update", subAdminMiddleware, mainUpdateUpload, normalizeMulterPaths, handleMulterErrors, controller.updateContent);
 
router.patch("/sub/update-section", subAdminMiddleware, controller.updateSection);
router.put("/sub/toggle-publish", subAdminMiddleware, controller.togglePublish);
 
// Sub-Admin - Single Uploads
router.post("/sub/upload/banner", subAdminMiddleware, singleBannerUpload, normalizeMulterPaths, handleMulterErrors, controller.uploadBannerImage);
router.post("/sub/upload/doctor", subAdminMiddleware, singleDoctorUpload, normalizeMulterPaths, handleMulterErrors, controller.uploadDoctorImage);
router.post("/sub/upload/feature", subAdminMiddleware, singleFeatureUpload, normalizeMulterPaths, handleMulterErrors, controller.uploadFeatureImage);
router.post("/sub/upload/side-image", subAdminMiddleware, singleSideUpload, normalizeMulterPaths, handleMulterErrors, controller.uploadSideImage);
 
// Sub-Admin - Multiple Uploads
router.post("/sub/upload/multiple", subAdminMiddleware, multipleImagesUpload, normalizeMulterPaths, handleMulterErrors, controller.uploadMultipleImages);
router.post("/sub/upload/doctors/multiple", subAdminMiddleware, multipleDoctorsUpload, normalizeMulterPaths, handleMulterErrors, controller.uploadMultipleDoctors);
router.post("/sub/upload/features/multiple", subAdminMiddleware, multipleFeaturesUpload, normalizeMulterPaths, handleMulterErrors, controller.uploadMultipleFeatures);
 
// Sub-Admin - Updates with Image (Existing Items)
router.post("/sub/doctor/update", subAdminMiddleware, singleImageUpload, normalizeMulterPaths, handleMulterErrors, controller.updateDoctorWithImage);
router.post("/sub/feature/update", subAdminMiddleware, singleImageUpload, normalizeMulterPaths, handleMulterErrors, controller.updateFeatureWithImage);
router.post("/sub/banner/update", subAdminMiddleware, singleImageUpload, normalizeMulterPaths, handleMulterErrors, controller.updateBannerWithImage);
 
// Sub-Admin - Mixed
router.post("/sub/upload/mixed", subAdminMiddleware, mixedUpload, normalizeMulterPaths, handleMulterErrors, controller.handleMixedUpload);
 
// Sub-Admin - Management
router.delete("/sub/image", subAdminMiddleware, controller.deleteImage);
router.get("/sub/images", subAdminMiddleware, controller.getAllImages);
router.get("/sub/images/:type", subAdminMiddleware, controller.getImagesByType);
 
// Sub-Admin - Add Items (Create New)
router.post("/sub/add-doctor", subAdminMiddleware, singleImageUpload, normalizeMulterPaths, handleMulterErrors, controller.addDoctorToSlider);
router.post("/sub/add-feature", subAdminMiddleware, singleImageUpload, normalizeMulterPaths, handleMulterErrors, controller.addProgramFeature);
router.post("/sub/add-stat", subAdminMiddleware, controller.addStat);
 
// Sub-Admin - Delete Items
router.delete("/sub/feature/:featureId", subAdminMiddleware, controller.deleteFeature);
router.delete("/sub/doctor/:doctorId", subAdminMiddleware, controller.deleteDoctor);
router.delete("/sub/stat/:statId", subAdminMiddleware, controller.deleteStat);
 
// Sub-Admin - Reorder
router.put("/sub/reorder/features", subAdminMiddleware, controller.reorderFeatures);
router.put("/sub/reorder/doctors", subAdminMiddleware, controller.reorderDoctors);
router.put("/sub/reorder/stats", subAdminMiddleware, controller.reorderStats);
 
// Sub-Admin - Get Specific
router.get("/sub/feature/:featureId", subAdminMiddleware, controller.getFeatureById);
router.get("/sub/doctor/:doctorId", subAdminMiddleware, controller.getDoctorById);
router.get("/sub/stat/:statId", subAdminMiddleware, controller.getStatById);
 
module.exports = router;
 