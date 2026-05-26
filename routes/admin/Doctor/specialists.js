const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const route = Router();
const { specialist } = require('../../../controllers/admin/Doctor/specialists');
 
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
   
        cb(null, './uploads/specialists');
    },
    filename: (req, file, cb) => {
       
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
 
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only images (jpeg, jpg, png, gif) are allowed!'), false);
    }
};
 
 
const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
    fileFilter: fileFilter
});
 
 
route.post('/create', upload.single('specialistImage'), specialist);
 
module.exports = route;
 