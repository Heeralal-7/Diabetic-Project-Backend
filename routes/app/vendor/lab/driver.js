const { Router } = require("express");
const multer = require("multer");
const { VendorMiddleware } = require("../../../../middleware/auth");
const {
  createDriver,
  getDriver,
  updateDriver,
  deleteDriver,
  // getOnlineDrivers,
  updatedriverStatus,
  
} = require("../../../../controllers/app/vandor/lab/driver");

const route = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "image") {
      cb(null, "uploads/vendor/driver/image");
    } else if (file.fieldname === "drivingLicence") {
      cb(null, "uploads/vendor/driver/drivingLicence");
    } else if (file.fieldname === "certificate") {
      cb(null, "uploads/vendor/driver/certificate");
    } else if (file.fieldname === "rc") {
      cb(null, "uploads/vendor/driver/rc");
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
  "/create-driver",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "drivingLicence", maxCount: 1 },
    { name: "certificate", maxCount: 1 },
    { name: "rc", maxCount: 1 },
  ]),
  VendorMiddleware,
  createDriver
);

const storage1 = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "image") {
      cb(null, "uploads/vendor/driver/image");
    } else if (file.fieldname === "drivingLicence") {
      cb(null, "uploads/vendor/driver/drivingLicence");
    } else if (file.fieldname === "certificate") {
      cb(null, "uploads/vendor/driver/certificate");
    } else if (file.fieldname === "rc") {
      cb(null, "uploads/vendor/driver/rc");
    } else {
      cb(new Error("Unknown field"));
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload1 = multer({ storage: storage1 });

route.patch(
  "/update-driver",
  upload1.fields([
    { name: "image", maxCount: 1 },
    { name: "drivingLicence", maxCount: 1 },
    { name: "certificate", maxCount: 1 },
    { name: "rc", maxCount: 1 },
  ]),
  VendorMiddleware,
  updateDriver
);

route.get("/get-driver", VendorMiddleware, getDriver);
// route.get("/online", VendorMiddleware, getOnlineDrivers);
route.delete("/delete-driver/:id", VendorMiddleware, deleteDriver);
// route.get("/driver/assigned-orders", VendorMiddleware, getAssignedOrders);
// route.patch("/driver/update-order-status/:orderId", VendorMiddleware, updateOrderStatus);
// route.patch('/update' , updatedriverStatus)

module.exports = route;
