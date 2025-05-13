const { Router } = require("express");
const multer = require("multer");

const { middlewere } = require("../../../../middleware/auth");
const {
  createMember,
  getAllMemberOfPatients,
} = require("../../../../controllers/app/user/Doctor/AddPatients");

const route = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/user/avatar");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

route.post("/", upload.single("image"), middlewere, createMember);

route.get("/", middlewere, getAllMemberOfPatients);

// route.patch('/updatestatus', VendorMiddleware,updateAppointmentStatus)

module.exports = route;
