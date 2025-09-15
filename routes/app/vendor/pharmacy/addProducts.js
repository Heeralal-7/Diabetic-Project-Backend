// File Path: routes/app/vandor/pharmacy/addProducts.js

const { Router } = require("express");
const multer = require("multer"); // Multer को import करें
const { VendorMiddleware } = require("../../../../middleware/auth");
const {
    // मौजूदा कंट्रोलर्स
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
    getAllActiveOrders,

    // नया कंट्रोलर जिसे हमने बनाया था
    addHospitalProduct 
} = require("../../../../controllers/app/vandor/pharmacy/addProducts");

const route = Router();

// 1. नया Multer Configuration
// यह कोड आपके फ्रंटएंड से भेजी गई 'photo' फील्ड की फाइलों को हैंडल करेगा
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // फाइलों को 'uploads/vendor/photo' फोल्डर में सेव करेगा
    // सुनिश्चित करें कि यह फोल्डर आपके प्रोजेक्ट में मौजूद है
    cb(null, "uploads/vendor/photo");
  },
  filename: function (req, file, cb) {
    // फाइल का नाम यूनिक बनाने के लिए डेटस्टाम्प जोड़ा गया है
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });


// --- प्रोडक्ट से संबंधित रूट्स ---

// 2. नया रूट यहाँ add करें
// यह रूट प्रोडक्ट बनाने के लिए है और इसमें multer का उपयोग किया गया है
route.post(
    "/hospital/create", 
    VendorMiddleware, 
    upload.array("photo", 5), // 'photo' फील्ड से 5 फाइलों तक को स्वीकार करेगा
    addHospitalProduct
);

route.get("/getProducts", VendorMiddleware, getHospitalProductsData);
route.post("/update-stock", VendorMiddleware, updateHospitalProductStock);
route.get("/vendor-products", VendorMiddleware, getVendorHospitalProducts);

// --- ऑर्डर से संबंधित रूट्स ---
route.get("/vendor-orders", VendorMiddleware, getVendorOrders);
route.patch("/accept-orders", VendorMiddleware, acceptVendorOrder);
route.get("/get-accepted-orders", VendorMiddleware, getAcceptedVendorOrders);
route.patch("/reject-orders", VendorMiddleware, rejectVendorOrder);
route.get("/get-rejected-orders", VendorMiddleware, getRejectedOrders);
route.get("/vendor-order-history", VendorMiddleware, getOrderHistory);
route.get("/active-orders", VendorMiddleware, getAllActiveOrders);

// --- ड्राइवर से संबंधित रूट्स ---
route.get("/available-drivers", VendorMiddleware, getAvailableDrivers);
route.patch("/assign-driver", VendorMiddleware, assignDriverToOrder);
route.get("/get-driver-order", VendorMiddleware, getPharmacyOrderWithDriver);


module.exports = route;