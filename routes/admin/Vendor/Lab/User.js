const { Router } = require("express");
const { 
  adminMiddleware, 
  subAdminMiddleware,
  checkPermission,
  locationFilter 
} = require("../../../../middleware/auth");
const {
  getAllVendorsLists,
  searchVendor,
  getVendor,
  searchVendorTest,
  status,
  getlabstats,
  inActivlabs,
} = require("../../../../controllers/admin/Vendor/Lab/User");
const locationFilterMiddleware = require("../../../../middleware/locationFilter");

const router = Router();

// ✅ COMMON MIDDLEWARE FOR ADMIN & SUB-ADMIN
const adminOrSubAdmin = (req, res, next) => {
  if (req.headers.token) {
    // Try admin first
    adminMiddleware(req, res, (err) => {
      if (err) {
        // If admin fails, try sub-admin
        subAdminMiddleware(req, res, next);
      } else {
        next();
      }
    });
  } else {
    return res.status(401).json({ 
      success: 0, 
      message: "No token provided" 
    });
  }
};

// ✅ ROUTES WITH PERMISSION & LOCATION FILTERING
router.get("/", 
  locationFilterMiddleware,
  getAllVendorsLists
);

router.get("/search", 
  adminOrSubAdmin,
  checkPermission('vendors', 'view'),
  locationFilter(),
  searchVendor
);

router.get("/get-vendor/:id", 
  adminOrSubAdmin,
  checkPermission('vendors', 'view'),
  getVendor
);

router.get("/search-test", 
  adminOrSubAdmin,
  checkPermission('vendors', 'view'),
  searchVendorTest
);

router.put("/active/:id", 
  adminOrSubAdmin,
  checkPermission('vendors', 'edit'),
  status
);

router.get("/getlabstats",
  locationFilterMiddleware,
  getlabstats
);

router.get("/inActivlabs", 
  adminOrSubAdmin,
  checkPermission('vendors', 'view'),
  locationFilter(),
  inActivlabs
);

module.exports = router;