const { Router } = require("express");
const { adminMiddleware } = require("../../../middleware/auth");
const {
  blog,
  createsubheading,
  getBlog,
  searchUserBlog,
  getParticularBlog,
  deleteBlog,
  updateBlog,
  updateSubheading,
  getSubheading,
  deleteSubheading,
} = require("../../../controllers/admin/User/blog");
const multer = require("multer");

const route = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/admin/blogimage");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

route.post("/create-blog", upload.single("blogimage"), adminMiddleware, blog);
route.post("/add-subheading", adminMiddleware, createsubheading);
route.get("/getadminblog", adminMiddleware, getBlog);
route.get("/search-blog", adminMiddleware, searchUserBlog);
route.get("/get-blog/:id", adminMiddleware, getParticularBlog);
route.delete("/delete-blog/:id", adminMiddleware, deleteBlog);
route.patch(
  "/update-blog/:id",
  upload.single("blogimage"),
  adminMiddleware,
  updateBlog
);
route.patch("/update-subheading/:id", adminMiddleware, updateSubheading);
route.get("/get/:id", adminMiddleware, getSubheading);
route.delete("/remove/:mainFormId/:subheadingId", adminMiddleware, deleteSubheading);
module.exports = route;
