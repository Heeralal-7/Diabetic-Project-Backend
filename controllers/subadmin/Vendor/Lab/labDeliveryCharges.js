const LabDeliveryCharges = require("../../../../modal/labDeliveryCharges");

// ✅ GET lab delivery charges (Sub-Admin)
const getLabDeliveryCharges = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    
    if (!subAdmin) {
      return res.status(401).json({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ✅ CHECK LAB DELIVERY CHARGES VIEW PERMISSION
    if (!subAdmin.permissions?.vendors?.lab?.view) {
      return res.status(403).json({
        success: 0,
        message: "No permission to view lab delivery charges",
      });
    }

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

// ✅ UPDATE lab delivery charges (Sub-Admin)
const updateLabDeliveryCharges = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    
    if (!subAdmin) {
      return res.status(401).json({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ✅ CHECK LAB DELIVERY CHARGES EDIT PERMISSION
    if (!subAdmin.permissions?.vendors?.lab?.edit) {
      return res.status(403).json({
        success: 0,
        message: "No permission to update lab delivery charges",
      });
    }

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

module.exports = {
  getLabDeliveryCharges,
  updateLabDeliveryCharges
};