const Documents = require("../../../../modal/Document");

//       updateData.aadharCardStatus = "1";
//       updateData.panCardStatus = "1";
//       updateData.drivingLicenceStatus = "1";
//       updateData.vendorCertificateStatus = "1";
//       updateData.licenceNoStatus = "1";    
const getDocuments = async (req, res) => {
  try {
    const { id } = req.query;
    const data = await Documents.find({ vendorId: id });
    if (!data) {
      return res.send({
        success: 0,
        message: "Not authorized",
      });
    }

    return res.send({
      success: 1,
      message: "Fetched",
      details: data,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};


// ✅ API 2: Approve a specific document field for vendor
// PATCH /vendor-document/approveVendorDocumentField/:id
const approveVendorDocumentField = async (req, res) => {
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
    update[field] = "1"; // approved status

    const updatedDoc = await Documents.findByIdAndUpdate(req.params.id, update, {
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

// ✅ API 3: Reject a specific document field for vendor
// PATCH /vendor-document/rejectVendorDocumentField/:id
const rejectVendorDocumentField = async (req, res) => {
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
      "vendorCertificateStatus",
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

    const updatedDoc = await Documents.findByIdAndUpdate(req.params.id, update, {
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


// ✅ API 1: Get documents by vendor ID
// method: GET
// End point: /vendor-document/getDocumentsByVendorId/:id
const getDocumentsByVendorId = async (req, res) => {
  try {
    const documents = await Documents.find({ vendorId: req.params.id });

    if (!documents || documents.length === 0) {
      return res.send({
        success: 0,
        message: "No documents found for this vendor",
      });
    }

    return res.send({
      success: 1,
      message: "Documents fetched successfully",
      data: documents,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = { getDocuments, getDocumentsByVendorId, approveVendorDocumentField, rejectVendorDocumentField };
