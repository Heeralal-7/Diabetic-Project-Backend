const { Router } = require("express");
const { VendorMiddleware } = require("../../../../middleware/auth");
const {
 
    getHospitalProductsData,
    updateHospitalProductStock,
    getVendorHospitalProducts,
    getVendorOrders,
    acceptVendorOrder,
    getAcceptedVendorOrders,
    rejectVendorOrder,
    getRejectedOrders,
    getAvailableDrivers,
    assignDriverToOrder,
    getPharmacyOrderWithDriver,
    getOrderHistory,
    getAllActiveOrders
} = require("../../../../controllers/app/vandor/pharmacy/addProducts");
// const multer = require("multer");
 
const route = Router();
 
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     if (file.fieldname === "photo") {
//       cb(null, "uploads/vendor/photo");
//     } else {
//       cb(new Error("Unknown field"));
//     }
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + "-" + file.originalname);
//   },
// });
 
// const upload = multer({ storage: storage });
 
 
route.get("/getProducts", VendorMiddleware, getHospitalProductsData);
route.post("/update-stock", VendorMiddleware, updateHospitalProductStock);
route.get("/vendor-products", VendorMiddleware, getVendorHospitalProducts);
 
route.get("/vendor-orders", VendorMiddleware, getVendorOrders);
route.patch("/accept-orders", VendorMiddleware, acceptVendorOrder);
route.get("/get-accepted-orders", VendorMiddleware, getAcceptedVendorOrders);
route.patch("/reject-orders", VendorMiddleware, rejectVendorOrder);
route.get("/get-rejected-orders", VendorMiddleware, getRejectedOrders);
 
route.get("/available-drivers", VendorMiddleware, getAvailableDrivers);
route.patch("/assign-driver", VendorMiddleware, assignDriverToOrder);
route.get("/get-driver-order", VendorMiddleware, getPharmacyOrderWithDriver);
route.get("/vendor-order-history", VendorMiddleware, getOrderHistory);
route.get("/active-orders", VendorMiddleware, getAllActiveOrders);
 
 
module.exports = route;
 