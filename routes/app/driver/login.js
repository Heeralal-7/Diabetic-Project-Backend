const { Router } = require("express");
const {
  loginDriver,
  getDriverProfile,
  changePassword,
  otpSentToPhone,
  verifyPhoneOtp,
  resetPassword,
  toggleDriverStatus,
  getAssignedOrders,
  // updateOrderStatus,
  startOrder,
  arrivedOrder,
  markAsDelivered,
  rejectOrder,
  orderHistory,
  getAllActiveOrders,
  driverAssignReject
  
} = require("../../../controllers/app/driver/login");
const { driverMiddleware } = require("../../../middleware/auth");
const { middlewere } = require('../../../middleware/auth')

const router = Router();

router.post("/login", loginDriver);
router.get("/profile", driverMiddleware, getDriverProfile);
router.post("/change", driverMiddleware, changePassword);
router.post("/phone-otp-sent", otpSentToPhone);
router.post("/phone-otp-verify", verifyPhoneOtp);
router.post("/reset-password" , resetPassword)

router.post("/toggle-status", driverMiddleware, toggleDriverStatus);
router.get("/assigned-orders", driverMiddleware, getAssignedOrders);
// router.patch("/update-order-status/:orderId", driverMiddleware, updateOrderStatus);
router.patch("/start-order/:orderId", driverMiddleware, startOrder);
router.patch("/arrived-order/:orderId", driverMiddleware, arrivedOrder);
router.patch("/order-delivered/:orderId", driverMiddleware, markAsDelivered);
router.patch("/reject-order/:orderId", driverMiddleware, rejectOrder);
router.get("/order-history", driverMiddleware, orderHistory);
router.get("/getAllActiveOrders",middlewere,getAllActiveOrders);
router.patch("/driver-assign-reject/:orderId", driverMiddleware, driverAssignReject);
module.exports = router;
