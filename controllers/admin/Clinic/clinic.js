const clinicModel = require("../../../modal/clinic");
const Document = require("../../../modal/Document");
const SubAdmin = require("../../../modal/subAdmin");

// Get all clinics with pagination and filters - UPDATED WITH SUB-ADMIN SUPPORT
const getAllClinics = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = ""
    } = req.query;
    
    const locationFilters = req.locationFilters || {};

    console.log("🏥 Fetching clinics with filters:", locationFilters);

    // Build filter object
    const filter = { ...locationFilters };
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
        { clinicName: { $regex: search, $options: "i" } }
      ];
    }

    if (status) {
      filter.Accountverify = status;
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get total count
    const totalClinics = await clinicModel.countDocuments(filter);

    // Get clinics with population
    const clinics = await clinicModel
      .find(filter)
      .populate("SpecialistsId", "name")
      .populate("DoctorId", "name email")
      .populate("myDocumentId")
      .populate("ConsultationFeesId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-password -token -phnOtp");

    console.log(` Found ${clinics.length} clinics`);

    return res.status(200).json({
      success: true,
      message: "Clinics fetched successfully",
      data: {
        clinics,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalClinics / limit),
          totalClinics,
          limit: parseInt(limit)
        }
      },
      appliedFilters: locationFilters
    });

  } catch (error) {
    console.error(" Error fetching clinics:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching clinics",
      error: error.message
    });
  }
};

