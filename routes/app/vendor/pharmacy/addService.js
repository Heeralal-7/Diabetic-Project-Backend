const { Router } = require("express");
const { VendorMiddleware } = require("../../../../middleware/auth");
const {
  addService,
  updateServices,
  getServices,
  searchServices,
  editServices,
  getMedicineData,
  updateStockAndDiscount,
  getVendorMedicines,
  addOrUpdateShopTiming,
  getShopTimings,
  deleteShopTiming,
  bulkUpdateShopTimings,
  getCurrentShopStatus,
} = require("../../../../controllers/app/vandor/pharmacy/addService");
const multer = require("multer");
 
const route = Router();
 
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "photo") {
      cb(null, "uploads/vendor/photo");
    } else {
      cb(new Error("Unknown field"));
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
 
const upload = multer({ storage: storage });
 
route.post("/create", VendorMiddleware, upload.array("photo"), addService);
route.patch("/update/:id", VendorMiddleware, updateServices);
route.get("/get", VendorMiddleware, getServices);
route.get("/search", VendorMiddleware, searchServices);
route.patch("/edit/:id", VendorMiddleware, upload.array("photo"), editServices);
route.get("/getMedicine", VendorMiddleware, getMedicineData);
route.post("/medicine/update-stock", VendorMiddleware, updateStockAndDiscount);
route.get("/vendor-medicine", VendorMiddleware, getVendorMedicines);
route.post("/shop-timing/add", VendorMiddleware, addOrUpdateShopTiming);
route.get("/shop-timing/get", VendorMiddleware, getShopTimings);
route.delete("/shop-timing/:id", VendorMiddleware, deleteShopTiming);
route.patch("/shop-timing/bulk-update", VendorMiddleware, bulkUpdateShopTimings);
route.get("/shop-timing/current-status", VendorMiddleware, getCurrentShopStatus);

module.exports = route;
 
 