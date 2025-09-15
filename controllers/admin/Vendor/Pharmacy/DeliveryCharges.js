const DeliveryCharges = require("../../../../modal/DeliveryCharges");
 
// Get current delivery charges
// Method: GET
// Endpoint: /admin-delivery-charges/get
const getDeliveryCharges = async (req, res) => {
  try {
    const charges = await DeliveryCharges.findOne().sort({ lastUpdated: -1 });
    
    if (!charges) {
      // Return default values if no charges set yet
      return res.status(200).json({
        success: 1,
        message: "Using default delivery charges",
        data: {
          baseDeliveryCharge: 30,
          freeDeliveryThreshold: 300,
          rapidDeliveryCharge: 100,
          taxPercentage: 2,
          lastUpdated: null
        }
      });
    }
 
    return res.status(200).json({
      success: 1,
      message: "Delivery charges fetched successfully",
      data: charges
    });
  } catch (error) {
    console.error("Get Delivery Charges Error:", error);
    return res.status(500).json({
      success: 0,
      message: "Failed to fetch delivery charges",
      error: error.message
    });
  }
};
 
// Update delivery charges (Admin only)
// Method: POST
// Endpoint: /admin-delivery-charges/update
const updateDeliveryCharges = async (req, res) => {
  try {
    const {
      baseDeliveryCharge,
        freeDeliveryThreshold,
        rapidDeliveryCharge,
        taxPercentage
    } = req.body;
 
    // Validate input
    if (isNaN(baseDeliveryCharge) || isNaN(freeDeliveryThreshold) ||
        isNaN(rapidDeliveryCharge)) {
      return res.status(400).json({
        success: 0,
        message: "All charges must be valid numbers"
      });
    }
 
    // Create new charges record
    const newCharges = new DeliveryCharges({
      baseDeliveryCharge,
      freeDeliveryThreshold,
      rapidDeliveryCharge,
      taxPercentage
    });
 
    await newCharges.save();
 
    return res.status(200).json({
      success: 1,
      message: "Delivery charges updated successfully",
      data: newCharges
    });
  } catch (error) {
    console.error("Update Delivery Charges Error:", error);
    return res.status(500).json({
      success: 0,
      message: "Failed to update delivery charges",
      error: error.message
    });
  }
};
 
// Get all delivery charges history (Admin only)
// Method: GET
// Endpoint: /admin-delivery-charges/history
const getDeliveryChargesHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { lastUpdated: -1 }
    };
 
    const history = await DeliveryCharges.paginate({}, options);
 
    return res.status(200).json({
      success: 1,
      message: "Delivery charges history fetched successfully",
      data: history
    });
  } catch (error) {
    console.error("Get Delivery Charges History Error:", error);
    return res.status(500).json({
      success: 0,
      message: "Failed to fetch delivery charges history",
      error: error.message
    });
  }
};
 
module.exports = {
  getDeliveryCharges,
  updateDeliveryCharges,
  getDeliveryChargesHistory
};
 