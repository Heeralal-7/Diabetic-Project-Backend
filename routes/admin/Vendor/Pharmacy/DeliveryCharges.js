const express = require("express");
const router = express.Router();
const {getDeliveryCharges,updateDeliveryCharges,getDeliveryChargesHistory} = require("../../../../controllers/admin/Vendor/Pharmacy/DeliveryCharges");
const { adminMiddleware } = require("../../../../middleware/auth");
router.get("/get", adminMiddleware, getDeliveryCharges);
router.patch("/update", adminMiddleware, (req, res, next) => {
  console.log('PATCH /admin-delivery-charges/update route hit');
  console.log('Request body:', req.body);
  next();
}, updateDeliveryCharges);
router.get("/history", adminMiddleware, getDeliveryChargesHistory);
  
module.exports = router;
 