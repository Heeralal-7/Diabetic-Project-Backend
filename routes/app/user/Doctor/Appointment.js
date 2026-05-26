const { Router } = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const {
  appointment,
  getAllUserAppointments,
  appointmentReact,
  getOrderHistory
} = require("../../../../controllers/app/user/Doctor/Appiontment");
const Doctor = require("../../../../modal/docter");
const { middlewere } = require("../../../../middleware/auth");

const route = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/vendor/prescription");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

route.post(
  "/appointment",
  upload.single("prescription"),
  middlewere,
  appointment
);


route.get("/getAllDoctorAppointments",middlewere,getAllUserAppointments)
route.post("/appointmentReact",middlewere,appointmentReact)
route.get("/order-history",middlewere,getOrderHistory)
// server/routes/doctorRoutes.js में add करें

// Get doctor's clinic info
// Method: GET
// Endpoint: /doctor/:id/clinic-info
// Get doctor's clinic info - SIMPLE VERSION
// Method: GET
// Endpoint: /doctor/:id/clinic-info
route.get("/:id/clinic-info", async (req, res) => {
  try {
    const { id } = req.params;
    
    // ObjectId validation
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.send({
        success: 0,
        message: "Invalid doctor ID format"
      });
    }
    
    // Find doctor
    const doctor = await Doctor.findById(id).select("ClinicId clinicName loginType");
    
    if (!doctor) {
      return res.send({
        success: 0,
        message: "Doctor not found"
      });
    }
    
    // Check if doctor has clinic association
    const hasClinic = !!(doctor.ClinicId || doctor.loginType === "clinic");
    
    return res.send({
      success: 1,
      clinicId: doctor.ClinicId || null,
      clinicName: doctor.clinicName || null,
      hasClinic: hasClinic,
      loginType: doctor.loginType,
      message: hasClinic ? "Doctor is associated with a clinic" : "Doctor is independent"
    });
    
  } catch (error) {
    console.error("Error in clinic-info API:", error);
    return res.send({
      success: 0,
      message: error.message
    });
  }
});
// route.patch('/updatestatus', VendorMiddleware,updateAppointmentStatus)

module.exports = route;
