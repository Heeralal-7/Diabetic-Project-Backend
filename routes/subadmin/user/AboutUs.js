// routes/subadminAboutUsRoutes.js
const express = require('express');
const router = express.Router();

const {
  getAboutUsSubadmin,
  updateAboutUsSubadmin,
  uploadImageSubadmin
} = require('../../../controllers/subadmin/user/AboutUs');

const upload = require('../../../middleware/aboutUs');  // same multer middleware
const { subAdminMiddleware } = require('../../../middleware/auth');

// ===============================
//      SUBADMIN ABOUT US ROUTES
// ===============================

// ✅ GET ABOUT US DATA (Subadmin)
router.get('/get', subAdminMiddleware, getAboutUsSubadmin);

// ✅ UPDATE ABOUT US (with all image uploads)
router.put(
  '/update',
  subAdminMiddleware,
  upload.fields([
    { name: 'heroImage', maxCount: 1 },
    { name: 'mainImage', maxCount: 1 },
    { name: 'moreAboutImage', maxCount: 1 },
    { name: 'moreAboutSideImage', maxCount: 1 },
    { name: 'cardImages', maxCount: 10 },    // card images
    { name: 'insuranceLogos', maxCount: 10 } // insurance logos
  ]),
  updateAboutUsSubadmin
);

// ✅ UPLOAD SINGLE IMAGE
router.post(
  '/upload',
  subAdminMiddleware,
  upload.single('image'),
  uploadImageSubadmin
);

module.exports = router;
