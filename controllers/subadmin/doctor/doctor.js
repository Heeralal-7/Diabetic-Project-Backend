const Docter = require("../../../modal/docter");
const Document = require("../../../modal/Document");
const InsuranceModel = require("../../../modal/AddInsurance");
const membership = require("../../../modal/MemberShip");
const Coupon = require("../../../modal/Coupon");
const Qualification = require("../../../modal/Qualification");
const jwt = require("jsonwebtoken");

// ✅ PERMISSION CHECK HELPER FUNCTION
const checkPermission = (subAdmin, permissionType, action) => {
  if (!subAdmin) return false;
  return subAdmin.permissions?.[permissionType]?.[action] || false;
};

// ✅ LOCATION ACCESS CHECK HELPER FUNCTION
const checkLocationAccess = (subAdmin, doctor) => {
  if (!subAdmin || !subAdmin.locationAccess) return true;
  
  const { locationAccess } = subAdmin;
  const hasCountryAccess = !locationAccess.countries || 
                          locationAccess.countries.length === 0 || 
                          locationAccess.countries.includes(doctor.country);
  
  const hasStateAccess = !locationAccess.states || 
                        locationAccess.states.length === 0 || 
                        locationAccess.states.includes(doctor.state);
  
  const hasCityAccess = !locationAccess.cities || 
                       locationAccess.cities.length === 0 || 
                       locationAccess.cities.includes(doctor.city);
  
  return hasCountryAccess && hasStateAccess && hasCityAccess;
};

