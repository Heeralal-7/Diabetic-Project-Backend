// middlewares/upload.js
const multer = require('multer');
const path = require('path');
 
// Disk storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/admin/vendor/mgdrug');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
 
const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024  // 500 MB तक की अनुमति
  },
  fileFilter: (req, file, cb) => {
    // एक्सेल फाइल चेक (optional)
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.xlsx' && ext !== '.xls') {
      return cb(new Error('Only Excel files are allowed'), false);
    }
    cb(null, true);
  }
});
 
module.exports = upload;
 
 