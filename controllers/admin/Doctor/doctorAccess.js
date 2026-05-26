const Docter = require("../../../modal/docter");
const Document = require("../../../modal/Document");
const InsuranceModel = require("../../../modal/AddInsurance");
const membership = require("../../../modal/MemberShip");
const Coupon = require("../../../modal/Coupon");
const jwt = require("jsonwebtoken");

// Get all doctors - UPDATED WITH SUB-ADMIN SUPPORT
// Get all doctors - UPDATED WITH LOCATION FILTERS
// Get all doctors - PROPERLY UPDATED WITH LOCATION FILTERS
const getDoctors = async (req, res) => {
  try {
    const locationFilters = req.locationFilters || {};
    
    console.log("🩺 Fetching doctors with filters:", locationFilters);

    const doctors = await Docter.find(locationFilters).sort({ createdAt: -1 });
    
    console.log(`✅ Found ${doctors.length} doctors`);

    return res.status(200).json({
      success: 1,
      message: Object.keys(locationFilters).length > 0 ? 
        `Doctors filtered by location` : "All doctors fetched successfully",
      data: doctors,
      appliedFilters: locationFilters
    });
    
  } catch (error) {
    console.error("❌ Error in getDoctors:", error);
    return res.status(500).json({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ API 1: Get document by doctor ID - UPDATED WITH PERMISSION CHECK
const getDocumentByDoctorId = async (req, res) => {
  try {
    const doctor = await Docter.findById(req.params.id).populate("myDocumentId");

    if (!doctor) {
      return res.send({
        success: 0,
        message: "Doctor not found",
      });
    }

    // ✅ FOR SUB-ADMIN, CHECK LOCATION PERMISSION
    if (req.subAdmin) {
      const { locationAccess } = req.subAdmin;
      const hasLocationAccess = (
        (!locationAccess.countries || locationAccess.countries.length === 0 || locationAccess.countries.includes(doctor.country)) &&
        (!locationAccess.states || locationAccess.states.length === 0 || locationAccess.states.includes(doctor.state)) &&
        (!locationAccess.cities || locationAccess.cities.length === 0 || locationAccess.cities.includes(doctor.city))
      );
      
      if (!hasLocationAccess) {
        return res.status(403).send({
          success: 0,
          message: "Access denied to this doctor"
        });
      }
    }

    if (!doctor.myDocumentId) {
      return res.send({
        success: 0,
        message: "No document linked to this doctor",
      });
    }

    return res.send({
      success: 1,
      message: "Document fetched successfully",
      data: doctor.myDocumentId,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ 1. Approve a specific document field - UPDATED WITH PERMISSION CHECK
const approveDocumentField = async (req, res) => {
  try {
    const { field } = req.body;

    // ✅ CHECK PERMISSION FOR SUB-ADMIN
    if (req.subAdmin && !req.subAdmin.permissions?.doctors?.edit) {
      return res.status(403).send({
        success: 0,
        message: "No permission to approve documents",
      });
    }

    if (!field) {
      return res.send({
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
      return res.send({
        success: 0,
        message: "Invalid field name",
      });
    }

    const doctor = await Docter.findById(req.params.id);
    if (!doctor) {
      return res.send({
        success: 0,
        message: "Doctor not found",
      });
    }

    // ✅ FOR SUB-ADMIN, CHECK LOCATION PERMISSION
    if (req.subAdmin) {
      const { locationAccess } = req.subAdmin;
      const hasLocationAccess = (
        (!locationAccess.countries || locationAccess.countries.length === 0 || locationAccess.countries.includes(doctor.country)) &&
        (!locationAccess.states || locationAccess.states.length === 0 || locationAccess.states.includes(doctor.state)) &&
        (!locationAccess.cities || locationAccess.cities.length === 0 || locationAccess.cities.includes(doctor.city))
      );
      
      if (!hasLocationAccess) {
        return res.status(403).send({
          success: 0,
          message: "Access denied to this doctor"
        });
      }
    }

    if (!doctor.myDocumentId) {
      return res.send({
        success: 0,
        message: "No document linked to this doctor",
      });
    }

    const update = {};
    update[field] = "1";

    const updatedDoc = await Document.findByIdAndUpdate(
      doctor.myDocumentId,
      update,
      { new: true }
    );

    if (!updatedDoc) {
      return res.send({
        success: 0,
        message: "Document not found",
      });
    }

    return res.send({
      success: 1,
      message: `${field} approved successfully`,
      data: updatedDoc,
    });
  } catch (error) {
    console.error("Error approving doctor document field:", error);
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ 2. Reject a specific document field - UPDATED WITH PERMISSION CHECK
const rejectDocumentField = async (req, res) => {
  try {
    const { field, rejectReason } = req.body;

    // ✅ CHECK PERMISSION FOR SUB-ADMIN
    if (req.subAdmin && !req.subAdmin.permissions?.doctors?.edit) {
      return res.status(403).send({
        success: 0,
        message: "No permission to reject documents",
      });
    }

    if (!field || !rejectReason) {
      return res.send({
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
      return res.send({
        success: 0,
        message: "Invalid field name",
      });
    }

    const doctor = await Docter.findById(req.params.id);
    if (!doctor) {
      return res.send({
        success: 0,
        message: "Doctor not found",
      });
    }

    // ✅ FOR SUB-ADMIN, CHECK LOCATION PERMISSION
    if (req.subAdmin) {
      const { locationAccess } = req.subAdmin;
      const hasLocationAccess = (
        (!locationAccess.countries || locationAccess.countries.length === 0 || locationAccess.countries.includes(doctor.country)) &&
        (!locationAccess.states || locationAccess.states.length === 0 || locationAccess.states.includes(doctor.state)) &&
        (!locationAccess.cities || locationAccess.cities.length === 0 || locationAccess.cities.includes(doctor.city))
      );
      
      if (!hasLocationAccess) {
        return res.status(403).send({
          success: 0,
          message: "Access denied to this doctor"
        });
      }
    }

    if (!doctor.myDocumentId) {
      return res.send({
        success: 0,
        message: "No document linked to this doctor",
      });
    }

    const update = {
      [field]: "2",
      [`rejectReasons.${field}`]: rejectReason,
    };

    const updatedDoc = await Document.findByIdAndUpdate(
      doctor.myDocumentId,
      update,
      { new: true }
    );

    if (!updatedDoc) {
      return res.send({
        success: 0,
        message: "Document not found",
      });
    }

    return res.send({
      success: 1,
      message: `${field} rejected with reason`,
      data: updatedDoc,
    });
  } catch (error) {
    console.error("Error rejecting doctor document field:", error);
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ API 2: Verify account - UPDATED WITH PERMISSION CHECK
const verifyDoctorAccount = async (req, res) => {
  try {
    // ✅ CHECK PERMISSION FOR SUB-ADMIN
    if (req.subAdmin && !req.subAdmin.permissions?.doctors?.edit) {
      return res.status(403).send({
        success: 0,
        message: "No permission to verify doctors",
      });
    }

    const doctor = await Docter.findById(req.params.id);
    if (!doctor) {
      return res.send({
        success: 0,
        message: "Doctor not found",
      });
    }

    // ✅ FOR SUB-ADMIN, CHECK LOCATION PERMISSION
    if (req.subAdmin) {
      const { locationAccess } = req.subAdmin;
      const hasLocationAccess = (
        (!locationAccess.countries || locationAccess.countries.length === 0 || locationAccess.countries.includes(doctor.country)) &&
        (!locationAccess.states || locationAccess.states.length === 0 || locationAccess.states.includes(doctor.state)) &&
        (!locationAccess.cities || locationAccess.cities.length === 0 || locationAccess.cities.includes(doctor.city))
      );
      
      if (!hasLocationAccess) {
        return res.status(403).send({
          success: 0,
          message: "Access denied to this doctor"
        });
      }
    }

    // Check if already approved
    if (doctor.Accountverify === '1') {
      return res.status(400).send({
        success: 0,
        message: "Doctor is already approved"
      });
    }

    const updatedDoctor = await Docter.findByIdAndUpdate(
      req.params.id,
      { 
        Accountverify: "1",
        rejectReason: ''
      },
      { new: true }
    ).select('name email specialist Accountverify rejectReason');

    return res.send({
      success: 1,
      message: "Doctor account verified successfully",
      data: updatedDoctor,
    });
  } catch (error) {
    console.error("Error verifying doctor account:", error);
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// PATCH: Reject doctor account - UPDATED WITH PERMISSION CHECK
const rejectDoctorAccount = async (req, res) => {
  try {
    const { rejectReason } = req.body;

    // ✅ CHECK PERMISSION FOR SUB-ADMIN
    if (req.subAdmin && !req.subAdmin.permissions?.doctors?.edit) {
      return res.status(403).send({
        success: 0,
        message: "No permission to reject doctors",
      });
    }

    if (!rejectReason) {
      return res.send({
        success: 0,
        message: "Reject reason is required",
      });
    }

    const doctor = await Docter.findById(req.params.id);
    if (!doctor) {
      return res.send({
        success: 0,
        message: "Doctor not found",
      });
    }

    // ✅ FOR SUB-ADMIN, CHECK LOCATION PERMISSION
    if (req.subAdmin) {
      const { locationAccess } = req.subAdmin;
      const hasLocationAccess = (
        (!locationAccess.countries || locationAccess.countries.length === 0 || locationAccess.countries.includes(doctor.country)) &&
        (!locationAccess.states || locationAccess.states.length === 0 || locationAccess.states.includes(doctor.state)) &&
        (!locationAccess.cities || locationAccess.cities.length === 0 || locationAccess.cities.includes(doctor.city))
      );
      
      if (!hasLocationAccess) {
        return res.status(403).send({
          success: 0,
          message: "Access denied to this doctor"
        });
      }
    }

    const updatedDoctor = await Docter.findByIdAndUpdate(
      req.params.id,
      {
        Accountverify: "2",
        rejectReason: rejectReason.trim()
      },
      { new: true }
    ).select('name email specialist Accountverify rejectReason');

    return res.send({
      success: 1,
      message: "Doctor account rejected successfully",
      data: updatedDoctor,
    });
  } catch (error) {
    console.error("Error rejecting doctor account:", error);
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ API 3: Add insurance type to prescription
// method: POST
// End point: /doctorAccess/addInsuranceType
const createInsurance = async (req, res) => {
  try {
    const insuranceData = req.body;
    const data = await InsuranceModel.create(insuranceData);

    return res.send({
      success: 1,
      message: "Insurance type created successfully",
      details: data,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ API to get coupons by doctor ID (Admin side)
// Method: GET
// Endpoint: /doctorAccess/getCouponsByDoctorId
const getCouponsByDoctorId = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.send({
        success: 0,
        message: "Doctor ID is required in query",
      });
    }

    // ✅ FOR SUB-ADMIN, CHECK LOCATION PERMISSION
    const doctor = await Docter.findById(id);
    if (!doctor) {
      return res.send({
        success: 0,
        message: "Doctor not found",
      });
    }

    if (req.subAdmin) {
      const { locationAccess } = req.subAdmin;
      const hasLocationAccess = (
        (!locationAccess.countries || locationAccess.countries.length === 0 || locationAccess.countries.includes(doctor.country)) &&
        (!locationAccess.states || locationAccess.states.length === 0 || locationAccess.states.includes(doctor.state)) &&
        (!locationAccess.cities || locationAccess.cities.length === 0 || locationAccess.cities.includes(doctor.city))
      );
      
      if (!hasLocationAccess) {
        return res.status(403).send({
          success: 0,
          message: "Access denied to this doctor's coupons"
        });
      }
    }

    const findCoupons = await Coupon.find({
      doctorId: id,
      status: { $ne: "2" }, // Not deleted
    });

    if (!findCoupons || findCoupons.length === 0) {
      return res.send({
        success: 0,
        message: "No coupons found for this doctor",
      });
    }

    return res.send({
      success: 1,
      message: "Coupons fetched successfully",
      details: findCoupons,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// doctorAccess/Membership
const Membership = async (req, res) => {
  try {
    const { BloodSugar, AgeGroup, HadDiabetes, LifeStyle, Price } = req.body;

    if (
      !Array.isArray(BloodSugar) ||
      !Array.isArray(AgeGroup) ||
      !Array.isArray(HadDiabetes) ||
      !Array.isArray(LifeStyle)
    ) {
      return res.status(400).send({
        success: 0,
        message: "All fields must be arrays.",
      });
    }

    const data = new membership({
      BloodSugar,
      AgeGroup,
      HadDiabetes,
      LifeStyle,
      Price,
      adminId: req.user._id, // admin id from middleware
    });

    await data.save();

    return res.status(200).send({
      success: 1,
      message: "Membership data added successfully",
      data,
    });
  } catch (error) {
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// doctorAccess/getMembership
const getMembership = async (req, res) => {
  try {
    const userId = req.user._id; // user ID from token

    const data = await membership.find();

    if (!data.length) {
      return res.status(404).send({
        success: 0,
        message: "No membership data found",
      });
    }

    return res.status(200).send({
      success: 1,
      userId: userId, // return user's ID from token
      data: data[0],
    });
  } catch (error) {
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// doctorAccess/calculateDiscountedPrice
const calculateDiscountedPrice = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get the latest membership template (assume one global record with adminId)
    const membershipData = await membership.findOne().sort({ _id: -1 });

    if (!membershipData) {
      return res.status(404).send({
        success: 0,
        message: "Membership template not found",
      });
    }

    const {
      BloodSugar: selectedBloodSugar,
      AgeGroup: selectedAgeGroup,
      HadDiabetes: selectedHadDiabetes,
      LifeStyle: selectedLifeStyle,
    } = req.body;

    const basePrice = membershipData.Price || 0;
    if (basePrice === 0) {
      return res.status(400).send({
        success: 0,
        message: "Price not set in membership data",
      });
    }

    let totalPercent = 0;

    const countDiscount = (fieldArray, selectedValue) => {
      const index = fieldArray.indexOf(selectedValue);
      return index !== -1 ? (index + 1) * 5 : 0; // 5%, 10%, 15%...
    };

    totalPercent += countDiscount(membershipData.BloodSugar, selectedBloodSugar);
    totalPercent += countDiscount(membershipData.AgeGroup, selectedAgeGroup);
    totalPercent += countDiscount(membershipData.HadDiabetes, selectedHadDiabetes);
    totalPercent += countDiscount(membershipData.LifeStyle, selectedLifeStyle);

    const discountAmount = (basePrice * totalPercent) / 100;
    const finalPrice = basePrice - discountAmount;

    return res.status(200).send({
      success: 1,
      message: "Discount calculated successfully",
      userId,
      basePrice,
      totalPercent,
      discountAmount,
      finalPrice,
    });
  } catch (error) {
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ GET DOCTOR STATISTICS - NEW FUNCTION
const getDoctorStats = async (req, res) => {
  try {
    const locationFilters = req.locationFilters || {};
    
    console.log("📊 Fetching doctor stats with filters:", locationFilters);

    // Total doctors count
    const totalDoctors = await Docter.countDocuments(locationFilters);
    
    // Monthly stats
    const monthlyStats = await Docter.aggregate([
      {
        $match: locationFilters
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      },
      {
        $project: {
          year: "$_id.year",
          month: "$_id.month",
          count: 1,
          _id: 0
        }
      }
    ]);

    // Status-wise counts
    const verifiedDoctors = await Docter.countDocuments({ 
      ...locationFilters, 
      Accountverify: "1" 
    });
    
    const pendingDoctors = await Docter.countDocuments({ 
      ...locationFilters, 
      Accountverify: "0" 
    });
    
    const rejectedDoctors = await Docter.countDocuments({ 
      ...locationFilters, 
      Accountverify: "2" 
    });

    console.log(`✅ Doctor stats: ${totalDoctors} total doctors`);

    return res.status(200).json({
      success: true,
      message: "Doctor statistics fetched successfully",
      data: {
        totalDoctors,
        verifiedDoctors,
        pendingDoctors,
        rejectedDoctors,
        monthlyStats: monthlyStats
      },
      appliedFilters: locationFilters
    });

  } catch (error) {
    console.error("Error fetching doctor statistics:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching doctor statistics",
      error: error.message
    });
  }
};

module.exports = {
  getDoctors,
  getDocumentByDoctorId,
  verifyDoctorAccount,
  rejectDoctorAccount,
  approveDocumentField,
  rejectDocumentField,
  createInsurance,
  getCouponsByDoctorId,
  Membership,
  getMembership,
  calculateDiscountedPrice,
  getDoctorStats
};