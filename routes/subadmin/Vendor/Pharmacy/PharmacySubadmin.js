const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { subAdminMiddleware } = require('../../../../middleware/auth');

const { 
    getPharmacyVendors,
    getPharmacyVendorById,
    getPharmacyVendorsStats,
    getAllVendorsLists,
    getpharmacystats,
    inActivePharmacy,
    uploadProductExcel,
    getAllProductData,
    deleteProduct,
    deleteMultipleProducts,
    updateProduct,
    uploadMedicineExcel,
    getAllMedicineData,
    updateMedicine,
    getPendingMedicines,
    approveMedicine,
    rejectMedicine,
    deleteMedicine,
    deleteMultipleMedicines,
    getDeliveryCharges,
    updateDeliveryCharges,
    getDeliveryChargesHistory,
    getAllProductDataSubadmin,
    updateProductStatusBySubAdmin
} = require('../../../../controllers/subadmin/Vendor/Pharmacy/PharmacySubadmin');

// 📁 Upload directory setup
const uploadDir = path.join(__dirname, "../../../../uploads/admin/vendor");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 📦 Multer Storage setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const fileType = file.fieldname === 'productFile' ? 'products' : 'medicines';
        const dir = path.join(uploadDir, fileType);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// ✅ Multer middleware config
const upload = multer({
    storage,
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB
    },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== ".xlsx" && ext !== ".xls") {
            return cb(new Error("Only Excel files are allowed"), false);
        }
        cb(null, true);
    }
});

// ✅ VENDOR MANAGEMENT ROUTES

router.get("/vendors/all", subAdminMiddleware, getAllVendorsLists);
router.get("/vendors/stats/monthly", subAdminMiddleware, getpharmacystats);
router.get("/vendors/inactive", subAdminMiddleware, inActivePharmacy);

// ✅ PRODUCT MANAGEMENT ROUTES
router.post("/products/upload", subAdminMiddleware, upload.single("productFile"), uploadProductExcel);
router.get("/products/all", subAdminMiddleware, getAllProductData);
router.get("/products/allSub", subAdminMiddleware, getAllProductDataSubadmin);
router.put("/update-product-status", subAdminMiddleware, updateProductStatusBySubAdmin);

router.delete("/products/:id", subAdminMiddleware, deleteProduct);
router.delete("/products/bulk/delete", subAdminMiddleware, deleteMultipleProducts);
router.put("/products/:id", subAdminMiddleware, updateProduct);

// ✅ MEDICINE MANAGEMENT ROUTES
router.post("/medicines/upload", subAdminMiddleware, upload.single("medicineFile"), uploadMedicineExcel);
router.get("/medicines/all", subAdminMiddleware, getAllMedicineData);
router.put("/medicines/update", subAdminMiddleware, updateMedicine);
router.get("/medicines/pending", subAdminMiddleware, getPendingMedicines);
router.patch("/medicines/approve/:id", subAdminMiddleware, approveMedicine);
router.patch("/medicines/reject/:id", subAdminMiddleware, rejectMedicine);
router.delete("/medicines/:id", subAdminMiddleware, deleteMedicine);
router.delete("/medicines/bulk/delete", subAdminMiddleware, deleteMultipleMedicines);

// ✅ DELIVERY CHARGES ROUTES
router.get("/delivery-charges", subAdminMiddleware, getDeliveryCharges);
router.patch("/delivery-charges/update", subAdminMiddleware, updateDeliveryCharges);
router.get("/delivery-charges/history", subAdminMiddleware, getDeliveryChargesHistory);


router.get('/', subAdminMiddleware, getPharmacyVendors);
router.get('/stats', subAdminMiddleware, getPharmacyVendorsStats);
router.get('/:id', subAdminMiddleware, getPharmacyVendorById);

module.exports = router;