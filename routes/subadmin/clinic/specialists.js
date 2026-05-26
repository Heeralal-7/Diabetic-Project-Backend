const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const {
  getSpecialists,
  createSpecialist,
  getSpecialistById,
  updateSpecialist,
  deleteSpecialist,
  getSpecialistStats
} = require('../../../controllers/subadmin/clinic/specialists');
const { subAdminMiddleware } = require('../../../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/specialists/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// ✅ GET ALL SPECIALISTS
router.get('/', subAdminMiddleware, getSpecialists);

// ✅ GET SPECIALISTS STATISTICS
router.get('/stats', subAdminMiddleware, getSpecialistStats);

// ✅ GET SINGLE SPECIALIST
router.get('/:id', subAdminMiddleware, getSpecialistById);

// ✅ CREATE SPECIALIST
router.post('/', subAdminMiddleware, upload.single('specialistImage'), createSpecialist);

// ✅ UPDATE SPECIALIST
router.put('/:id', subAdminMiddleware, upload.single('specialistImage'), updateSpecialist);

// ✅ DELETE SPECIALIST
router.delete('/:id', subAdminMiddleware, deleteSpecialist);

module.exports = router;