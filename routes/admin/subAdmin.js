const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const {
  createSubAdmin,
  getAllSubAdmins,
  getSubAdminById,
  updateSubAdminPermissions,
  updateSubAdminStatus,
  deleteSubAdmin,
  loginSubAdmin
} = require("../../controllers/admin/subAdmin");

const { adminMiddleware } = require("../../middleware/auth");

// ==========================
// ✅ MULTER CONFIGURATION
// ==========================

// Folder where images will be saved
const storagePath = path.join(__dirname, "../../uploads/subAdmins");

// Ensure upload folder exists
if (!fs.existsSync(storagePath)) {
  fs.mkdirSync(storagePath, { recursive: true });
}

// Multer disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, storagePath);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});

// Allow only image files
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only .jpg, .jpeg, and .png files are allowed"));
  }
};

// Initialize multer
const upload = multer({ storage, fileFilter });

// ==========================
// ✅ ROUTES
// ==========================

// Admin-only routes
router.post("/create", adminMiddleware, upload.single("image"), createSubAdmin);
router.get("/all", adminMiddleware, getAllSubAdmins);
router.get("/:id", adminMiddleware, getSubAdminById);
router.patch("/permissions/:id", adminMiddleware, updateSubAdminPermissions);
router.patch("/status/:id", adminMiddleware, updateSubAdminStatus);
router.delete("/:id", adminMiddleware, deleteSubAdmin);

// Sub-admin login (public)
router.post("/login", loginSubAdmin);

module.exports = router;
