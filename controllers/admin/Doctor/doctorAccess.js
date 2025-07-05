const Docter = require("../../../modal/docter");
const Document = require("../../../modal/Document");
// const DoctorPrescription = require("../../../modal/DoctorPrescription");
const InsuranceModel = require("../../../modal/AddInsurance");
const membership = require("../../../modal/MemberShip");
const Coupon = require("../../../modal/Coupon");
const jwt = require("jsonwebtoken");
// Get all doctors
// method: GET
// End point /doctorAccess/getDoctors
const getDoctors = async (req, res) => {
  try {
    const doctors = await Docter.find().sort({ createdAt: -1 }); // latest first

    return res.send({
      success: 1,
      message: "Doctor list fetched successfully",
      data: doctors,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ API 1: Get document by doctor ID
// method: GET
// End point: /doctorAccess/getDocumentByDoctorId/:id
const getDocumentByDoctorId = async (req, res) => {
  try {
    const doctor = await Docter.findById(req.params.id).populate(
      "myDocumentId"
    );

    if (!doctor) {
      return res.send({
        success: 0,
        message: "Doctor not found",
      });
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
// ✅ 1. Approve a specific document field
// PATCH /doctorAccess/approveDocumentField/:id
const approveDocumentField = async (req, res) => {
  try {
    const { field } = req.body; // e.g., "panCardStatus"

    // validate field
    if (!field) {
      return res.send({
        success: 0,
        message: "Field name is required",
      });
    }

    const update = {};
    update[field] = "3"; // approved status

    const updatedDoc = await Document.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });

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
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ 2. Reject a specific document field
// PATCH /doctorAccess/rejectDocumentField/:id
const rejectDocumentField = async (req, res) => {
  try {
    const { field, rejectReason } = req.body;

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

    const update = {
      [field]: "2",
      [`rejectReasons.${field}`]: rejectReason,
    };

    const updatedDoc = await Document.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });

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
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};
// ✅ API 2: Verify account (Accountverify = "1")
// method: PATCH
// End point: /doctorAccess/verifyDoctorAccount/:id
const verifyDoctorAccount = async (req, res) => {
  try {
    const doctor = await Docter.findByIdAndUpdate(
      req.params.id,
      { Accountverify: "1" },
      { new: true }
    );

    if (!doctor) {
      return res.send({
        success: 0,
        message: "Doctor not found",
      });
    }

    return res.send({
      success: 1,
      message: "Doctor account verified successfully",
      data: doctor,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// PATCH: Reject doctor account (Accountverify = "2")
// End point: /doctorAccess/rejectDoctorAccount/:id
const rejectDoctorAccount = async (req, res) => {
  try {
    const { rejectReason } = req.body;

    if (!rejectReason) {
      return res.send({
        success: 0,
        message: "Reject reason is required",
      });
    }

    const doctor = await Docter.findByIdAndUpdate(
      req.params.id,
      {
        Accountverify: "2",
        rejectReason,
      },
      { new: true }
    );

    if (!doctor) {
      return res.send({
        success: 0,
        message: "Doctor not found",
      });
    }

    return res.send({
      success: 1,
      message: "Doctor account rejected with reason",
      data: doctor,
    });
  } catch (error) {
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
    const insuranceData = req.body; // get the insurance data from request body
    const data = await InsuranceModel.create(insuranceData); // use Mongoose model here

    return res.send({
      success: 1,
      message: "posted",
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

    // Optionally run checkCoupon if needed
    // await checkCoupon(id);

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
    const { BloodSugar, AgeGroup, HadDiabetes, LifeStyle,Price } = req.body;

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
  calculateDiscountedPrice
};
