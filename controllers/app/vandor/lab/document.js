const Document = require("../../../../modal/Document");

// Update Docuements
// Method : Post
// EndPoints : /vendor-document/update
const mydocument = async (req, res) => {
  try {
    const isExist = await Document.findOne({ vendorId: req.user._id });
    if (!isExist) {
      return res.send({
        success: 0,
        message: "No document found for vendor",
      });
    }
 
    const arr = [];
    const arr1 = [];
    const arr2 = [];
 
    if (req.files.addharCard) {
      req.files.addharCard.forEach((d) => {
        const pathName = `/vendor/adharCard/${d.filename}`;
        arr.push(pathName);
      });
    }
 
    if (req.files.panCard) {
      req.files.panCard.forEach((d) => {
        const pathName = `/vendor/panCard/${d.filename}`;
        arr1.push(pathName);
      });
    }
 
    if (req.files.drivingLicence) {
      req.files.drivingLicence.forEach((d) => {
        const pathName = `/vendor/drivingLicence/${d.filename}`;
        arr2.push(pathName);
      });
    }
 
    // Prepare update object dynamically
    const updateData = {};
 
    if (req.files.register) {
      updateData.registrationNo = `/vendor/registration/${req.files.register[0].filename}`;
      updateData.registrationNoStatus = "0";
    }
 
    if (req.files.licence) {
      updateData.licenceNo = `/vendor/licence/${req.files.licence[0].filename}`;
      updateData.licenceNoStatus = "0";
    }
 
    if (req.files.accreditation) {
      updateData.accreditation = `/vendor/accreditationCertificate/${req.files.accreditation[0].filename}`;
      updateData.accreditationStatus = "0";
    }
 
    if (arr.length > 0) {
      updateData.aadharCard = arr;
      updateData.aadharCardStatus = "0";
    }
 
    if (arr1.length > 0) {
      updateData.panCard = arr1;
      updateData.panCardStatus = "0";
    }
 
    if (arr2.length > 0) {
      updateData.drivingLicence = arr2;
      updateData.drivingLicenceStatus = "0";
    }
 
    await isExist.updateOne(updateData);
 
    return res.send({
      success: 1,
      message: "Updated",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Get Vendors Docuements
// Method : Get
// EndPoints  /vendor-document
const getVendorDocuments = async (req, res) => {
  try {
    const doc = await Document.find({ vendorId: req.user._id });
    if (!doc) {
      return res.send({
        success: 1,
        message: "No vendor documents found",
      });
    }

    return res.send({
      success: 1,
      message: "Fetched vendor documents",
      details: doc,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};



module.exports = {
  mydocument,
  getVendorDocuments,
};
