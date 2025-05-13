const { Router } = require("express");
const multer = require("multer");

const { VendorMiddleware } = require("../../../middleware/auth");
const { checkVendorActive } = require("../../../middleware/check");
const {
  updateVendorProfile,
  otpSentToVendor,
  verifyEmailOtp,
  otpSentToPhone,
  verifyPhoneOtp,
  register,
  loginVendor,
  otpForForget,
  changePassword,
  getVendorProfile,
  verifyForgotOtp,
  resetPassword,
  updateUser,
} = require("../../../controllers/app/vandor/signup");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "register") {
      cb(null, "uploads/vendor/registration");
    } else if (file.fieldname === "licence") {
      cb(null, "uploads/vendor/licence");
    } else if (file.fieldname === "image") {
      cb(null, "uploads/vendor/avatar");
    } else {
      cb(new Error("Unknown field"));
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

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
router.post("/email-otp-sent", otpSentToVendor);
router.post("/email-otp-verify", verifyEmailOtp);
router.post("/phone-otp-sent", otpSentToPhone);
router.post("/phone-otp-verify", verifyPhoneOtp);


router.post(
  "/register",
  upload.fields([
    { name: "register", maxCount: 1 },
    { name: "licence", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  register
);

router.post("/login", loginVendor);

router.post("/otpforget", otpForForget);
router.patch("/change-password", VendorMiddleware, changePassword);
router.get("/profile", VendorMiddleware, getVendorProfile);
router.post("/verify-forgot-otp", verifyForgotOtp);
router.put("/update", updateUser)
router.patch(
  "/updateprofile",
  VendorMiddleware,
  upload1.fields([
    { name: "avatar", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  updateVendorProfile
);
router.post("/reset-password", resetPassword);

module.exports = router;
