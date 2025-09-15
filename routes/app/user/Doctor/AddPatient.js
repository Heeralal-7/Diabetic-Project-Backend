const { Router } = require("express");
const multer = require("multer");

const { middlewere } = require("../../../../middleware/auth");
const {
  createMember,
  getAllMemberOfPatients,
  addpatient,
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

const storage1 = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "pic") {
      cb(null, "uploads/user/lab/pic");
    } else {
      cb(new Error("Unknown field"));
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});


const upload = multer({ storage: storage });
const upload1 = multer({ storage: storage1 });


route.post("/", upload.single("image"), middlewere, createMember);

route.get("/", middlewere, getAllMemberOfPatients);
route.post("/addpatient",upload1.single("pic"), middlewere,addpatient)
// route.patch('/updatestatus', VendorMiddleware,updateAppointmentStatus)

module.exports = route;
