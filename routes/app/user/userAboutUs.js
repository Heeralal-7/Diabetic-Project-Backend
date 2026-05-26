// routes/userAboutUsRoutes.js
const express = require('express');
const router = express.Router();
const aboutUsController = require('../../../controllers/admin/User/AboutUs');

// ✅ GET ABOUT US DATA (Public route)
router.get('/about-us', aboutUsController.getAboutUs);

module.exports = router;