const {Router} = require('express');
const multer = require('multer');
const { create , getOrgan} = require('../../../../controllers/app/vandor/lab/organ');


const route = Router()

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      if (file.fieldname === "organImage") {
        cb(null, "uploads/vendor/organ");
      } else {
        cb(new Error("Unknown field"));
      }
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    },
  });
  
  const upload = multer({ storage: storage });

route.post('/add', upload.single('organImage'), create )
route.get('/get', getOrgan
)

module.exports = route