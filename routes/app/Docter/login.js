const { Router } = require("express");
const multer = require("multer");
const {
  registerDoctor,
  verifyEmailOtp,
  otpSentToPhone,
  verifyPhoneOtp,
  loginDoctor,
  addDocter,
  docterList,
  profleView,
  otpSentToDcotor,
  resetPassword,
  otpForForget,
  verifyForgotOtp,
  getDoctor,
  updateDoctor,
  changePassword,
} = require("../../../controllers/app/Docter/login");
const { doctorMiddleware } = require("../../../middleware/auth");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/doctor");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const storage1 = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "certificate") {
      cb(null, "uploads/doctor/certificateImage");
    } else if (file.fieldname === "licenceImage") {
      cb(null, "uploads/doctor/licenceImage");
    } else if (file.fieldname === "image") {
      cb(null, "uploads/doctor/image");
    } else {
      cb(new Error("Unknown field"));
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const storage2 = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "image") {
      cb(null, "uploads/doctor/image");
    } else if (file.fieldname === "posterimage") {
      cb(null, "uploads/doctor/posterimage");
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
const upload2 = multer({ storage: storage2 });

const router = Router();
router.post(
  "/register",
  upload1.fields([
    { name: "certificate", maxCount: 1 },
    { name: "licenceImage", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  registerDoctor
);
router.post("/email-otp-sent", otpSentToDcotor);
router.post("/email-otp-verify", verifyEmailOtp);
router.post("/phone-otp-sent", otpSentToPhone);
router.post("/phone-otp-verify", verifyPhoneOtp);
router.post("/login", loginDoctor);

router.post("/", upload.single("image"), addDocter);
router.get("/", docterList);
router.get("/profile", profleView);
router.post("/reset", resetPassword);
router.post("/otp", otpForForget);
router.post("/password", doctorMiddleware, changePassword);
router.post("/verify-otp", verifyForgotOtp);
router.get("/get-doctor", doctorMiddleware, getDoctor);
router.patch(
  "/update-doctor",
  upload2.fields([
    { name: "image", maxCount: 1 },
    { name: "posterimage", maxCount: 1 },
  ]),
  doctorMiddleware,
  updateDoctor
);

module.exports = router;
