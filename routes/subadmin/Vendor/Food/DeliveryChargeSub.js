const express = require("express");
const { 
  getFoodDeliveryCharges, 
  updateFoodDeliveryCharges, 
  getFoodDeliveryChargesHistory 
} = require(".././../../../controllers/subadmin/Vendor/Food/DeliveryChargesSub");

const router = express.Router();
const { subAdminMiddleware } = require('../../../../middleware/auth');

// ✅ GET CURRENT FOOD DELIVERY CHARGES
router.get("/get", subAdminMiddleware, getFoodDeliveryCharges);

// ✅ UPDATE FOOD DELIVERY CHARGES
router.patch("/update", subAdminMiddleware, updateFoodDeliveryCharges);

// ✅ GET FOOD DELIVERY CHARGES HISTORY
router.get("/history", subAdminMiddleware, getFoodDeliveryChargesHistory);

module.exports = router;