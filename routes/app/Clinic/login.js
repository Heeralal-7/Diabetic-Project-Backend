const { Router } = require("express");
const multer = require("multer");
const { registerClinic, loginDoctor, otpSentToDcotor, otpSentToPhone, verifyPhoneOtp, verifyEmailOtp, getClinic, updateDoctors, getDoctor, editclinicDoctor, deleteDoctor, uploadAchievement, deleteAchievementImages, getClinicAchievement, service, getClinicSpecialists, removeSpecialistFromClinic, updateClinicTimings } = require("../../../controllers/app/Clinic/login");
const path = require('path');
const fs = require('fs');

const router = Router();

const {ClinicMiddleware} = require("../../../middleware/auth")

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/Clinic");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
// uploads/Clinic/certificateImage
// uploads/Clinic/licenceImage      uploads/Clinic/image
const storage1 = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "certificate") {
      cb(null, "uploads/Clinic/certificateImage");
    } else if (file.fieldname === "licenceImage") {
      cb(null, "uploads/Clinic/licenceImage");
    } else if (file.fieldname === "image") {
      cb(null, "uploads/Clinic/image");
    } else {
      cb(new Error("Unknown field"));
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
// clinicImages
const storage2 = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "image") {
      cb(null, "uploads/Clinic/image");
    } else if (file.fieldname === "posterimage") {
      cb(null, "uploads/Clinic/posterimage");
    }  else if (file.fieldname === "clinicImages") {
        cb(null, "uploads/Clinic/clinicImages");
    } else {
      cb(new Error("Unknown field"));
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const storage3 = multer.diskStorage({
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
const achievementStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/Clinic/achievement';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});

const upload = multer({ storage: storage });
const upload1 = multer({ storage: storage1 });
const upload2 = multer({ storage: storage2 });
const upload3 = multer({ storage: storage3 });

const achievementUpload = multer({
  storage: achievementStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
}).array('achievementImages', 10);

router.post(
  "/register",
  upload1.fields([
    { name: "certificate", maxCount: 1 },
    { name: "licenceImage", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  registerClinic
);

router.post("/loginDoctor",loginDoctor)

router.post("/otpSentToDcotor",otpSentToDcotor)
router.post("/otpSentToPhone",otpSentToPhone)
router.post("/verifyPhoneOtp",verifyPhoneOtp)
router.post("/verifyEmailOtp",verifyEmailOtp)
router.get("/getClinic",ClinicMiddleware,getClinic)

router.patch(
  "/update-doctor",
  upload2.fields([
    { name: "image", maxCount: 1 },
    { name: "posterimage", maxCount: 1 },
    { name: "clinicImages", maxCount: 10 }

    , // clinicImages
  ]),
  ClinicMiddleware,
  updateDoctors
);

router.get("/getDoctor",ClinicMiddleware,getDoctor)

router.put("/editclinicDoctor", upload3.fields([
  { name: "image", maxCount: 1 },
  { name: "posterimage", maxCount: 1 },
]),ClinicMiddleware,editclinicDoctor)
router.delete("/deleteDoctor",ClinicMiddleware,deleteDoctor)
router.post("/uploadAchievement",ClinicMiddleware,achievementUpload,uploadAchievement)
router.delete("/deleteAchievementImages",ClinicMiddleware,deleteAchievementImages)
router.get("/getClinicAchievement",ClinicMiddleware,getClinicAchievement)
router.post("/service",ClinicMiddleware,service)
router.get("/getClinicSpecialists",ClinicMiddleware,getClinicSpecialists)
router.delete("/removeSpecialistFromClinic",ClinicMiddleware,removeSpecialistFromClinic)
router.post("/updateClinicTimings",ClinicMiddleware,updateClinicTimings)
module.exports = router