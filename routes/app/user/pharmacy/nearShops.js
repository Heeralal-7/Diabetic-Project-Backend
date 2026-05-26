const { Router } = require("express");
const multer = require("multer");
const path = require("path");
const { middlewere } = require("../../../../middleware/auth");
const { 
    shopsNear, getAvailableProducts, getVendorsByProduct, addToCart, 
    checkCartVendorConflict, getCartByUser, removeCartItem, checkout, 
    confirmOrder, updateCartQuantity, getAvailableMedicines, getVendorsByMedicine, 
    getVendoravailability, getOrderHistory, getVendorProducts, getVendorMedicines, 
    trackOrder, getPopularProducts, getPopularMedicines, clearCart, 
    uploadPrescription 
} = require("../../../../controllers/app/user/pharmacy/nearShops");

const route = Router();

// ✅ Multer Configuration for Prescription Upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Ensure this directory exists in your project or create it dynamically
        cb(null, "uploads/user/prescription/"); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'rx-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

route.post("/get", middlewere, shopsNear);
route.get('/getProducts', middlewere, getAvailableProducts);
route.get("/getVendorDetails", middlewere, getVendorsByProduct);
route.get('/medicine/getMedicines', middlewere, getAvailableMedicines);
route.get("/medicine/getVendorDetails", middlewere, getVendorsByMedicine);

route.post("/checkCartVendor", middlewere, checkCartVendorConflict);
route.post("/addToCart", middlewere, addToCart);
route.get("/getCart", middlewere, getCartByUser);
route.patch("/updateCartQuantity", middlewere, updateCartQuantity);
route.delete("/removeCart", middlewere, removeCartItem);

route.post("/checkout", middlewere, checkout);
route.post("/confirmOrder", middlewere, confirmOrder);

// ✅ New Route for Prescription Upload
route.post("/uploadPrescription", middlewere, upload.single('image'), uploadPrescription);

route.post("/getCart", middlewere, getCartByUser);
route.get("/getVendorAvailability", middlewere, getVendoravailability);
route.get("/order-history", middlewere, getOrderHistory);
route.get("/track-order", middlewere, trackOrder);

route.get("/vendor/products", middlewere, getVendorProducts);
route.get("/vendor/medicines", middlewere, getVendorMedicines);

route.get("/popularProducts", middlewere, getPopularProducts);
route.get("/medicine/popularMedicines", middlewere, getPopularMedicines);
route.delete("/clearCart", middlewere, clearCart);

module.exports = route;