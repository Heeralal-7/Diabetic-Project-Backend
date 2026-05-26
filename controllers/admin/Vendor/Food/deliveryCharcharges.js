// controllers/admin/Vendor/Food/deliveryCharges.js
const FoodDeliveryCharges = require("../../../../modal/foodDeliveryCharges");
const { calculateOnRoadDistance,straightLineDistance } = require("../../../utils/googleMapsDistance");

// Get current food delivery charges
// Method: GET
// Endpoint: /admin-food-delivery-charges/get
const getFoodDeliveryCharges = async (req, res) => {
  try {
    const charges = await FoodDeliveryCharges.findOne().sort({ lastUpdated: -1 });
 
    if (!charges) {
      // Return default values if no charges are set yet
      return res.status(200).json({
        success: 1,
        message: "Using default food delivery charges",
        data: {
          baseDeliveryCharge: 50,
          freeDeliveryThreshold: 300,
          rapidDeliveryCharge: 100,
          taxPercentage: 2,
          freeDeliveryRadius: 10,
          perKmCharge: 5,
          lastUpdated: null
        }
      });
    }
 
    return res.status(200).json({
      success: 1,
      message: "Food delivery charges fetched successfully",
      data: charges
    });
  } catch (error) {
    console.error("Get Food Delivery Charges Error:", error);
    return res.status(500).json({
      success: 0,
      message: "Failed to fetch food delivery charges",
      error: error.message
    });
  }
};
 
// Update food delivery charges using PATCH
// Method: PATCH
// Endpoint: /admin-food-delivery-charges/update
const updateFoodDeliveryCharges = async (req, res) => {
  try {
    const {
      baseDeliveryCharge,
      freeDeliveryThreshold,
      rapidDeliveryCharge,
      taxPercentage,
      freeDeliveryRadius,
      perKmCharge
    } = req.body;

    // Validate input
    if (isNaN(baseDeliveryCharge) || isNaN(freeDeliveryThreshold) ||
        isNaN(rapidDeliveryCharge) || isNaN(freeDeliveryRadius) || 
        isNaN(perKmCharge)) {
      return res.status(400).json({
        success: 0,
        message: "All charges must be valid numbers"
      });
    }

    // Find the latest delivery charges record and UPDATE it (PATCH behavior)
    const latestCharges = await FoodDeliveryCharges.findOne().sort({ lastUpdated: -1 });
    
    let updatedCharges;
    
    if (latestCharges) {
      // Update existing record with new values
      latestCharges.baseDeliveryCharge = Number(baseDeliveryCharge);
      latestCharges.freeDeliveryThreshold = Number(freeDeliveryThreshold);
      latestCharges.rapidDeliveryCharge = Number(rapidDeliveryCharge);
      latestCharges.taxPercentage = Number(taxPercentage);
      latestCharges.freeDeliveryRadius = Number(freeDeliveryRadius);
      latestCharges.perKmCharge = Number(perKmCharge);
      latestCharges.lastUpdated = new Date();
      
      updatedCharges = await latestCharges.save();
    } else {
      // Create new record if none exists
      updatedCharges = new FoodDeliveryCharges({
        baseDeliveryCharge: Number(baseDeliveryCharge),
        freeDeliveryThreshold: Number(freeDeliveryThreshold),
        rapidDeliveryCharge: Number(rapidDeliveryCharge),
        taxPercentage: Number(taxPercentage),
        freeDeliveryRadius: Number(freeDeliveryRadius),
        perKmCharge: Number(perKmCharge),
        lastUpdated: new Date(),
      });
      await updatedCharges.save();
    }

    return res.status(200).json({
      success: 1,
      message: "Food delivery charges updated successfully",
      data: updatedCharges
    });
  } catch (error) {
    console.error("Update Food Delivery Charges Error:", error);
    return res.status(500).json({
      success: 0,
      message: "Failed to update food delivery charges",
      error: error.message
    });
  }
};


// Add this new function for calculating delivery charges with on-road distance
const calculateFoodDeliveryCharges = async (userLocation, vendorLocation, cartTotal, deliverySettings, isRapidDelivery = false) => {
  try {
    const {
      baseDeliveryCharge = 50,
      freeDeliveryThreshold = 300,
      rapidDeliveryCharge = 100,
      freeDeliveryRadius = 10,
      perKmCharge = 5,
      taxPercentage = 2
    } = deliverySettings;

    // Calculate on-road distance
    const distanceResult = await calculateOnRoadDistance(
      userLocation.latitude,
      userLocation.longitude,
      vendorLocation.latitude,
      vendorLocation.longitude
    );

    const distance = distanceResult.distance;

    let deliveryCharges = 0;
    let baseDelivery = 0;
    let rapidDeliveryFee = 0;
    let extraCharges = 0;
    let extraDistance = 0;
    
    // Calculate distance-based charges regardless of cart total
    if (distance <= freeDeliveryRadius) {
      baseDelivery = baseDeliveryCharge;
      extraCharges = 0;
      extraDistance = 0;
    } else {
      extraDistance = distance - freeDeliveryRadius;
      extraCharges = Math.ceil(extraDistance) * perKmCharge;
      baseDelivery = baseDeliveryCharge + extraCharges;
    }

    // Check if eligible for free delivery based on cart total
    if (cartTotal >= freeDeliveryThreshold) {
      // Free delivery applies only to base delivery charge
      baseDelivery = 0;
      deliveryCharges = extraCharges;
    } else {
      deliveryCharges = baseDelivery;
    }

    // Add rapid delivery charges if applicable
    if (isRapidDelivery) {
      rapidDeliveryFee = rapidDeliveryCharge;
    }

    deliveryCharges = deliveryCharges + rapidDeliveryFee;

    // Calculate tax
    const taxAmount = (cartTotal * taxPercentage) / 100;
    const finalTotal = cartTotal + deliveryCharges + taxAmount;

    return {
      baseDelivery: cartTotal >= freeDeliveryThreshold ? 0 : baseDelivery,
      rapidDeliveryFee: parseFloat(rapidDeliveryFee.toFixed(2)),
      totalDelivery: parseFloat(deliveryCharges.toFixed(2)),
      distance: parseFloat(distance.toFixed(2)),
      distanceText: distanceResult.distanceText,
      duration: distanceResult.duration,
      durationText: distanceResult.durationText,
      freeRadiusUsed: distance <= freeDeliveryRadius,
      extraDistance: parseFloat(extraDistance.toFixed(2)),
      extraCharges: parseFloat(extraCharges.toFixed(2)),
      freeDeliveryEligible: cartTotal >= freeDeliveryThreshold,
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      finalTotal: parseFloat(finalTotal.toFixed(2)),
      distanceCalculationType: distanceResult.status === 'FALLBACK' ? 'straight_line' : 'on_road'
    };
  } catch (error) {
    console.error('Delivery charges calculation error:', error);
    throw error;
  }
};

 
module.exports = {
  getFoodDeliveryCharges,
  updateFoodDeliveryCharges,
  calculateFoodDeliveryCharges
};