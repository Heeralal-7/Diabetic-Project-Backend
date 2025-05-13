const { Router } = require("express");
const multer = require("multer");
const { middlewere } = require("../../../middleware/auth");
const {
  userPrescription,
  getPrescription,
  deletePrescription,
} = require("../../../controllers/app/user/userprescription");

const route = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/user/recordprescription");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

route.post(
  "/create-pres",
  middlewere,
  upload.single("image"),

  userPrescription
);

route.get("/get", middlewere, getPrescription);
route.delete("/delete/:id" , middlewere , deletePrescription)
module.exports = route;
