const { Router } = require("express");
const multer = require("multer");
const {
  userRegisterAndLogin,
  verifyUser,
  updateUserProfileData,
  updatUserImage,
  getProfile,
  getProfilePercentage,
  verfiy,
  registerUser,
} = require("../../../controllers/app/user/login");
const { middlewere } = require("../../../middleware/auth");
const { getPrivacyPolicy } = require("../../../controllers/app/user/privacypolicy");
const { checkUserActive } = require("../../../middleware/check");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "avatar") {
      cb(null, "uploads/user/avatar");
    } else if (file.fieldname === "prescription") {
      cb(null, "uploads/user/prescription");
    } else {
      cb(new Error("Unknown field"));
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

const router = Router();

router.post("/login", userRegisterAndLogin);
router.post("/verify", verifyUser);
router.get("/get", middlewere, getProfile);
router.put(
  "/update-user",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "prescription", maxCount: 1 },
  ]),
  middlewere,
  updateUserProfileData
);
router.patch(
  "/update-image",
  upload.single("avatar"),
  middlewere,
  updatUserImage
);

router.get("/", middlewere, getProfilePercentage);
router.get("/",getPrivacyPolicy)
router.post("/partner", middlewere,verfiy)
router.post("/signup",registerUser) 

module.exports = router;
