 
// routes/admin/Vendor/Food/deliveryCharges.js
const express = require("express");
const { getFoodDeliveryCharges, updateFoodDeliveryCharges, calculateFoodDeliveryCharges } = require("../../../../controllers/admin/Vendor/Food/deliveryCharcharges");
const router = express.Router();
 
const { adminMiddleware } = require("../../../../middleware/auth");
router.get("/get", adminMiddleware, getFoodDeliveryCharges);
router.patch("/update", adminMiddleware, updateFoodDeliveryCharges);
router.post("/calculate", async (req, res) => {
  try {
    const {
      userLocation,
      vendorLocation,
      cartTotal,
      deliverySettings,
      isRapidDelivery
    } = req.body;

    const result = await calculateFoodDeliveryCharges(
      userLocation,
      vendorLocation,
      cartTotal,
      deliverySettings,
      isRapidDelivery
    );

    return res.json({ success: true, data: result });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});


 
module.exports = router;
 