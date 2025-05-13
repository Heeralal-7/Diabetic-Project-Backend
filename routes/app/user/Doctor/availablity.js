const { Router } = require("express");
const multer = require("multer");

const { middlewere } = require("../../../../middleware/auth");
const {
  getAvailabiltyOfVendorAndTimeInUser,
} = require("../../../../controllers/app/user/Doctor/availablity");

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

route.post("/", middlewere, getAvailabiltyOfVendorAndTimeInUser);

module.exports = route;
