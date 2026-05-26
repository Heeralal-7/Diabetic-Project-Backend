const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
 
// Controller Import
// NOTE: Apna path check kar lena
const controller = require("../../../controllers/admin/User/CareProgramPageEdit");
const { adminMiddleware } = require("../../../middleware/auth");
 
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
 
/* ==================== ROUTES ==================== */
 
// Public
router.get("/get", controller.getPublishedContent);
 
// Admin - Content
router.get("/get-all", adminMiddleware, controller.getAllContent);
router.post("/admin/create", adminMiddleware, controller.createContent);
 
// *** MAIN UPDATE (With Images & Data) ***
router.put("/admin/update", adminMiddleware, mainUpdateUpload, normalizeMulterPaths, handleMulterErrors, controller.updateContent);
 
router.patch("/admin/update-section", adminMiddleware, controller.updateSection);
router.put("/admin/toggle-publish", adminMiddleware, controller.togglePublish);
 
// Admin - Single Uploads
router.post("/admin/upload/banner", adminMiddleware, singleBannerUpload, normalizeMulterPaths, handleMulterErrors, controller.uploadBannerImage);
router.post("/admin/upload/doctor", adminMiddleware, singleDoctorUpload, normalizeMulterPaths, handleMulterErrors, controller.uploadDoctorImage);
router.post("/admin/upload/feature", adminMiddleware, singleFeatureUpload, normalizeMulterPaths, handleMulterErrors, controller.uploadFeatureImage);
router.post("/admin/upload/side-image", adminMiddleware, singleSideUpload, normalizeMulterPaths, handleMulterErrors, controller.uploadSideImage);
 
// Admin - Multiple Uploads
router.post("/admin/upload/multiple", adminMiddleware, multipleImagesUpload, normalizeMulterPaths, handleMulterErrors, controller.uploadMultipleImages);
router.post("/admin/upload/doctors/multiple", adminMiddleware, multipleDoctorsUpload, normalizeMulterPaths, handleMulterErrors, controller.uploadMultipleDoctors);
router.post("/admin/upload/features/multiple", adminMiddleware, multipleFeaturesUpload, normalizeMulterPaths, handleMulterErrors, controller.uploadMultipleFeatures);
 
// Admin - Updates with Image (Existing Items)
router.post("/admin/doctor/update", adminMiddleware, singleImageUpload, normalizeMulterPaths, handleMulterErrors, controller.updateDoctorWithImage);
router.post("/admin/feature/update", adminMiddleware, singleImageUpload, normalizeMulterPaths, handleMulterErrors, controller.updateFeatureWithImage);
router.post("/admin/banner/update", adminMiddleware, singleImageUpload, normalizeMulterPaths, handleMulterErrors, controller.updateBannerWithImage);
 
// Admin - Mixed
router.post("/admin/upload/mixed", adminMiddleware, mixedUpload, normalizeMulterPaths, handleMulterErrors, controller.handleMixedUpload);
 
// Admin - Management
router.delete("/admin/image", adminMiddleware, controller.deleteImage);
router.get("/admin/images", adminMiddleware, controller.getAllImages);
router.get("/admin/images/:type", adminMiddleware, controller.getImagesByType);
 
// Admin - Add Items (Create New)
// addDoctor pe image upload lagaya hai taaki naya doctor photo ke sath add ho sake
router.post("/admin/add-doctor", adminMiddleware, singleImageUpload, normalizeMulterPaths, handleMulterErrors, controller.addDoctorToSlider);
router.post("/admin/add-feature", adminMiddleware, singleImageUpload, normalizeMulterPaths, handleMulterErrors, controller.addProgramFeature);
router.post("/admin/add-stat", adminMiddleware, controller.addStat); // Stats me image nahi chahiye
 
// Admin - Delete Items
router.delete("/admin/feature/:featureId", adminMiddleware, controller.deleteFeature);
router.delete("/admin/doctor/:doctorId", adminMiddleware, controller.deleteDoctor);
router.delete("/admin/stat/:statId", adminMiddleware, controller.deleteStat);
 
// Admin - Reorder
router.put("/admin/reorder/features", adminMiddleware, controller.reorderFeatures);
router.put("/admin/reorder/doctors", adminMiddleware, controller.reorderDoctors);
router.put("/admin/reorder/stats", adminMiddleware, controller.reorderStats);
 
// Admin - Get Specific
router.get("/admin/feature/:featureId", adminMiddleware, controller.getFeatureById);
router.get("/admin/doctor/:doctorId", adminMiddleware, controller.getDoctorById);
router.get("/admin/stat/:statId", adminMiddleware, controller.getStatById);
 
module.exports = router;
 