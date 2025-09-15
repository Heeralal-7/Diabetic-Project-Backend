const { Router } = require("express");
const {
  getAllVendorAppointments,
  updateAppointmentStatus,
  todayAppointment,
  updateDocumentStatus,
  assignDriverToAppointment,
  getParticularAppointment,
  uploadReport,
  searchVendor,
  getHomeCollection,
  getOrderWithDrivers,
  venorderHistory,
  
} = require("../../../../controllers/app/vandor/lab/appointment");
const { VendorMiddleware } = require("../../../../middleware/auth");
const multer = require("multer");

const router = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "report") {
      cb(null, "uploads/vendor/report");
    } else {
      cb(new Error("Unknown field"));
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.get("/getallaapointments", VendorMiddleware, getAllVendorAppointments);
router.patch("/updatestatus", VendorMiddleware, updateAppointmentStatus);
router.get("/", VendorMiddleware, todayAppointment);
router.get("/particular", VendorMiddleware, getParticularAppointment);
router.patch(
  "/report/:id",
  upload.single("report"),
  VendorMiddleware,
  uploadReport
);
router.patch("/up", updateDocumentStatus);
router.patch("/assign", VendorMiddleware, assignDriverToAppointment);
router.get("/search", VendorMiddleware, searchVendor);
router.get("/getHomeCollection",VendorMiddleware,getHomeCollection)
// router.post("/assignDriverToLabOrder",VendorMiddleware,assignDriverToLabOrder)
router.get("/getOrderWithDriver",getOrderWithDrivers)
router.get("/venorderHistory",VendorMiddleware,venorderHistory)
module.exports = router;
