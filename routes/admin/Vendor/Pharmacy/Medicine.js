const express = require("express");
const router = express.Router();
const upload = require("../../../../middleware/upload.js"); // adjust path
const { uploadMedicineExcel, getAllMedicineData,getPendingMedicines,
    approveMedicine,
    rejectMedicine,
    updateMedicine } = require("../../../../controllers/admin/Vendor/Pharmacy/Medicine");
const { adminMiddleware } = require("../../../../middleware/auth.js");
 
// Upload Excel file
router.post("/upload-medicine-excel", upload.single("file"),adminMiddleware, uploadMedicineExcel);
 
// Get all medicine data
router.get("/get-all-medicine",adminMiddleware, getAllMedicineData);
 
router.get("/pending-medicine",adminMiddleware, getPendingMedicines);
router.patch("/approve-medicine/:id",adminMiddleware, approveMedicine);      
router.patch("/reject-medicine/:id",adminMiddleware, rejectMedicine);
router.patch("/update-medicine", adminMiddleware, updateMedicine);
 
module.exports = router;
 
 