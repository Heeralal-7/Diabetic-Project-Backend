const { Router } = require("express");
const multer = require("multer");
const { middlewere } = require("../../../../middleware/auth");
const {
  getblog,
  filterBlog,
  searchUserBlog,
} = require("../../../../controllers/app/user/blogs/blog");



const router = Router();

router.get("/", middlewere, getblog);
router.get("/filterBlog", filterBlog);
router.get("/user-blog", middlewere, searchUserBlog);


module.exports = router;
