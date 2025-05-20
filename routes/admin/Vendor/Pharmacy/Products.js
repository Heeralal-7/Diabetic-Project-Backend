const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
 
const { uploadProductExcel, getAllProductData } = require("../../../../controllers/admin/Vendor/Pharmacy/Products");
 
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
 
module.exports = router;
 
 