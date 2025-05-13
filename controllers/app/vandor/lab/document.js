const Document = require("../../../../modal/Document");

// Update Docuements
// Method : Post
// EndPoints :/update
const mydocument = async (req, res) => {
  try {
    const isExist = await Document.findOne({ vendorId: req.user._id });
    if (!isExist) {
      return res.send({
        success: 0,
        message: "No documentt found of vendor",
      });
    }

    const arr = [];
    const arr1 = [];
    const arr2 = [];
    if (req.files.addharCard) {
      const pushData = req.files.addharCard.forEach((d) => {
        const pathName = `/vendor/adharCard/${d.filename}`;
        arr.push(pathName);
      });
    }
    if (req.files.panCard) {
      const pushData = req.files.panCard.forEach((d) => {
        const pathName = `/vendor/panCard/${d.filename}`;
        arr1.push(pathName);
      });
    }
    if (req.files.drivingLicence) {
      const pushData = req.files.drivingLicence.forEach((d) => {
        const pathName = `/vendor/drivingLicence/${d.filename}`;
        arr2.push(pathName);
      });
    }

    await isExist.updateOne({
      registrationNo: req.files.register
        ? `/vendor/registration/${req.files.register[0].filename}`
        : isExist.registrationNo,
      licenceNo: req.files.licence
        ? `/vendor/licence/${req.files.licence[0].filename}`
        : isExist.licenceNo,
      accreditation: req.files.accreditation
        ? `/vendor/accreditationCertificate/${req.files.accreditation[0].filename}`
        : isExist.accreditation,
      addharCard: req.files.addharCard && arr,
      panCard: req.files.panCard && arr1,
      drivingLicence: req.files.drivingLicence && arr2,
    });

    return res.send({
      message: "Updated",
      success: 1,
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
// EndPoints :/
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
