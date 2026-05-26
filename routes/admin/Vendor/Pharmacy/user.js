const {Router} = require('express')
const { 
  getAllVendorsLists, 
  getpharmacystats, 
  inActivePharmacy 
} = require('../../../../controllers/admin/Vendor/Pharmacy/user')
const { 
  adminMiddleware, 
  subAdminMiddleware,
  checkPermission,
  locationFilter 
} = require('../../../../middleware/auth');
const locationFilterMiddleware = require('../../../../middleware/locationFilter');

const route = Router()

// ✅ COMMON MIDDLEWARE FOR ADMIN & SUB-ADMIN
const adminOrSubAdmin = (req, res, next) => {
  if (req.headers.token) {
    adminMiddleware(req, res, (err) => {
      if (err) {
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

// ✅ UPDATED ROUTES WITH PERMISSION & LOCATION FILTERING
route.get("/vendors",
  locationFilterMiddleware,
  getAllVendorsLists
)

route.get("/getpharmacystats",
  locationFilterMiddleware,
  getpharmacystats
)

route.get("/inActivePharmacy",
  adminOrSubAdmin,
  checkPermission('vendors', 'view'),
  locationFilter(),
  inActivePharmacy
)

module.exports = route