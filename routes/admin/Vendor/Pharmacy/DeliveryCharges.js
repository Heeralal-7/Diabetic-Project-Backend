const express = require("express");
const router = express.Router();
const {getDeliveryCharges,updateDeliveryCharges,getDeliveryChargesHistory} = require("../../../../controllers/admin/Vendor/Pharmacy/DeliveryCharges");
const { adminMiddleware } = require("../../../../middleware/auth");
router.get("/get", adminMiddleware, getDeliveryCharges);
router.post("/update", adminMiddleware, updateDeliveryCharges);
router.get("/history", adminMiddleware, getDeliveryChargesHistory);
 
module.exports = router;
 