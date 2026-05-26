const maxLimit = require("../../../modal/distanceLimit");
 
// =============================================
// HELPER FUNCTION FOR PERMISSION CHECKING
// =============================================
const checkDistancePermission = (subAdmin, permissionType) => {
  if (!subAdmin) {
    return {
      allowed: false,
      message: "Sub-admin not authenticated"
    };
  }
 
  // Check for distance-specific permissions
  if (subAdmin.permissions?.distance?.[permissionType]) {
    return { allowed: true };
  }
 
  // OR check for general settings permissions
  if (subAdmin.permissions?.settings?.[permissionType]) {
    return { allowed: true };
  }
 
  // OR check for general users permissions
  if (subAdmin.permissions?.users?.[permissionType]) {
    return { allowed: true };
  }
 
  // OR check for admin permissions
  if (subAdmin.permissions?.admin?.[permissionType]) {
    return { allowed: true };
  }
 
  return {
    allowed: false,
    message: `No permission to ${permissionType} distance limits`
  };
};
 
// =============================================
// SET DISTANCE LIMIT
// Endpoint: /distance/subadmin/post-distance-limit
// =============================================
const setSubadDistanceLimit = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkDistancePermission(subAdmin, 'create');
      if (!permissionCheck.allowed) {
        return res.status(403).send({
          success: 0,
          message: permissionCheck.message || "No permission to set distance limits"
        });
      }
    }
 
    const { doctorLimit, clinicLimit, foodLimit, pharmacyLimit, labLimit } = req.body;
   
    // Validation
    if (!doctorLimit || !clinicLimit || !foodLimit || !pharmacyLimit || !labLimit) {
      return res.status(400).send({
        success: 0,
        message: "All distance limits are required"
      });
    }
 
    // Convert to numbers and validate
    const limits = {
      doctorLimit: Number(doctorLimit),
      clinicLimit: Number(clinicLimit),
      foodLimit: Number(foodLimit),
      pharmacyLimit: Number(pharmacyLimit),
      labLimit: Number(labLimit)
    };
 
    // Validate positive numbers
    Object.entries(limits).forEach(([key, value]) => {
      if (isNaN(value) || value < 0) {
        throw new Error(`${key} must be a positive number`);
      }
    });
 
    // Check if limit already exists
    const existingLimit = await maxLimit.findOne();
    if (existingLimit) {
      return res.status(400).send({
        success: 0,
        message: "Distance limit already exists. Use update instead."
      });
    }
 
    const limit = new maxLimit({
      ...limits,
      createdBy: subAdmin?._id || req.admin?._id,
      createdByRole: subAdmin ? 'subadmin' : 'admin'
    });
 
    await limit.save();
 
    return res.status(201).send({
      success: 1,
      message: "Distance limits set successfully",
      data: {
        id: limit._id,
        createdBy: limit.createdBy,
        createdByRole: limit.createdByRole,
        createdAt: limit.createdAt
      }
    });
 
  } catch (error) {
    console.error('Set Distance Limit Error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message || "Internal server error"
    });
  }
};
 
