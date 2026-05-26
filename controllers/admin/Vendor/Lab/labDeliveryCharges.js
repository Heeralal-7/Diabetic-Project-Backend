const LabDeliveryCharges = require("../../../../modal/labDeliveryCharges");
const { calculateOnRoadDistance, straightLineDistance } = require("../../../utils/googleMapsDistance");

// GET lab delivery charges
const getLabDeliveryCharges = async (req, res) => {
  try {
    const charges = await LabDeliveryCharges.findOne().sort({ lastUpdated: -1 });

    if (!charges) {
      return res.status(200).json({
        success: 1,
        message: "Using default lab delivery charges",
        data: {
          baseDeliveryCharge: 50,
          freeDeliveryThreshold: 300,
          rapidDeliveryCharge: 100,
          taxPercentage: 0,
          freeDeliveryRadius: 10,
          perKmCharge: 5,
          lastUpdated: null
        }
      });
    }

    return res.status(200).json({
      success: 1,
      message: "Lab delivery charges fetched successfully",
      data: charges
    });

  } catch (error) {
    console.error("Get Lab Delivery Charges Error:", error);
    return res.status(500).json({
      success: 0,
      message: "Failed to fetch lab delivery charges",
      error: error.message
    });
  }
};


// UPDATE lab delivery charges
const updateLabDeliveryCharges = async (req, res) => {
  try {
    const {
      baseDeliveryCharge,
      freeDeliveryThreshold,
      rapidDeliveryCharge,
      taxPercentage,
      freeDeliveryRadius,
      perKmCharge
    } = req.body;

    if (
      isNaN(baseDeliveryCharge) || isNaN(freeDeliveryThreshold) ||
      isNaN(rapidDeliveryCharge) || isNaN(freeDeliveryRadius) || 
      isNaN(perKmCharge)
    ) {
      return res.status(400).json({
        success: 0,
        message: "All charges must be valid numbers"
      });
    }

    let latestCharges = await LabDeliveryCharges.findOne().sort({ lastUpdated: -1 });

    if (latestCharges) {
      latestCharges.baseDeliveryCharge = Number(baseDeliveryCharge);
      latestCharges.freeDeliveryThreshold = Number(freeDeliveryThreshold);
      latestCharges.rapidDeliveryCharge = Number(rapidDeliveryCharge);
      latestCharges.taxPercentage = Number(taxPercentage);
      latestCharges.freeDeliveryRadius = Number(freeDeliveryRadius);
      latestCharges.perKmCharge = Number(perKmCharge);
      latestCharges.lastUpdated = new Date();
      await latestCharges.save();
    } else {
      latestCharges = await LabDeliveryCharges.create({
        baseDeliveryCharge,
        freeDeliveryThreshold,
        rapidDeliveryCharge,
        taxPercentage,
        freeDeliveryRadius,
        perKmCharge
      });
    }

    return res.status(200).json({
      success: 1,
      message: "Lab delivery charges updated successfully",
      data: latestCharges
    });

  } catch (error) {
    console.error("Update Lab Delivery Charges Error:", error);
    return res.status(500).json({
      success: 0,
      message: "Failed to update lab delivery charges",
      error: error.message
    });
  }
};


// CALCULATE lab delivery charges
const calculateLabDeliveryCharges = async (
  userLocation, vendorLocation, cartTotal, deliverySettings, isRapidDelivery = false
) => {
  try {
    const {
      baseDeliveryCharge = 50,
      freeDeliveryThreshold = 300,
      rapidDeliveryCharge = 100,
      freeDeliveryRadius = 10,
      perKmCharge = 5,
      taxPercentage = 0
    } = deliverySettings;

    const distanceResult = await calculateOnRoadDistance(
      userLocation.latitude, userLocation.longitude,
      vendorLocation.latitude, vendorLocation.longitude
    );

    const distance = distanceResult.distance;

    let deliveryCharges = 0;
    let baseDelivery = 0;
    let rapidDeliveryFee = 0;
    let extraCharges = 0;
    let extraDistance = 0;

    if (distance <= freeDeliveryRadius) {
      baseDelivery = baseDeliveryCharge;
    } else {
      extraDistance = distance - freeDeliveryRadius;
      extraCharges = Math.ceil(extraDistance) * perKmCharge;
      baseDelivery = baseDeliveryCharge + extraCharges;
    }

    if (cartTotal >= freeDeliveryThreshold) {
      baseDelivery = 0;
      deliveryCharges = extraCharges;
    } else {
      deliveryCharges = baseDelivery;
    }

    if (isRapidDelivery) {
      rapidDeliveryFee = rapidDeliveryCharge;
    }

    deliveryCharges += rapidDeliveryFee;

    const taxAmount = (cartTotal * taxPercentage) / 100;
    const finalTotal = cartTotal + deliveryCharges + taxAmount;

    return {
      baseDelivery: cartTotal >= freeDeliveryThreshold ? 0 : baseDelivery,
      rapidDeliveryFee,
      totalDelivery: deliveryCharges,
      distance,
      distanceText: distanceResult.distanceText,
      duration: distanceResult.duration,
      durationText: distanceResult.durationText,
      freeRadiusUsed: distance <= freeDeliveryRadius,
      extraDistance,
      extraCharges,
      freeDeliveryEligible: cartTotal >= freeDeliveryThreshold,
      taxAmount,
      finalTotal,
      distanceCalculationType:
        distanceResult.status === "FALLBACK" ? "straight_line" : "on_road"
    };

  } catch (error) {
    console.error("Lab Delivery charges calculation error:", error);
    throw error;
  }
};

module.exports = {
  getLabDeliveryCharges,
  updateLabDeliveryCharges,
  calculateLabDeliveryCharges
};
