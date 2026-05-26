const Specialists = require("../../../modal/Specialists");

// ✅ PERMISSION CHECK HELPER - Clinic based permission
const checkClinicBasedPermission = (subAdmin, action) => {
  // Agar subadmin ko clinics ki permission hai, toh specialists ki bhi automatically mil jaye
  if (subAdmin.permissions?.clinics?.[action]) {
    return true;
  }
  
  // Ya fir specifically specialists ki permission ho
  if (subAdmin.permissions?.specialists?.[action]) {
    return true;
  }
  
  return false;
};

// ✅ GET ALL SPECIALISTS - FOR SUB-ADMIN
const getSpecialists = async (req, res) => {
  try {
    // ✅ CHECK CLINIC-BASED PERMISSION (view)
    if (!checkClinicBasedPermission(req.subAdmin, 'view')) {
      return res.status(403).json({
        success: 0,
        message: "No permission to view specialists"
      });
    }

    const { page = 1, limit = 10, search = "" } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.specialists = { $regex: search, $options: "i" };
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get total count
    const totalSpecialists = await Specialists.countDocuments(filter);

    // Get specialists
    const specialists = await Specialists.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("specialists specialistImage createdAt");

    return res.status(200).json({
      success: 1,
      message: "Specialists fetched successfully",
      data: {
        specialists,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalSpecialists / limit),
          totalSpecialists,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error("Error fetching specialists:", error);
    return res.status(500).json({
      success: 0,
      message: error.message || 'Internal server error'
    });
  }
};

// ✅ CREATE SPECIALIZATION - FOR SUB-ADMIN
const createSpecialist = async (req, res) => {
  try {
    // ✅ CHECK CLINIC-BASED PERMISSION (create/edit)
    if (!checkClinicBasedPermission(req.subAdmin, 'create') && 
        !checkClinicBasedPermission(req.subAdmin, 'edit')) {
      return res.status(403).json({
        success: 0,
        message: "No permission to create specialists"
      });
    }

    const { specialists } = req.body;
    const specialistImage = req.file ? req.file.filename : "";

    if (!specialists) {
      return res.status(400).json({
        success: 0,
        message: 'Specialist name is required'
      });
    }

    // Check if specialist already exists
    const existingSpecialist = await Specialists.findOne({ 
      specialists: { $regex: new RegExp(`^${specialists}$`, 'i') } 
    });

    if (existingSpecialist) {
      return res.status(400).json({
        success: 0,
        message: 'Specialist already exists'
      });
    }

    const specialist = await Specialists.create({
      specialists,
      specialistImage
    });

    return res.status(201).json({
      success: 1,
      message: 'Specialist created successfully',
      data: specialist
    });

  } catch (error) {
    console.error("Error creating specialist:", error);
    return res.status(500).json({
      success: 0,
      message: error.message || 'Internal server error'
    });
  }
};

// ✅ GET SINGLE SPECIALIST - FOR SUB-ADMIN
const getSpecialistById = async (req, res) => {
  try {
    // ✅ CHECK CLINIC-BASED PERMISSION (view)
    if (!checkClinicBasedPermission(req.subAdmin, 'view')) {
      return res.status(403).json({
        success: 0,
        message: "No permission to view specialists"
      });
    }

    const { id } = req.params;

    const specialist = await Specialists.findById(id);

    if (!specialist) {
      return res.status(404).json({
        success: 0,
        message: 'Specialist not found'
      });
    }

    return res.status(200).json({
      success: 1,
      message: 'Specialist fetched successfully',
      data: specialist
    });

  } catch (error) {
    console.error("Error fetching specialist:", error);
    return res.status(500).json({
      success: 0,
      message: error.message || 'Internal server error'
    });
  }
};

// ✅ UPDATE SPECIALIST - FOR SUB-ADMIN
const updateSpecialist = async (req, res) => {
  try {
    // ✅ CHECK CLINIC-BASED PERMISSION (edit)
    if (!checkClinicBasedPermission(req.subAdmin, 'edit')) {
      return res.status(403).json({
        success: 0,
        message: "No permission to update specialists"
      });
    }

    const { id } = req.params;
    const { specialists } = req.body;
    const specialistImage = req.file ? req.file.filename : undefined;

    if (!specialists) {
      return res.status(400).json({
        success: 0,
        message: 'Specialist name is required'
      });
    }

    // Check if specialist exists
    const existingSpecialist = await Specialists.findById(id);
    if (!existingSpecialist) {
      return res.status(404).json({
        success: 0,
        message: 'Specialist not found'
      });
    }

    // Check if specialist name already exists (excluding current specialist)
    const duplicateSpecialist = await Specialists.findOne({
      specialists: { $regex: new RegExp(`^${specialists}$`, 'i') },
      _id: { $ne: id }
    });

    if (duplicateSpecialist) {
      return res.status(400).json({
        success: 0,
        message: 'Specialist name already exists'
      });
    }

    const updateData = { specialists };
    if (specialistImage) {
      updateData.specialistImage = specialistImage;
    }

    const updatedSpecialist = await Specialists.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: 1,
      message: 'Specialist updated successfully',
      data: updatedSpecialist
    });

  } catch (error) {
    console.error("Error updating specialist:", error);
    return res.status(500).json({
      success: 0,
      message: error.message || 'Internal server error'
    });
  }
};