// =============================================
// UPDATE DISTANCE LIMIT
// Endpoint: /distance/subadmin/update-distance-limit/:id
// =============================================
const updateSubadDistanceLimit = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkDistancePermission(subAdmin, 'edit');
      if (!permissionCheck.allowed) {
        return res.status(403).send({
          success: 0,
          message: permissionCheck.message || "No permission to update distance limits"
        });
      }
    }
 
    const { id } = req.params;
    const { doctorLimit, clinicLimit, foodLimit, pharmacyLimit, labLimit } = req.body;
 
    if (!id) {
      return res.status(400).send({
        success: 0,
        message: "Distance limit ID is required"
      });
    }
 
    // Check if at least one field is provided
    if (!doctorLimit && !clinicLimit && !foodLimit && !pharmacyLimit && !labLimit) {
      return res.status(400).send({
        success: 0,
        message: "At least one distance limit must be provided for update"
      });
    }
 
    // Prepare update data
    const updateData = {
      updatedBy: subAdmin?._id || req.admin?._id,
      updatedByRole: subAdmin ? 'subadmin' : 'admin',
      updatedAt: new Date()
    };
 
    // Add only provided fields
    if (doctorLimit !== undefined) {
      const value = Number(doctorLimit);
      if (isNaN(value) || value < 0) {
        throw new Error("doctorLimit must be a positive number");
      }
      updateData.doctorLimit = value;
    }
 
    if (clinicLimit !== undefined) {
      const value = Number(clinicLimit);
      if (isNaN(value) || value < 0) {
        throw new Error("clinicLimit must be a positive number");
      }
      updateData.clinicLimit = value;
    }
 
    if (foodLimit !== undefined) {
      const value = Number(foodLimit);
      if (isNaN(value) || value < 0) {
        throw new Error("foodLimit must be a positive number");
      }
      updateData.foodLimit = value;
    }
 
    if (pharmacyLimit !== undefined) {
      const value = Number(pharmacyLimit);
      if (isNaN(value) || value < 0) {
        throw new Error("pharmacyLimit must be a positive number");
      }
      updateData.pharmacyLimit = value;
    }
 
    if (labLimit !== undefined) {
      const value = Number(labLimit);
      if (isNaN(value) || value < 0) {
        throw new Error("labLimit must be a positive number");
      }
      updateData.labLimit = value;
    }
 
    const limit = await maxLimit.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
 
    if (!limit) {
      return res.status(404).send({
        success: 0,
        message: "Distance limit not found"
      });
    }
 
    return res.status(200).send({
      success: 1,
      message: "Distance limits updated successfully",
      data: {
        id: limit._id,
        updatedBy: updateData.updatedBy,
        updatedByRole: updateData.updatedByRole,
        updatedAt: updateData.updatedAt,
        limits: {
          doctorLimit: limit.doctorLimit,
          clinicLimit: limit.clinicLimit,
          foodLimit: limit.foodLimit,
          pharmacyLimit: limit.pharmacyLimit,
          labLimit: limit.labLimit
        }
      }
    });
 
  } catch (error) {
    console.error('Update Distance Limit Error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message || "Internal server error"
    });
  }
};
 
// =============================================
// GET DISTANCE LIMIT
// Endpoint: /distance/get-distance-limit
// =============================================
const getSubadDistanceLimit = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN (optional - depends on your requirements)
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkDistancePermission(subAdmin, 'view');
      if (!permissionCheck.allowed) {
        return res.status(403).send({
          success: 0,
          message: permissionCheck.message || "No permission to view distance limits"
        });
      }
    }
 
    const limit = await maxLimit.findOne().sort({ createdAt: -1 });
 
    if (!limit) {
      return res.status(404).send({
        success: 0,
        message: "Distance limit not found"
      });
    }
 
    // Format response based on user role
    const responseData = {
      _id: limit._id,
      doctorLimit: limit.doctorLimit,
      clinicLimit: limit.clinicLimit,
      foodLimit: limit.foodLimit,
      pharmacyLimit: limit.pharmacyLimit,
      labLimit: limit.labLimit,
      createdAt: limit.createdAt,
      updatedAt: limit.updatedAt
    };
 
    // Add audit info only for admins/subadmins
    if (req.admin || subAdmin) {
      responseData.createdBy = limit.createdBy;
      responseData.createdByRole = limit.createdByRole;
      responseData.updatedBy = limit.updatedBy;
      responseData.updatedByRole = limit.updatedByRole;
    }
 
    return res.status(200).send({
      success: 1,
      message: "Distance limits retrieved successfully",
      data: responseData,
      userRole: subAdmin ? 'subadmin' : (req.admin ? 'admin' : 'public')
    });
 
  } catch (error) {
    console.error('Get Distance Limit Error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message || "Internal server error"
    });
  }
};
 
// =============================================
// DELETE DISTANCE LIMIT (Optional - Add if needed)
// =============================================
const deleteDistanceLimit = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkDistancePermission(subAdmin, 'delete');
      if (!permissionCheck.allowed) {
        return res.status(403).send({
          success: 0,
          message: permissionCheck.message || "No permission to delete distance limits"
        });
      }
    }
 
    const { id } = req.params;
 
    if (!id) {
      return res.status(400).send({
        success: 0,
        message: "Distance limit ID is required"
      });
    }
 
    const limit = await maxLimit.findByIdAndDelete(id);
 
    if (!limit) {
      return res.status(404).send({
        success: 0,
        message: "Distance limit not found"
      });
    }
 
    return res.status(200).send({
      success: 1,
      message: "Distance limit deleted successfully",
      deletedId: id
    });
 
  } catch (error) {
    console.error('Delete Distance Limit Error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message || "Internal server error"
    });
  }
};
 
module.exports = {
  setSubadDistanceLimit,
  updateSubadDistanceLimit,
  getSubadDistanceLimit,
  deleteDistanceLimit // Optional: Add if you need delete functionality
};
 