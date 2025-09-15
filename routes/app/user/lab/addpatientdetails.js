const { Router } = require("express");
const { middlewere } = require("../../../../middleware/auth");
const multer = require("multer");
const {
  addpatient,
  getPatient,
  updatePatientAddress,
  deletePatientAddress,
} = require("../../../../controllers/app/vandor/lab/addPatientdetails");
const route = Router();

const storage = multer.diskStorage({
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

route.post("/new", upload.single("pic"), middlewere, addpatient);
route.get("/fetch", middlewere, getPatient);
route.put("/update/:id", middlewere, updatePatientAddress);
route.delete("/delete/:id", middlewere, deletePatientAddress);

module.exports = route;
