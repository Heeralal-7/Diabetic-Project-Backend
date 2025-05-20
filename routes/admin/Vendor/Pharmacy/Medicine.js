const express = require("express");
const router = express.Router();
const upload = require("../../../../middleware/upload.js"); // adjust path
const { uploadMedicineExcel, getAllMedicineData } = require("../../../../controllers/admin/Vendor/Pharmacy/Medicine");
const { adminMiddleware } = require("../../../../middleware/auth.js");
 
// Upload Excel file
router.post("/upload-medicine-excel", upload.single("file"),adminMiddleware, uploadMedicineExcel);
 
// Get all medicine data
router.get("/get-all-medicine",adminMiddleware, getAllMedicineData);
 
module.exports = router;
 
 