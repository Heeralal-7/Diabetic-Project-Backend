const { Router } = require("express");
const multer = require("multer");
const {
  mydocument,
  getVendorDocuments,
} = require("../../../../controllers/app/vandor/lab/document");
const { VendorMiddleware } = require("../../../../middleware/auth");

const newroute = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "register") {
      cb(null, "uploads/vendor/registration");
    } else if (file.fieldname === "licence") {
      cb(null, "uploads/vendor/licence");
    } else if (file.fieldname === "accreditation") {
      cb(null, "uploads/vendor/accreditationCertificate");
    } else if (file.fieldname === "addharCard") {
      cb(null, "uploads/vendor/adharCard");
    } else if (file.fieldname === "panCard") {
      cb(null, "uploads/vendor/panCard");
    } else if (file.fieldname === "drivingLicence") {
      cb(null, "uploads/vendor/drivingLicence");
    } else {
      cb(new Error("Unknown field"));
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

newroute.post(
  "/update",
  upload.fields([
    { name: "register", maxCount: 1 },
    { name: "licence", maxCount: 1 },
    { name: "accreditation", maxCount: 1 },
    { name: "addharCard", maxCount: 4 },
    { name: "panCard", maxCount: 4 },
    { name: "drivingLicence", maxCount: 4 },
  ]),
  VendorMiddleware,
  mydocument
);
newroute.get("/", VendorMiddleware, getVendorDocuments);

module.exports = newroute;
