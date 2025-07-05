const Document = require("../../../modal/Document");
const Doctor = require("../../../modal/docter");
// doctor-document/update

const mydocument = async (req, res) => {
  try {
    const doctorId = req.user._id;

    // 1. Find or create the document
    let document = await Document.findOne({ doctorId });

    if (!document) {
      document = await Document.create({ doctorId });
      console.log("Created new document entry");
    } else {
      document = await Document.findById(document._id);
    }

    // 2. Link document to doctor
    await Doctor.updateOne(
      { _id: doctorId },
      { $set: { myDocumentId: document._id } }
    );

    // 3. Prepare helper functions
    const getFilePath = (fieldName, folder) => {
      return req.files?.[fieldName]?.[0]?.filename
        ? `/doctor/${folder}/${req.files[fieldName][0].filename}`
        : document[fieldName];
    };

    const getFileStatus = (fieldName) => {
      return req.files?.[fieldName]?.[0]?.filename ? "1" : document[`${fieldName}Status`];
    };

    const getFileArrayPaths = (fieldName, folder) => {
      return req.files?.[fieldName]
        ? req.files[fieldName].map(file => `/doctor/${folder}/${file.filename}`)
        : document[fieldName];
    };

    const getArrayStatus = (fieldName) => {
      return req.files?.[fieldName] ? "1" : document[`${fieldName}Status`];
    };

    // 4. Prepare update data
    const updateData = {
      licenceNo: getFilePath("licenceImage", "licenceImage"),
      licenceNoStatus: getFileStatus("licenceImage"),

      accreditation: getFilePath("accreditation", "accreditation"),
      accreditationStatus: getFileStatus("accreditation"),

      aadharCard: getFileArrayPaths("aadharCard", "aadharCard"),
      aadharCardStatus: getArrayStatus("aadharCard"),

      panCard: getFileArrayPaths("panCard", "panCard"),
      panCardStatus: getArrayStatus("panCard"),

      drivingLicence: getFileArrayPaths("drivingLicence", "drivingLicence"),
      drivingLicenceStatus: getArrayStatus("drivingLicence"),

      doctorCertificate: getFilePath("doctorCertificate", "doctorCertificate"),
      doctorCertificateStatus: getFileStatus("doctorCertificate"),
    };

    // 5. Update document
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
