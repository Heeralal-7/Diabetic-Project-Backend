const express = require("express");
const router = express.Router();
const multer = require("multer");
const { subAdminMiddleware } = require("../../../middleware/auth");
const blogController = require("../../../controllers/subadmin/user/Blogs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/admin/blogimage"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({ storage });

// Create blog
router.post(
  "/create-blog",
  subAdminMiddleware,
  upload.single("blogimage"),
  blogController.createBlogSubadmin
);

// Add subheading
router.post(
  "/add-subheading",
  subAdminMiddleware,
  blogController.createSubheadingSubadmin
);

// Get all blogs
router.get(
  "/getadminblog",
  subAdminMiddleware,
  blogController.getBlogSubadmin
);

// Search blog
router.get(
  "/search-blog",
  subAdminMiddleware,
  blogController.searchBlogSubadmin
);

// Get particular blog
router.get(
  "/get-blog/:id",
  subAdminMiddleware,
  blogController.getParticularBlogSubadmin
);

// Delete blog
router.delete(
  "/delete-blog/:id",
  subAdminMiddleware,
  blogController.deleteBlogSubadmin
);

// Update blog
router.patch(
  "/update-blog/:id",
  subAdminMiddleware,
  upload.single("blogimage"),
  blogController.updateBlogSubadmin
);

// Update subheading
router.patch(
  "/update-subheading/:id",
  subAdminMiddleware,
  blogController.updateSubheadingSubadmin
);

// Get subheading list
router.get(
  "/get/:id",
  subAdminMiddleware,
  blogController.getSubheadingSubadmin
);

// Delete subheading
router.delete(
  "/remove/:mainFormId/:subheadingId",
  subAdminMiddleware,
  blogController.deleteSubheadingSubadmin
);

module.exports = router;
