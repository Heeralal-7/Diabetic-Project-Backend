const express = require("express");
const fs = require("fs");
const {
  getSubAdminDashboardStats,
  getRecentRegistrations,
  getVerificationRequests,
  getSubAdminProfile,
  updateSubAdminProfile,
  changeSubAdminPassword,
  getSubAdminActivities,
  getSubAdminMonthlyStats
} = require("../../controllers/subadmin/subAdminDashboard");
const { 
  subAdminMiddleware,
  checkPermission 
} = require('../../middleware/auth');
const multer = require('multer');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = "uploads/subadmin/profileImage";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for profile image
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});
// ✅ SUB-ADMIN DASHBOARD ROUTES

// Get dashboard statistics
router.get("/dashboard/stats", 
  subAdminMiddleware,
  getSubAdminDashboardStats
);

// Get recent registrations
router.get("/dashboard/recent", 
  subAdminMiddleware,
  getRecentRegistrations
);

// Get verification requests
router.get("/dashboard/verification-requests", 
  subAdminMiddleware,
  getVerificationRequests
);

// Get sub-admin profile
router.get("/profile", 
  subAdminMiddleware,
  getSubAdminProfile
);

// Update sub-admin profile
router.patch("/profile", 
  subAdminMiddleware,
  upload.single("image"),
  updateSubAdminProfile
);

// Change sub-admin password
router.patch("/change-password", 
  subAdminMiddleware,
  changeSubAdminPassword
);

// Get activities
router.get("/activities", 
  subAdminMiddleware,
  getSubAdminActivities
);
// Get monthly stats
router.get("/dashboard/monthly-stats", 
  subAdminMiddleware,
  getSubAdminMonthlyStats
);

module.exports = router;