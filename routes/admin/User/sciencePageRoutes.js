const express = require('express');
const router = express.Router();
const sciencePageController = require('../../../controllers/admin/User/sciencePage');
const upload = require('../../../middleware/Science');
const { adminMiddleware } = require("../../../middleware/auth");

// Public routes - accessible to both admin and users
router.get('/', sciencePageController.getSciencePage);

// Admin routes - protected
router.put('/', adminMiddleware, sciencePageController.updateSciencePage);
router.post('/add-item', adminMiddleware, sciencePageController.addSciencePageItem);
router.delete('/remove-item', adminMiddleware, sciencePageController.removeSciencePageItem);
router.post('/upload', adminMiddleware, upload.fields([
  { name: 'heroBackgroundImage', maxCount: 1 },
  { name: 'grantBackgroundImage', maxCount: 1 },
  { name: 'researchImages', maxCount: 10 }
]), sciencePageController.uploadScienceImages);

module.exports = router;