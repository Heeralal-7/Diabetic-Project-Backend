const {Router} = require('express')
const { 
  createCategory, 
  getFoodVendorsLists, 
  inactivefood, 
  getfoodstatus,
  addMeal, 
  getMeal, 
  getCategory 
} = require('../../../../controllers/admin/Vendor/Food/addFood')
const multer = require('multer');
const { 
  adminOrSubAdmin,
  checkPermission,
  locationFilter 
} = require('../../../../middleware/auth');
const locationFilterMiddleware = require('../../../../middleware/locationFilter');

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

// ✅ UPDATED ROUTES WITH PERMISSION & LOCATION FILTERING

route.post('/addCategory', 
  adminOrSubAdmin,
  checkPermission('vendors', 'create', 'food'),
  upload.single("foodImage"),
  createCategory
);

route.get("/FoodVendors",
  locationFilterMiddleware,
  getFoodVendorsLists
);

route.get("/inactivefood",
  adminOrSubAdmin,
  checkPermission('vendors', 'view', 'food'),
  locationFilter(),
  inactivefood
);

route.get("/getfoodstatus",
  locationFilterMiddleware,
 
  getfoodstatus
);

route.post("/addmeal", 
  adminOrSubAdmin,
  checkPermission('vendors', 'create', 'food'),
  upload1.single("MealImage"),
  addMeal
);

route.get("/getmeal", getMeal)


route.get("/getcategory", 
  adminOrSubAdmin,
  checkPermission('vendors', 'view', 'food'),
  getCategory
);

module.exports = route