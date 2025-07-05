const { Router } = require("express");
const multer = require("multer");
const { ClinicMiddleware } = require("../../../middleware/auth");
const { mydocuments } = require("../../../controllers/app/Clinic/Document");
const router = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "licenceImage") {
      cb(null, "uploads/Clinic/licenceImage");
    } else if (file.fieldname === "accreditation") {
      cb(null, "uploads/Clinic/accreditation");
    } else if (file.fieldname === "doctorCertificate") {
      cb(null, "uploads/Clinic/doctorCertificate");
    } else if (file.fieldname === "aadharCard") {
      cb(null, "uploads/Clinic/aadharCard");
    } else if (file.fieldname === "panCard") {
      cb(null, "uploads/Clinic/panCard");
    } else if (file.fieldname === "drivingLicence") {
      cb(null, "uploads/Clinic/drivingLicence");
    } else {
      cb(new Error("Unknown field"));
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.post(
  "/update",
  upload.fields([
    { name: "licenceImage", maxCount: 1 },
    { name: "doctorCertificate", maxCount: 1 },
    { name: "accreditation", maxCount: 1 },
    { name: "aadharCard", maxCount: 4 },
    { name: "panCard", maxCount: 4 },
    { name: "drivingLicence", maxCount: 4 },
  ]),
  ClinicMiddleware,
  mydocuments
);

module.exports = router;
