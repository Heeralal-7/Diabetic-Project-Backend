const { Router } = require("express");
const { adminMiddleware } = require("../../../middleware/auth");
const {
  createVideo,
  getVideo,
  upadateVideo,
  addYoutubeLink,
  getYoutubeLinks,
  deleteYoutubeLink,
  updateYoutubeLink
} = require("../../../controllers/admin/User/video");
const multer = require("multer");
 
const route = Router();
 
// ==================== MULTER CONFIGURATION (EXISTING - UNCHANGED) ====================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname.startsWith("video")) {
      cb(null, "uploads/admin/user/video");
    } else if (file.fieldname.startsWith("thumbnail")) {
      cb(null, "uploads/admin/user/thumbnail");
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
 
const storage1 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/admin/user/video");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
 
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 80 * 1024 * 1024, // 20 MB in bytes
  },
});
 
const upload1 = multer({
  storage: storage1,
  limits: {
    fileSize: 80 * 1024 * 1024, // 80 MB in bytes
  },
  fileFilter: (req, file, cb) => {
    const fileSize = parseInt(req.headers["content-length"]);
    if (fileSize > 80 * 1024 * 1024) {
      return cb(new Error("Total file size should not exceed 80 MB"), false);
    }
    cb(null, true);
  },
});
 
// ==================== EXISTING ROUTES (UNCHANGED) ====================
route.post(
  "/video",
  adminMiddleware,
  upload.fields([
    { name: "video1", maxCount: 1 },
    { name: "thumbnail1", maxCount: 1 },
    { name: "video2", maxCount: 1 },
    { name: "thumbnail2", maxCount: 1 },
    { name: "video3", maxCount: 1 },
    { name: "thumbnail3", maxCount: 1 },
    { name: "video4", maxCount: 1 },
    { name: "thumbnail4", maxCount: 1 },
    { name: "video5", maxCount: 1 },
    { name: "thumbnail5", maxCount: 1 },
    { name: "video6", maxCount: 1 },
    { name: "thumbnail6", maxCount: 1 },
  ]),
  createVideo
);
 
route.patch(
  "/videoupdate/:id",
  adminMiddleware,
  upload1.fields([
    { name: "video1", maxCount: 1 },
    { name: "video2", maxCount: 1 },
    { name: "video3", maxCount: 1 },
    { name: "video4", maxCount: 1 },
    { name: "video5", maxCount: 1 },
    { name: "video6", maxCount: 1 },
  ]),
  upadateVideo
);
 
route.get("/getVideo", getVideo);
 
// ==================== YOUTUBE ROUTES (NEW) ====================
 
// Add YouTube link
// POST: /upload-videos/add-youtube-link
route.post("/add-youtube-link", adminMiddleware, addYoutubeLink);
 
// Get all YouTube links
// GET: /upload-videos/get-youtube-links
route.get("/get-youtube-links", getYoutubeLinks);
 
// Update YouTube link
// PUT: /upload-videos/update-youtube-link/:linkId
route.put("/update-youtube-link/:linkId", adminMiddleware, updateYoutubeLink);
 
// Delete YouTube link
// DELETE: /upload-videos/delete-youtube-link/:linkId
route.delete("/delete-youtube-link/:linkId", adminMiddleware, deleteYoutubeLink);
 
module.exports = route;
 