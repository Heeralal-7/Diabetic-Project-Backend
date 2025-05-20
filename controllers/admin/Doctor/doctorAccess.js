const Docter = require("../../../modal/docter");
const Document = require("../../../modal/Document");
 
 
 
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
    const doctor = await Docter.findById(req.params.id).populate("myDocumentId");
 
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
 
 
module.exports = { getDoctors,getDocumentByDoctorId, verifyDoctorAccount,rejectDoctorAccount,approveDocumentField,rejectDocumentField };
 
 