const { Router } = require("express");
const multer = require("multer");
const { doctorMiddleware } = require("../../../middleware/auth");
const { mydocument } = require("../../../controllers/app/Docter/document");
const router = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "licenceImage") {
      cb(null, "uploads/doctor/licenceImage");
    } else if (file.fieldname === "accreditation") {
      cb(null, "uploads/doctor/accreditation");
    } else if (file.fieldname === "doctorCertificate") {
      cb(null, "uploads/doctor/doctorCertificate");
    } else if (file.fieldname === "aadharCard") {
      cb(null, "uploads/doctor/aadharCard");
    } else if (file.fieldname === "panCard") {
      cb(null, "uploads/doctor/panCard");
    } else if (file.fieldname === "drivingLicence") {
      cb(null, "uploads/doctor/drivingLicence");
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
  doctorMiddleware,
  mydocument
);

module.exports = router;
