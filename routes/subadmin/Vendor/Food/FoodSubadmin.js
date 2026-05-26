const express = require('express');
const router = express.Router();
const { 
  getFoodVendors, 
  getFoodVendorById, 
  getFoodVendorsStats,
  createCategory,
  getFoodVendorsLists,
  inactivefood,
  getfoodstatus,
  addMeal,
  getMeal,
  getCategory,
  updateFoodVendorStatus
} = require('../../../../controllers/subadmin/Vendor/Food/FoodSubadmin');
const { subAdminMiddleware } = require('../../../../middleware/auth');
const multer = require('multer');

// Multer configuration
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

// ✅ MAIN FOOD VENDORS ROUTES
router.get('/', subAdminMiddleware, getFoodVendors);
router.get('/stats', subAdminMiddleware, getFoodVendorsStats);

// ✅ CATEGORY ROUTES
router.post('/addCategory', 
  subAdminMiddleware,
  upload.single("foodImage"),
  createCategory
);

router.get("/getcategory", 
  subAdminMiddleware,
  getCategory
);

// ✅ VENDOR LISTS ROUTES
router.get("/lists/FoodVendors",
  subAdminMiddleware,
  getFoodVendorsLists
);

router.get("/lists/inactivefood",
  subAdminMiddleware,
  inactivefood
);

// ✅ STATISTICS ROUTES
router.get("/stats/getfoodstatus",
  subAdminMiddleware,
  getfoodstatus
);

// ✅ MEAL ROUTES
router.post("/meals/addmeal", 
  subAdminMiddleware,
  upload1.single("MealImage"),
  addMeal
);

router.get("/meals/getmeal", 
  subAdminMiddleware,
  getMeal
);
router.get('/:id', subAdminMiddleware, getFoodVendorById);
router.patch('/:id/status', subAdminMiddleware, updateFoodVendorStatus);


module.exports = router;