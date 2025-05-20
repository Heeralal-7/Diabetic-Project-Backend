const { Router } = require("express");
const { VendorMiddleware } = require("../../../../middleware/auth");
const {
 
    getHospitalProductsData,
    updateHospitalProductStock,
    getVendorHospitalProducts
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
 
module.exports = route;
 