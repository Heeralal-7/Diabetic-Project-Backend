 
// routes/admin/Vendor/Food/deliveryCharges.js
const express = require("express");
const { getFoodDeliveryCharges } = require("../../../../controllers/admin/Vendor/Food/deliveryCharcharges");
const router = express.Router();
 
const { middlewere } = require("../../../../middleware/auth");
router.get("/get", middlewere, getFoodDeliveryCharges);
 
 
module.exports = router;
 