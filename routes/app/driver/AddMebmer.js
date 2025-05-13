const { Router } = require("express");
const multer = require("multer");
const { driverMiddleware } = require("../../../middleware/auth");
const {
  addMembersInAppointment,
} = require("../../../controllers/app/driver/AddMembers");

const router = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/driver/image");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.post(
  "/",
  upload.single("image"),
  driverMiddleware,
  addMembersInAppointment
);

module.exports = router;
