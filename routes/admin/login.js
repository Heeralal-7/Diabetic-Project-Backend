const { Router } = require("express");
const multer = require("multer");
const {
  registerAdmin,
  loginAdmin,
  getAdmin,
  updateimage,
  updateAdmin,
  changePassword,
  changevendorStatus,
} = require("../../controllers/admin/login");
const { adminMiddleware } = require("../../middleware/auth");

const router = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/admin/profileImage");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.post("/register", upload.single("image"), registerAdmin);
router.post("/login", loginAdmin);
router.get("/getadmin", adminMiddleware, getAdmin);
router.put("/update" , upload.single("image"), updateimage)
router.patch("/edit" , adminMiddleware , upload.single("image"), updateAdmin)
router.patch("/change" , adminMiddleware , changePassword)
router.patch("/status/:id" , adminMiddleware , changevendorStatus)
module.exports = router;
