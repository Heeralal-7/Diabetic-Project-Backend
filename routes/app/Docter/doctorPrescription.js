const {Router} = require("express");
const { getMedicineData, createDoctorPrescription, getAllPrescription, Postpone, getInsurance } = require("../../../controllers/app/Docter/doctorPrescription");
const { doctorMiddleware } = require("../../../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "DietChartImage") {
      cb(null, "uploads/doctor/DietChartImage");
    } else if (file.fieldname === "insuranceImage") {
      cb(null, "uploads/doctor/insuranceImage");
    } else {
      cb(new Error("Invalid file field"), null); // handle unexpected fields
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// Initialize multer with the storage
const upload = multer({ storage });

const route = Router();

route.get("/getMedicineData",doctorMiddleware,getMedicineData);
route.post(
  "/createDoctorPrescription",
  upload.fields([
    { name: "DietChartImage", maxCount: 1 },
    { name: "insuranceImage", maxCount: 1 }
  ]),
  doctorMiddleware,
  createDoctorPrescription
);

route.get("/getAllPrescription",doctorMiddleware,getAllPrescription);
route.post("/Postpone",doctorMiddleware,Postpone);
route.get("/getInsurance",getInsurance)
// doctor-Prescription/getMedicineData
module.exports = route ;