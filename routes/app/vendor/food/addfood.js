const {Router} = require('express')
const { VendorMiddleware } = require('../../../../middleware/auth')
const { createFood, getFood, updateStatus, editFood, searchFood, getremoveddata, getfoodcategory, getfoodSubcategory } = require('../../../../controllers/app/vandor/food/addfood')
const multer = require('multer')


const route = Router()

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      if (file.fieldname === "image") {
        cb(null, "uploads/vendor/food");
      } else {
        cb(new Error("Unknown field"));
      }
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    },
  });
  
  const upload = multer({ storage: storage });

route.post('/addfood' , VendorMiddleware , upload.array('image'),createFood)
route.get('/getfood' , VendorMiddleware , getFood)
route.patch('/status/:id' , VendorMiddleware , updateStatus)
route.patch('/edit/:id' , VendorMiddleware ,upload.array('image'), editFood)
route.get('/search', VendorMiddleware , searchFood)
route.get('/deleteStatus' , VendorMiddleware , getremoveddata)
route.get('/getCategory'  , getfoodcategory)
route.get('/getSubCategory' , VendorMiddleware , getfoodSubcategory)

module.exports = route