// ✅ DELETE SPECIALIST - FOR SUB-ADMIN
const deleteSpecialist = async (req, res) => {
  try {
    // ✅ CHECK CLINIC-BASED PERMISSION (delete)
    if (!checkClinicBasedPermission(req.subAdmin, 'delete')) {
      return res.status(403).json({
        success: 0,
        message: "No permission to delete specialists"
      });
    }

    const { id } = req.params;

    const specialist = await Specialists.findByIdAndDelete(id);

    if (!specialist) {
      return res.status(404).json({
        success: 0,
        message: 'Specialist not found'
      });
    }

    return res.status(200).json({
      success: 1,
      message: 'Specialist deleted successfully',
      data: {
        id: specialist._id,
        name: specialist.specialists
      }
    });

  } catch (error) {
    console.error("Error deleting specialist:", error);
    return res.status(500).json({
      success: 0,
      message: error.message || 'Internal server error'
    });
  }
};

// ✅ GET SPECIALISTS STATISTICS - FOR SUB-ADMIN
const getSpecialistStats = async (req, res) => {
  try {
    // ✅ CHECK CLINIC-BASED PERMISSION (view)
    if (!checkClinicBasedPermission(req.subAdmin, 'view')) {
      return res.status(403).json({
        success: 0,
        message: "No permission to view statistics"
      });
    }

    const totalSpecialists = await Specialists.countDocuments();

    // Get recent specialists (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentSpecialists = await Specialists.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Get top specialists by usage
    const topSpecialists = await Specialists.aggregate([
      {
        $lookup: {
          from: "clinics",
          localField: "_id",
          foreignField: "SpecialistsId",
          as: "clinics"
        }
      },
      {
        $project: {
          specialists: 1,
          specialistImage: 1,
          clinicCount: { $size: "$clinics" }
        }
      },
      {
        $sort: { clinicCount: -1 }
      },
      {
        $limit: 5
      }
    ]);

    return res.status(200).json({
      success: 1,
      message: "Statistics fetched successfully",
      data: {
        totalSpecialists,
        recentSpecialists,
        topSpecialists
      }
    });

  } catch (error) {
    console.error("Error fetching statistics:", error);
    return res.status(500).json({
      success: 0,
      message: error.message || 'Internal server error'
    });
  }
};

module.exports = {
  getSpecialists,
  createSpecialist,
  getSpecialistById,
  updateSpecialist,
  deleteSpecialist,
  getSpecialistStats
};