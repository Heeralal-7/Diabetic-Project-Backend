const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
 
const { uploadProductExcel, getAllProductData,updateProduct,deleteProduct,deleteMultipleProducts, updateProductStatus } = require("../../../../controllers/admin/Vendor/Pharmacy/Products");
 
// 📁 Upload directory setup
const uploadDir = path.join(__dirname, "../../../../uploads/admin/vendor/products");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
 
// 📦 Multer Storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
 
// ✅ Multer middleware config
const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB तक
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".xlsx" && ext !== ".xls") {
      return cb(new Error("Only Excel files are allowed"), false);
    }
    cb(null, true);
  }
});
 
// 📤 Upload Excel file
router.post("/upload-product-excel", upload.single("file"), uploadProductExcel);
 
// 📥 Get all product data
router.get("/get-all-product", getAllProductData);
router.put("/update-product-status", updateProductStatus);
// --- NEW ---
// Admin: Update a single product by ID
// Method: PUT
// Endpoint: /upload-excel-hospital/update-product/:id
router.put("/update-product/:id", updateProduct);

// --- NEW ---
// Admin: Delete a single product
// Method: DELETE
// Endpoint: /upload-excel-hospital/delete-product/:id
router.delete("/delete-product/:id", deleteProduct);

// Admin: Delete multiple products
// Method: DELETE
// Endpoint: /upload-excel-hospital/delete-multiple-products
router.delete("/delete-multiple-products", deleteMultipleProducts);

module.exports = router;
 
 