const { Router } = require("express");
const { middlewere } = require("../../../../middleware/auth");
const {
  bookUserAppointment,
  bookUserAppointmentPackage,
  userorderHistory,
  getAllActiveOrderss,
} = require("../../../../controllers/app/user/labs/appointment");
const multer = require("multer");

const route = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "galleryImage") {
      cb(null, "uploads/user/lab/galleryImage");
    } else {
      cb(new Error("Unknown field"));
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

route.post(
  "/appointment",
  upload.single("galleryImage"),
  middlewere,
  bookUserAppointment
);

route.post(
  "/appointment/package",
  upload.single("galleryImage"),
  middlewere,
  bookUserAppointmentPackage
);

route.get("/userorderHistory",middlewere,userorderHistory)
route.get("/getAllActiveOrderss",middlewere,getAllActiveOrderss)
module.exports = route;
