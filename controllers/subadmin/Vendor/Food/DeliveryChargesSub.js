const FoodDeliveryCharges = require("../../../../modal/foodDeliveryCharges");

// ✅ GET CURRENT FOOD DELIVERY CHARGES - SUB ADMIN
// Method: GET
// Endpoint: /subadmin-food-delivery-charges/get
const getFoodDeliveryCharges = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    if (!subAdmin) {
      return res.status(401).json({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ✅ CHECK FOOD VENDOR VIEW PERMISSION
    if (!subAdmin.permissions?.vendors?.food?.view) {
      return res.status(403).json({
        success: 0,
        message: "No permission to view food delivery charges",
      });
    }

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
          freeDeliveryRadius: 10, // Added default
          perKmCharge: 5, // Added default
          lastUpdated: null
        },
        permissions: {
          view: true,
          edit: subAdmin.permissions?.vendors?.food?.edit || false
        }
      });
    }

    return res.status(200).json({
      success: 1,
      message: "Food delivery charges fetched successfully",
      data: charges,
      permissions: {
        view: true,
        edit: subAdmin.permissions?.vendors?.food?.edit || false
      }
    });
  } catch (error) {
    console.error("Sub-Admin Get Food Delivery Charges Error:", error);
    return res.status(500).json({
      success: 0,
      message: "Failed to fetch food delivery charges",
      error: error.message
    });
  }
};

// ✅ UPDATE FOOD DELIVERY CHARGES - SUB ADMIN
// Method: PATCH
// Endpoint: /subadmin-food-delivery-charges/update
const updateFoodDeliveryCharges = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    if (!subAdmin) {
      return res.status(401).json({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ✅ CHECK FOOD VENDOR EDIT PERMISSION
    if (!subAdmin.permissions?.vendors?.food?.edit) {
      return res.status(403).json({
        success: 0,
        message: "No permission to update food delivery charges",
      });
    }

    const updateData = { ...req.body };

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: 0,
        message: "Request body cannot be empty for an update."
      });
    }

    // ✅ VALIDATE UPDATE DATA - UPDATED WITH NEW FIELDS
    const allowedFields = ['baseDeliveryCharge', 'freeDeliveryThreshold', 'rapidDeliveryCharge', 'taxPercentage', 'freeDeliveryRadius', 'perKmCharge'];
    const invalidFields = Object.keys(updateData).filter(field => !allowedFields.includes(field));
    
    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: 0,
        message: `Invalid fields: ${invalidFields.join(', ')}`
      });
    }

    // ✅ VALIDATE NUMERIC VALUES - UPDATED WITH NEW FIELDS
    const numericFields = ['baseDeliveryCharge', 'freeDeliveryThreshold', 'rapidDeliveryCharge', 'taxPercentage', 'freeDeliveryRadius', 'perKmCharge'];
    for (const field of numericFields) {
      if (updateData[field] !== undefined && (isNaN(updateData[field]) || updateData[field] < 0)) {
        return res.status(400).json({
          success: 0,
          message: `${field} must be a positive number`
        });
      }
    }

    updateData.lastUpdated = new Date();
    updateData.updatedBy = {
      subAdminId: subAdmin._id,
      subAdminName: subAdmin.name,
      subAdminEmail: subAdmin.email
    };

    const updatedCharges = await FoodDeliveryCharges.findOneAndUpdate(
      {},
      { $set: updateData },
      { new: true, upsert: true, sort: { lastUpdated: -1 } }
    );

    return res.status(200).json({
      success: 1,
      message: "Delivery charges updated successfully",
      data: updatedCharges,
      updatedBy: {
        subAdminId: subAdmin._id,
        subAdminName: subAdmin.name
      }
    });
  } catch (error) {
    console.error("Sub-Admin Update Delivery Charges Error:", error);
    return res.status(500).json({
      success: 0,
      message: "Failed to update delivery charges",
      error: error.message
    });
  }
};

// ✅ GET FOOD DELIVERY CHARGES HISTORY - SUB ADMIN
// Method: GET
// Endpoint: /subadmin-food-delivery-charges/history
const getFoodDeliveryChargesHistory = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    if (!subAdmin) {
      return res.status(401).json({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ✅ CHECK FOOD VENDOR VIEW PERMISSION
    if (!subAdmin.permissions?.vendors?.food?.view) {
      return res.status(403).json({
        success: 0,
        message: "No permission to view food delivery charges history",
      });
    }

    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get charges history with pagination
    const chargesHistory = await FoodDeliveryCharges.find({})
      .sort({ lastUpdated: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('baseDeliveryCharge freeDeliveryThreshold rapidDeliveryCharge taxPercentage freeDeliveryRadius perKmCharge lastUpdated updatedBy')
      .lean();

    const totalRecords = await FoodDeliveryCharges.countDocuments();

    return res.status(200).json({
      success: 1,
      message: "Food delivery charges history fetched successfully",
      data: {
        chargesHistory,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalRecords / limitNum),
          totalRecords,
          hasNext: pageNum < Math.ceil(totalRecords / limitNum),
          hasPrev: pageNum > 1
        }
      },
      permissions: {
        view: true,
        edit: subAdmin.permissions?.vendors?.food?.edit || false
      }
    });
  } catch (error) {
    console.error("Sub-Admin Get Delivery Charges History Error:", error);
    return res.status(500).json({
      success: 0,
      message: "Failed to fetch delivery charges history",
      error: error.message
    });
  }
};

module.exports = {
  getFoodDeliveryCharges,
  updateFoodDeliveryCharges,
  getFoodDeliveryChargesHistory
};