const { Router } = require("express");
const multer = require("multer");
const {
  appointment,
} = require("../../../../controllers/app/user/Doctor/Appiontment");
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

// route.patch('/updatestatus', VendorMiddleware,updateAppointmentStatus)

module.exports = route;
