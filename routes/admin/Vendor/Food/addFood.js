const {Router} = require('express')
const { createCategory, getFoodVendorsLists, inactivefood, getfoodstatus,addMeal, getMeal, getCategory } = require('../../../../controllers/admin/Vendor/Food/addFood')
const multer = require('multer');

const route = Router()


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      if (file.fieldname === "foodImage") {
        cb(null, "uploads/admin/vendor/foodImage");
      } else {
        cb(new Error("Unknown field"));
      }
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    },
  });
  
  const substorage = multer.diskStorage({
    destination: function (req, file, cb) {
      if (file.fieldname === "MealImage") {
        cb(null, "uploads/admin/MealImage");
      } else {
        cb(new Error("Unknown field"));
      }
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    }
  });
  
  

  
  const upload = multer({ storage: storage });
  const upload1 = multer({ storage: substorage });


route.post('/addCategory' , upload.single("foodImage"),createCategory)
route.get("/FoodVendors",getFoodVendorsLists)
route.get("/inactivefood",inactivefood)
route.get("/getfoodstatus",getfoodstatus)
route.post("/addmeal", upload1.single("MealImage"),addMeal)
route.get("/getmeal", getMeal)
route.get("/getcategory", getCategory)
module.exports = route