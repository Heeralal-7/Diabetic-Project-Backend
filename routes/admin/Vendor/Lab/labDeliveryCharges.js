const express = require("express");
const {
  getLabDeliveryCharges,
  updateLabDeliveryCharges,
  calculateLabDeliveryCharges
} = require("../../../../controllers/admin/Vendor/Lab/labDeliveryCharges");

const router = express.Router();
const { adminMiddleware } = require("../../../../middleware/auth");
const { middlewere } = require("../../../../middleware/auth");

router.get("/get", adminMiddleware, getLabDeliveryCharges);
router.patch("/update", adminMiddleware, updateLabDeliveryCharges);


// user app route 
router.get("/getforUser", middlewere, getLabDeliveryCharges); // for user app


router.post("/calculate", async (req, res) => {
  try {
    const {
      userLocation,
      vendorLocation,
      cartTotal,
      deliverySettings,
      isRapidDelivery
    } = req.body;

    const result = await calculateLabDeliveryCharges(
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