// ✅ BUILD LOCATION QUERY HELPER
const buildLocationQuery = (subAdmin) => {
  let locationQuery = {};
  if (subAdmin && subAdmin.locationAccess) {
    const { locationAccess } = subAdmin;
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
  return locationQuery;
};

// ✅ GET ALL DOCTORS (With pagination, search, and filters)
const getDoctors = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    
    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    if (!checkPermission(subAdmin, 'doctors', 'view')) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view doctors",
      });
    }

    const { 
      page = 1, 
      limit = 10, 
      search = "",
      verification = "",
      specialist = "",
      country = "",
      state = "",
      city = "",
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    // ✅ BUILD LOCATION QUERY FOR SUB-ADMIN
    const locationQuery = buildLocationQuery(subAdmin);

    // ✅ BUILD SEARCH QUERY
    let searchQuery = { ...locationQuery };
    
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
        { specialist: { $regex: search, $options: "i" } }
      ];
    }

    // ✅ VERIFICATION FILTER
    if (verification) {
      searchQuery.Accountverify = verification;
    }

    // ✅ SPECIALIST FILTER
    if (specialist) {
      searchQuery.specialist = specialist;
    }

    // ✅ LOCATION FILTERS
    if (country) searchQuery.country = country;
    if (state) searchQuery.state = state;
    if (city) searchQuery.city = city;

    // ✅ SORTING
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    // ✅ PAGINATION
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // ✅ GET DOCTORS WITH PAGINATION
    const doctors = await Docter.find(searchQuery)
      .select('name email phoneNumber specialist Accountverify experience qualifications country state city createdAt')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // ✅ GET TOTAL COUNTS
    const totalDoctors = await Docter.countDocuments(searchQuery);
    const verifiedDoctors = await Docter.countDocuments({ ...searchQuery, Accountverify: "1" });
    const pendingDoctors = await Docter.countDocuments({ ...searchQuery, Accountverify: "0" });
    const rejectedDoctors = await Docter.countDocuments({ ...searchQuery, Accountverify: "2" });

    // ✅ GET SPECIALIST LIST
    const specialists = await Docter.distinct('specialist', searchQuery);

    return res.send({
      success: 1,
      message: "Doctors fetched successfully",
      data: {
        doctors,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalDoctors / limitNum),
          totalDoctors,
          hasNext: pageNum < Math.ceil(totalDoctors / limitNum),
          hasPrev: pageNum > 1
        },
        stats: {
          total: totalDoctors,
          verified: verifiedDoctors,
          pending: pendingDoctors,
          rejected: rejectedDoctors
        },
        filters: {
          specialists
        }
      }
    });

  } catch (error) {
    console.error('Get doctors error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ GET SINGLE DOCTOR DETAILS
const getDoctorById = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    const { id } = req.params;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    if (!checkPermission(subAdmin, 'doctors', 'view')) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view doctors",
      });
    }

    const doctor = await Docter.findById(id)
      .select('-password -token');

    if (!doctor) {
      return res.status(404).send({
        success: 0,
        message: "Doctor not found",
      });
    }

    // ✅ CHECK LOCATION ACCESS
    if (!checkLocationAccess(subAdmin, doctor)) {
      return res.status(403).send({
        success: 0,
        message: "No permission to access this doctor",
      });
    }

    return res.send({
      success: 1,
      message: "Doctor details fetched successfully",
      data: doctor
    });

  } catch (error) {
    console.error('Get doctor by ID error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ UPDATE DOCTOR VERIFICATION STATUS
const updateDoctorVerification = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    if (!checkPermission(subAdmin, 'doctors', 'edit')) {
      return res.status(403).send({
        success: 0,
        message: "No permission to edit doctors",
      });
    }

    const doctor = await Docter.findById(id);
    if (!doctor) {
      return res.status(404).send({
        success: 0,
        message: "Doctor not found",
      });
    }

    // ✅ CHECK LOCATION ACCESS
    if (!checkLocationAccess(subAdmin, doctor)) {
      return res.status(403).send({
        success: 0,
        message: "No permission to update this doctor",
      });
    }

    doctor.Accountverify = status;
    if (status === "2" && reason) {
      doctor.verificationReason = reason;
    }
    
    await doctor.save();

    const statusText = status === "1" ? "approved" : status === "2" ? "rejected" : "pending";

    return res.send({
      success: 1,
      message: `Doctor verification ${statusText} successfully`,
      data: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        Accountverify: doctor.Accountverify
      }
    });

  } catch (error) {
    console.error('Update doctor verification error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ DELETE DOCTOR
const deleteDoctor = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    const { id } = req.params;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    if (!checkPermission(subAdmin, 'doctors', 'delete')) {
      return res.status(403).send({
        success: 0,
        message: "No permission to delete doctors",
      });
    }

    const doctor = await Docter.findById(id);
    if (!doctor) {
      return res.status(404).send({
        success: 0,
        message: "Doctor not found",
      });
    }

    // ✅ CHECK LOCATION ACCESS
    if (!checkLocationAccess(subAdmin, doctor)) {
      return res.status(403).send({
        success: 0,
        message: "No permission to delete this doctor",
      });
    }

    await Docter.findByIdAndDelete(id);

    return res.send({
      success: 1,
      message: "Doctor deleted successfully",
      data: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email
      }
    });

  } catch (error) {
    console.error('Delete doctor error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ GET DOCUMENT BY DOCTOR ID
const getDocumentByDoctorId = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    const doctor = await Docter.findById(req.params.id).populate("myDocumentId");

    if (!doctor) {
      return res.send({
        success: 0,
        message: "Doctor not found",
      });
    }

    // ✅ CHECK PERMISSION AND LOCATION ACCESS
    if (subAdmin) {
      if (!checkPermission(subAdmin, 'doctors', 'view')) {
        return res.status(403).send({
          success: 0,
          message: "No permission to view documents",
        });
      }

      if (!checkLocationAccess(subAdmin, doctor)) {
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

// ✅ APPROVE DOCUMENT FIELD
const approveDocumentField = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    const { field } = req.body;

    // ✅ CHECK PERMISSION
    if (subAdmin && !checkPermission(subAdmin, 'doctors', 'edit')) {
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

    // ✅ CHECK LOCATION ACCESS
    if (subAdmin && !checkLocationAccess(subAdmin, doctor)) {
      return res.status(403).send({
        success: 0,
        message: "Access denied to this doctor"
      });
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

// ✅ REJECT DOCUMENT FIELD
const rejectDocumentField = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    const { field, rejectReason } = req.body;

    // ✅ CHECK PERMISSION
    if (subAdmin && !checkPermission(subAdmin, 'doctors', 'edit')) {
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

    // ✅ CHECK LOCATION ACCESS
    if (subAdmin && !checkLocationAccess(subAdmin, doctor)) {
      return res.status(403).send({
        success: 0,
        message: "Access denied to this doctor"
      });
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

// ✅ VERIFY DOCTOR ACCOUNT
const verifyDoctorAccount = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    // ✅ CHECK PERMISSION
    if (subAdmin && !checkPermission(subAdmin, 'doctors', 'edit')) {
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

    // ✅ CHECK LOCATION ACCESS
    if (subAdmin && !checkLocationAccess(subAdmin, doctor)) {
      return res.status(403).send({
        success: 0,
        message: "Access denied to this doctor"
      });
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

// ✅ REJECT DOCTOR ACCOUNT
const rejectDoctorAccount = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    const { rejectReason } = req.body;

    // ✅ CHECK PERMISSION
    if (subAdmin && !checkPermission(subAdmin, 'doctors', 'edit')) {
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

    // ✅ CHECK LOCATION ACCESS
    if (subAdmin && !checkLocationAccess(subAdmin, doctor)) {
      return res.status(403).send({
        success: 0,
        message: "Access denied to this doctor"
      });
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

// ✅ CREATE INSURANCE
const createInsurance = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    // ✅ CHECK PERMISSION
    if (subAdmin && !checkPermission(subAdmin, 'doctors', 'create')) {
      return res.status(403).send({
        success: 0,
        message: "No permission to create insurance",
      });
    }

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


// ✅ CREATE QUALIFICATION
const createQualification = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    const { qualification } = req.body;

    // ✅ CHECK PERMISSION
    if (subAdmin && !checkPermission(subAdmin, 'qualifications', 'create')) {
      return res.status(403).send({
        success: 0,
        message: "No permission to create qualifications",
      });
    }

    if (!qualification) {
      return res.send({
        success: 0,
        message: 'Qualification field is required'
      });
    }

    const newQualification = await Qualification.create({
      qualification
    });

    return res.send({
      success: 1,
      message: 'Qualification created successfully',
      data: newQualification
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message
    });
  }
};

// ✅ GET QUALIFICATIONS
const getQualifications = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    // ✅ CHECK PERMISSION
    if (subAdmin && !checkPermission(subAdmin, 'qualifications', 'view')) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view qualifications",
      });
    }

    const qualifications = await Qualification.find().sort({ createdAt: -1 });

    return res.send({
      success: 1,
      message: 'Qualifications fetched successfully',
      data: qualifications
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message
    });
  }
};

// ✅ MEMBERSHIP MANAGEMENT
const createMembership = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    const { BloodSugar, AgeGroup, HadDiabetes, LifeStyle, Price } = req.body;

    // ✅ CHECK PERMISSION
    if (subAdmin && !checkPermission(subAdmin, 'membership', 'create')) {
      return res.status(403).send({
        success: 0,
        message: "No permission to create membership",
      });
    }

    if (!Array.isArray(BloodSugar) || !Array.isArray(AgeGroup) || 
        !Array.isArray(HadDiabetes) || !Array.isArray(LifeStyle)) {
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
      adminId: req.user._id,
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

// ✅ GET MEMBERSHIP
const getMembership = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    const userId = req.user._id;

    // ✅ CHECK PERMISSION
    if (subAdmin && !checkPermission(subAdmin, 'membership', 'view')) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view membership",
      });
    }

    const data = await membership.find();

    if (!data.length) {
      return res.status(404).send({
        success: 0,
        message: "No membership data found",
      });
    }

    return res.status(200).send({
      success: 1,
      userId: userId,
      data: data[0],
    });
  } catch (error) {
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ CALCULATE DISCOUNTED PRICE
const calculateDiscountedPrice = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    const userId = req.user._id;

    // ✅ CHECK PERMISSION
    if (subAdmin && !checkPermission(subAdmin, 'membership', 'view')) {
      return res.status(403).send({
        success: 0,
        message: "No permission to calculate discounts",
      });
    }

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
      return index !== -1 ? (index + 1) * 5 : 0;
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

// ✅ GET DOCTOR STATISTICS
const getDoctorStats = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    // ✅ CHECK PERMISSION
    if (subAdmin && !checkPermission(subAdmin, 'doctors', 'view')) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view statistics",
      });
    }

    const locationQuery = buildLocationQuery(subAdmin);

    const totalDoctors = await Docter.countDocuments(locationQuery);
    const verifiedDoctors = await Docter.countDocuments({ ...locationQuery, Accountverify: "1" });
    const pendingDoctors = await Docter.countDocuments({ ...locationQuery, Accountverify: "0" });
    const rejectedDoctors = await Docter.countDocuments({ ...locationQuery, Accountverify: "2" });

    // Get doctors by specialist with location filter
    const doctorsBySpecialist = await Docter.aggregate([
      {
        $match: locationQuery
      },
      {
        $group: {
          _id: "$specialist",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentRegistrations = await Docter.countDocuments({
      ...locationQuery,
      createdAt: { $gte: sevenDaysAgo }
    });

    return res.status(200).json({
      success: true,
      message: "Doctor statistics fetched successfully",
      data: {
        totalDoctors,
        verifiedDoctors,
        pendingDoctors,
        rejectedDoctors,
        recentRegistrations,
        doctorsBySpecialist
      }
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

// ✅ GET MONTHLY DOCTOR REGISTRATION STATS
const getMonthlyDoctorStats = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    // ✅ CHECK PERMISSION
    if (subAdmin && !checkPermission(subAdmin, 'doctors', 'view')) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view statistics",
      });
    }

    const currentDate = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      };
    }).reverse();

    // Build location query for aggregation
    const locationMatch = buildLocationQuery(subAdmin);

    const doctorStats = await Docter.aggregate([
      {
        $match: locationMatch
      },
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
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    const stats = months.map(({ year, month }) => {
      const stat = doctorStats.find(
        (d) => d._id.year === year && d._id.month === month
      );
      return {
        year,
        month,
        count: stat ? stat.count : 0,
      };
    });

    return res.send({
      success: 1,
      message: "Monthly doctor registration stats",
      details: stats,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = {
  getDoctors,
  getDoctorById,
  updateDoctorVerification,
  deleteDoctor,
  getDocumentByDoctorId,
  verifyDoctorAccount,
  rejectDoctorAccount,
  approveDocumentField,
  rejectDocumentField,
  createInsurance,
  createQualification,
  getQualifications,
  createMembership,
  getMembership,
  calculateDiscountedPrice,
  getDoctorStats,
  getMonthlyDoctorStats
}; 