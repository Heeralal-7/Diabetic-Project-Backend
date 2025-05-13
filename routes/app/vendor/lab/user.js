const { Router } = require("express");
const multer = require("multer");
// const {
//   otpSentToVendor,
//   verifyEmailOtp,
//   otpSentToPhone,
//   verifyPhoneOtp,
//   register,
//   loginVendor,
//   otpForForget,
//   getVendorProfile,
//   updateVendorProfile,
//   changePassword,
// } = require("../../../../controllers/app/vandor/lab/signup");
const { VendorMiddleware } = require("../../../../middleware/auth");
const {
  updateVendorProfile,
  otpForForget,
  changePassword,
  getVendorProfile,
} = require("../../../../controllers/app/vandor/lab/user");

const storage1 = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "avatar") {
      cb(null, "uploads/vendor/avatar");
    } else if (file.fieldname === "banner") {
      cb(null, "uploads/vendor/banner");
    } else {
      cb(new Error("Unknown field"));
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload1 = multer({ storage: storage1 });

const router = Router();

router.post("/otpforget", otpForForget);
router.patch("/change-password", VendorMiddleware, changePassword);
router.get("/profile", VendorMiddleware, getVendorProfile);
router.patch(
  "/updateprofile",
  VendorMiddleware,
  upload1.fields([
    { name: "avatar", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  updateVendorProfile
);

module.exports = router;
