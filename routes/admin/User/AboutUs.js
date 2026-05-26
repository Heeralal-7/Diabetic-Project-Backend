// routes/adminAboutUsRoutes.js
const express = require('express');
const router = express.Router();
const aboutUsController = require('../../../controllers/admin/User/AboutUs');
const upload = require('../../../middleware/aboutUs'); // Your file upload middleware
const { adminMiddleware } = require('../../../middleware/auth');

// ✅ GET ABOUT US DATA
router.get('/about-us', adminMiddleware, aboutUsController.getAboutUs);

// ✅ UPDATE ABOUT US - Updated with all image fields
router.put('/about-us', adminMiddleware, upload.fields([
  { name: 'heroImage', maxCount: 1 },
  { name: 'mainImage', maxCount: 1 },
  { name: 'moreAboutImage', maxCount: 1 },
  { name: 'moreAboutSideImage', maxCount: 1 },
  { name: 'cardImages', maxCount: 10 }, // For cards section
  { name: 'insuranceLogos', maxCount: 10 } // For insurance logos
]), aboutUsController.updateAboutUs);

// ✅ UPLOAD SINGLE IMAGE
router.post('/about-us/upload', adminMiddleware, upload.single('image'), aboutUsController.uploadImage);

module.exports = router;