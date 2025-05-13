const { Router } = require("express");
const { adminMiddleware } = require("../../../middleware/auth");
const multer = require("multer");
const {
  banner,
  updateBanner,
  getBanner,
  labBanner,
  removeBanner,
  updatebanner,
} = require("../../../controllers/admin/User/banner");

const route = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/admin/user/banner");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const storage1 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/admin/user/banner");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });
const upload1 = multer({ storage: storage1 });

route.post(
  "/banner",
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
    { name: "image5", maxCount: 1 },
    { name: "image6", maxCount: 1 },
  ]),
  adminMiddleware,
  banner
);

route.patch(
  "/banner-update/:id",
  upload1.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
    { name: "image5", maxCount: 1 },
    { name: "image6", maxCount: 1 },
  ]),
  adminMiddleware,
  updateBanner
);

route.get("/get-banner", getBanner);

route.post(
  "/all-banner",
  
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
    { name: "image5", maxCount: 1 },
    { name: "image6", maxCount: 1 },
  ]),
  
  adminMiddleware,
  labBanner
);

route.put('/removebann' , adminMiddleware , removeBanner)





route.patch("/updated-banner",
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
    { name: "image5", maxCount: 1 },
    { name: "image6", maxCount: 1 },
  ]),
  adminMiddleware,updatebanner)



module.exports = route;