// Approve clinic - UPDATED WITH PERMISSION CHECK
const approveClinic = async (req, res) => {
  try {
    const { id } = req.params;

    // CHECK PERMISSION FOR SUB-ADMIN
    if (req.subAdmin && !req.subAdmin.permissions?.clinics?.edit) {
      return res.status(403).json({
        success: false,
        message: "No permission to approve clinics"
      });
    }

    // Validate input
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Clinic ID is required"
      });
    }

    // Check if clinic exists
    const clinic = await clinicModel.findById(id);
    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: "Clinic not found"
      });
    }

    // FOR SUB-ADMIN, CHECK LOCATION PERMISSION
    if (req.subAdmin) {
      const { locationAccess } = req.subAdmin;
      const hasLocationAccess = (
        (!locationAccess.countries || locationAccess.countries.length === 0 || locationAccess.countries.includes(clinic.country)) &&
        (!locationAccess.states || locationAccess.states.length === 0 || locationAccess.states.includes(clinic.state)) &&
        (!locationAccess.cities || locationAccess.cities.length === 0 || locationAccess.cities.includes(clinic.city))
      );
      
      if (!hasLocationAccess) {
        return res.status(403).json({
          success: false,
          message: "access denied to clinic"
        });
      }
    }

    // Check if already approved
    if (clinic.Accountverify === '1') {
      return res.status(400).json({
        success: false,
        message: "Clinic is already approved"
      });
    }

    // Approve clinic
    const updatedClinic = await clinicModel.findByIdAndUpdate(
      id,
      {
        Accountverify: '1',
        rejectReason: ''
      },
      { new: true }
    ).select('name clinicName email Accountverify rejectReason');

    res.status(200).json({
      success: true,
      message: "Clinic approved successfully",
      data: updatedClinic
    });

  } catch (error) {
    console.error("Error approving clinic:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid clinic ID format"
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Reject clinic - UPDATED WITH PERMISSION CHECK
const rejectClinic = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectReason } = req.body;

    // ✅ CHECK PERMISSION FOR SUB-ADMIN
    if (req.subAdmin && !req.subAdmin.permissions?.clinics?.edit) {
      return res.status(403).json({
        success: false,
        message: "No permission to reject clinics"
      });
    }

    // Validate input
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Clinic ID is required"
      });
    }

    if (!rejectReason || rejectReason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Reject reason is required"
      });
    }

    // Check if clinic exists
    const clinic = await clinicModel.findById(id);
    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: "Clinic not found"
      });
    }

    // ✅ FOR SUB-ADMIN, CHECK LOCATION PERMISSION
    if (req.subAdmin) {
      const { locationAccess } = req.subAdmin;
      const hasLocationAccess = (
        (!locationAccess.countries || locationAccess.countries.length === 0 || locationAccess.countries.includes(clinic.country)) &&
        (!locationAccess.states || locationAccess.states.length === 0 || locationAccess.states.includes(clinic.state)) &&
        (!locationAccess.cities || locationAccess.cities.length === 0 || locationAccess.cities.includes(clinic.city))
      );
      
      if (!hasLocationAccess) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this clinic"
        });
      }
    }

    // Reject clinic
    const updatedClinic = await clinicModel.findByIdAndUpdate(
      id,
      {
        Accountverify: '2',
        rejectReason: rejectReason.trim()
      },
      { new: true }
    ).select('name clinicName email Accountverify rejectReason');

    res.status(200).json({
      success: true,
      message: "Clinic rejected successfully",
      data: updatedClinic
    });

  } catch (error) {
    console.error("Error rejecting clinic:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid clinic ID format"
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get document by clinic ID - UPDATED WITH PERMISSION CHECK
const getDocumentByClinicId = async (req, res) => {
  try {
    const clinic = await clinicModel.findById(req.params.id).populate("myDocumentId");

    if (!clinic) {
      return res.status(404).json({
        success: 0,
        message: "Clinic not found",
      });
    }
 
    // ✅ FOR SUB-ADMIN, CHECK LOCATION PERMISSION
    if (req.subAdmin) {
      const { locationAccess } = req.subAdmin;
      const hasLocationAccess = (
        (!locationAccess.countries || locationAccess.countries.length === 0 || locationAccess.countries.includes(clinic.country)) &&
        (!locationAccess.states || locationAccess.states.length === 0 || locationAccess.states.includes(clinic.state)) &&
        (!locationAccess.cities || locationAccess.cities.length === 0 || locationAccess.cities.includes(clinic.city))
      );
      
      if (!hasLocationAccess) {
        return res.status(403).json({
          success: 0,
          message: "Access denied to this clinic"
        });
      }
    }

    if (!clinic.myDocumentId) {
      return res.status(404).json({
        success: 0,
        message: "No document linked to this clinic",
      });
    }

    return res.status(200).json({
      success: 1,
      message: "Document fetched successfully",
      data: clinic.myDocumentId,
    });
  } catch (error) {
    console.error("Error fetching clinic document:", error);
    return res.status(500).json({
      success: 0,
      message: error.message,
    });
  }
};

// Approve clinic document field - UPDATED WITH PERMISSION CHECK
const approveClinicDocumentField = async (req, res) => {
  try {
    const { field } = req.body;

    // ✅ CHECK PERMISSION FOR SUB-ADMIN
    if (req.subAdmin && !req.subAdmin.permissions?.clinics?.edit) {
      return res.status(403).json({
        success: 0,
        message: "No permission to approve documents",
      });
    }

    if (!field) {
      return res.status(400).json({
        success: 0,
        message: "Field name is required",
      });
    }

    const allowedFields = [
      "panCardStatus",
      "aadharCardStatus",
      "drivingLicenceStatus",
      "doctorCertificateStatus",
      "licenceNoStatus",
      "accreditationStatus",
      "registrationNoStatus",
    ];

    if (!allowedFields.includes(field)) {
      return res.status(400).json({
        success: 0,
        message: "Invalid field name",
      });
    }

    const clinic = await clinicModel.findById(req.params.id);
    if (!clinic) {
      return res.status(404).json({
        success: 0,
        message: "Clinic not found",
      });
    }

    // ✅ FOR SUB-ADMIN, CHECK LOCATION PERMISSION
    if (req.subAdmin) {
      const { locationAccess } = req.subAdmin;
      const hasLocationAccess = (
        (!locationAccess.countries || locationAccess.countries.length === 0 || locationAccess.countries.includes(clinic.country)) &&
        (!locationAccess.states || locationAccess.states.length === 0 || locationAccess.states.includes(clinic.state)) &&
        (!locationAccess.cities || locationAccess.cities.length === 0 || locationAccess.cities.includes(clinic.city))
      );
      
      if (!hasLocationAccess) {
        return res.status(403).json({
          success: 0,
          message: "Access denied to this clinic"
        });
      }
    }

    if (!clinic.myDocumentId) {
      return res.status(404).json({
        success: 0,
        message: "No document linked to this clinic",
      });
    }

    const update = {};
    update[field] = "1";

    const updatedDoc = await Document.findByIdAndUpdate(
      clinic.myDocumentId,
      update,
      { new: true }
    );

    if (!updatedDoc) {
      return res.status(404).json({
        success: 0,
        message: "Document not found",
      });
    }

    return res.status(200).json({
      success: 1,
      message: `${field} approved successfully`,
      data: updatedDoc,
    });
  } catch (error) {
    console.error("Error approving clinic document field:", error);
    return res.status(500).json({
      success: 0,
      message: error.message,
    });
  }
};

// Reject clinic document field - UPDATED WITH PERMISSION CHECK
const rejectClinicDocumentField = async (req, res) => {
  try {
    const { field, rejectReason } = req.body;

    // ✅ CHECK PERMISSION FOR SUB-ADMIN
    if (req.subAdmin && !req.subAdmin.permissions?.clinics?.edit) {
      return res.status(403).json({
        success: 0,
        message: "No permission to reject documents",
      });
    }

    if (!field || !rejectReason) {
      return res.status(400).json({
        success: 0,
        message: "Field name and reject reason are required",
      });
    }

    const allowedFields = [
      "panCardStatus",
      "aadharCardStatus",
      "drivingLicenceStatus",
      "doctorCertificateStatus",
      "licenceNoStatus",
      "accreditationStatus",
      "registrationNoStatus",
    ];

    if (!allowedFields.includes(field)) {
      return res.status(400).json({
        success: 0,
        message: "Invalid field name",
      });
    }

    const clinic = await clinicModel.findById(req.params.id);
    if (!clinic) {
      return res.status(404).json({
        success: 0,
        message: "Clinic not found",
      });
    }

    // ✅ FOR SUB-ADMIN, CHECK LOCATION PERMISSION
    if (req.subAdmin) {
      const { locationAccess } = req.subAdmin;
      const hasLocationAccess = (
        (!locationAccess.countries || locationAccess.countries.length === 0 || locationAccess.countries.includes(clinic.country)) &&
        (!locationAccess.states || locationAccess.states.length === 0 || locationAccess.states.includes(clinic.state)) &&
        (!locationAccess.cities || locationAccess.cities.length === 0 || locationAccess.cities.includes(clinic.city))
      );
      
      if (!hasLocationAccess) {
        return res.status(403).json({
          success: 0,
          message: "Access denied to this clinic"
        });
      }
    }

    if (!clinic.myDocumentId) {
      return res.status(404).json({
        success: 0,
        message: "No document linked to this clinic",
      });
    }

    const update = {
      [field]: "2",
      [`rejectReasons.${field}`]: rejectReason,
    };

    const updatedDoc = await Document.findByIdAndUpdate(
      clinic.myDocumentId,
      update,
      { new: true }
    );

    if (!updatedDoc) {
      return res.status(404).json({
        success: 0,
        message: "Document not found",
      });
    }

    return res.status(200).json({
      success: 1,
      message: `${field} rejected with reason`,
      data: updatedDoc,
    });
  } catch (error) {
    console.error("Error rejecting clinic document field:", error);
    return res.status(500).json({
      success: 0,
      message: error.message,
    });
  }
};



// Get single clinic by ID - UPDATED WITH PERMISSION CHECK
const getClinicById = async (req, res) => {
  try {
    const { id } = req.params;

    const clinic = await clinicModel
      .findById(id)
      .populate("SpecialistsId")
      .populate("DoctorId", "-password -token")
      .populate("myDocumentId")
      .populate("ConsultationFeesId")
      .select("-password -token -phnOtp");

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: "Clinic not found"
      });
    }

    // ✅ FOR SUB-ADMIN, CHECK LOCATION PERMISSION
    if (req.subAdmin) {
      const { locationAccess } = req.subAdmin;
      const hasLocationAccess = (
        (!locationAccess.countries || locationAccess.countries.length === 0 || locationAccess.countries.includes(clinic.country)) &&
        (!locationAccess.states || locationAccess.states.length === 0 || locationAccess.states.includes(clinic.state)) &&
        (!locationAccess.cities || locationAccess.cities.length === 0 || locationAccess.cities.includes(clinic.city))
      );
      
      if (!hasLocationAccess) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this clinic"
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Clinic fetched successfully",
      data: clinic
    });

  } catch (error) {
    console.error("Error fetching clinic:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching clinic",
      error: error.message
    });
  }
};

