const { Router } = require("express");
const multer = require("multer");
const { driverMiddleware } = require("../../../middleware/auth");
const {
  addMembersInAppointment,
  getVendorTest,
  getpackages,
  getmember,
  createprice,
} = require("../../../controllers/app/driver/AddMembers");

const router = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/vendor/driver/image");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.post(
  "/member",
  upload.single("image"),
  driverMiddleware,
  addMembersInAppointment
);

router.get("/getVendorTest",getVendorTest)
router.get("/getpackages",getpackages)
router.get("/getmember",getmember)
router.post("/createprice",createprice)
module.exports = router;
