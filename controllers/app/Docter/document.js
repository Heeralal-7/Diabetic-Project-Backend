const Document = require("../../../modal/Document");
const Doctor = require("../../../modal/docter");

const mydocument = async (req, res) => {
  try {
    const doctorId = req.user._id;

    // 1. Find or create the document
    let document = await Document.findOne({ doctorId });

    if (!document) {
      document = await Document.create({ doctorId });
      console.log("Created new document entry");
    }

    // 2. Always ensure myDocumentId is set on Doctor (even if already existed)
    await Doctor.updateOne(
      { _id: doctorId },
      { $set: { myDocumentId: document._id } }
    );

    // 3. Prepare file paths
    const aadharCardPaths = [];
    const panCardPaths = [];
    const drivingLicencePaths = [];

    if (req.files?.aadharCard) {
      req.files.aadharCard.forEach((file) => {
        aadharCardPaths.push(`/doctor/aadharCard/${file.filename}`);
      });
    }

    if (req.files?.panCard) {
      req.files.panCard.forEach((file) => {
        panCardPaths.push(`/doctor/panCard/${file.filename}`);
      });
    }

    if (req.files?.drivingLicence) {
      req.files.drivingLicence.forEach((file) => {
        drivingLicencePaths.push(`/doctor/drivingLicence/${file.filename}`);
      });
    }

    // 4. Prepare update data for Document
    const updateData = {
      licenceNo: req.files?.licenceImage
        ? `/doctor/licenceImage/${req.files.licenceImage[0].filename}`
        : document.licenceNo,
      accreditation: req.files?.accreditation
        ? `/doctor/accreditation/${req.files.accreditation[0].filename}`
        : document.accreditation,
      aadharCard: aadharCardPaths.length > 0 ? aadharCardPaths : document.aadharCard,
      panCard: panCardPaths.length > 0 ? panCardPaths : document.panCard,
      drivingLicence:
        drivingLicencePaths.length > 0
          ? drivingLicencePaths
          : document.drivingLicence,
      doctorCertificate: req.files?.doctorCertificate
        ? `/doctor/doctorCertificate/${req.files.doctorCertificate[0].filename}`
        : document.doctorCertificate,
    };

    // 5. Update the document
    await Document.updateOne({ doctorId }, { $set: updateData });

    return res.send({
      success: 1,
      message: "Documents updated and linked successfully",
    });
  } catch (error) {
    console.error("Document update failed:", error);
    return res.status(500).send({
      success: 0,
      message: error.message || "Something went wrong",
    });
  }
};

module.exports = { mydocument };
