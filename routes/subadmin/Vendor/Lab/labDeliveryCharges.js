const express = require("express");
const { getLabDeliveryCharges, updateLabDeliveryCharges } = require("../../../../controllers/subadmin/Vendor/Lab/labDeliveryCharges");
const router = express.Router();
 
const { subAdminMiddleware } = require("../../../../middleware/auth");

router.get("/get", subAdminMiddleware, getLabDeliveryCharges);
router.patch("/update", subAdminMiddleware, updateLabDeliveryCharges);

module.exports = router;