// Get clinic statistics - UPDATED WITH LOCATION FILTER
const getClinicStats = async (req, res) => {
  try {
    const currentDate = new Date();

    // Generate last 12 months
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      };
    }).reverse();

    // ✅ Location filter for subadmin
    let locationQuery = {};
    if (req.subAdmin && req.subAdmin.locationAccess) {
      const { locationAccess } = req.subAdmin;
      if (locationAccess.countries?.length)
        locationQuery.country = { $in: locationAccess.countries };
      if (locationAccess.states?.length)
        locationQuery.state = { $in: locationAccess.states };
      if (locationAccess.cities?.length)
        locationQuery.city = { $in: locationAccess.cities };
    }

    // ✅ Aggregate monthly clinic stats
    const clinicStats = await clinicModel.aggregate([
      { $match: locationQuery },
      {
        $addFields: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: { year: "$year", month: "$month" },
          count: { $sum: 1 },
          clinics: { $push: "$$ROOT" }, // include all clinic data
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // ✅ Fill missing months with 0 and empty clinics
    const stats = months.map(({ year, month }) => {
      const stat = clinicStats.find(
        (item) => item._id.year === year && item._id.month === month
      );
      return {
        year,
        month,
        count: stat ? stat.count : 0,
        clinics: stat ? stat.clinics : [],
      };
    });

    // ✅ Send formatted response
    return res.status(200).json({
      success: 1,
      data: stats,
    });

  } catch (error) {
    console.error("Error fetching clinic stats:", error);
    return res.status(500).json({
      success: 0,
      message: error.message,
    });
  }
};


// Get clinics by status - UPDATED WITH LOCATION FILTER
const getClinicsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 10, country, state, city } = req.query;

    // ✅ BUILD LOCATION QUERY
    let locationQuery = {};
    if (req.subAdmin && req.subAdmin.locationAccess) {
      const { locationAccess } = req.subAdmin;
      if (locationAccess.countries && locationAccess.countries.length > 0) {
        locationQuery.country = { $in: locationAccess.countries };
      }
      if (locationAccess.states && locationAccess.states.length > 0) {
        locationQuery.state = { $in: locationAccess.states };
      }
      if (locationAccess.cities && locationAccess.cities.length > 0) {
        locationQuery.city = { $in: locationAccess.cities };
      }
    }
    
    if (country) locationQuery.country = country;
    if (state) locationQuery.state = state;
    if (city) locationQuery.city = city;

    const skip = (page - 1) * limit;

    const totalClinics = await clinicModel.countDocuments({ 
      Accountverify: status,
      ...locationQuery 
    });

    const clinics = await clinicModel
      .find({ 
        Accountverify: status,
        ...locationQuery 
      })
      .populate("SpecialistsId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-password -token -phnOtp");

    return res.status(200).json({
      success: true,
      message: "Clinics fetched successfully",
      data: {
        clinics,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalClinics / limit),
          totalClinics,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error("Error fetching clinics:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching clinics",
      error: error.message
    });
  }
};

module.exports = {
  getAllClinics,
  getClinicById,
  getClinicStats,
  getClinicsByStatus,
  approveClinic,
  rejectClinic,
  getDocumentByClinicId,
  approveClinicDocumentField,
  rejectClinicDocumentField,

};