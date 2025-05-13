const { Router } = require("express");
const {
  loginDriver,
  getDriverProfile,
  changePassword,
  otpSentToPhone,
  verifyPhoneOtp,
  resetPassword,
  toggleDriverStatus,
} = require("../../../controllers/app/driver/login");
const { driverMiddleware } = require("../../../middleware/auth");

const router = Router();

router.post("/login", loginDriver);
router.get("/profile", driverMiddleware, getDriverProfile);
router.post("/change", driverMiddleware, changePassword);
router.post("/phone-otp-sent", otpSentToPhone);
router.post("/phone-otp-verify", verifyPhoneOtp);
router.post("/reset-password" , resetPassword)

router.post("/toggle-status", driverMiddleware, toggleDriverStatus);

module.exports = router;
