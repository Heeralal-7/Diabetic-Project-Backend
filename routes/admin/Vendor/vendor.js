const express = require('express');
const router = express.Router();
const { 
  getAllVendors, 
  getVendorById, 
  updateVendorStatus, 
  deleteVendor, 
  getVendorStats 
} = require('../../../controllers/admin/Vendor/vendor');
const { subAdminMiddleware, checkPermission, locationFilter } = require('../../../middleware/auth');

// ✅ YEH SAB ROUTES UPDATE/ADD KAREN

// ✅ ALL VENDORS (GENERAL PERMISSION)
router.get('/', 
  subAdminMiddleware,
  checkPermission('vendors', 'view'), // General vendor view permission
  locationFilter(),
  getAllVendors
);

// ✅ LAB VENDORS SPECIFIC ROUTE
router.get('/lab',
  subAdminMiddleware,
  checkPermission('vendors', 'view', 'lab'), // Lab specific permission
  locationFilter(),
  (req, res) => {
    req.query.vendorType = 'Lab';
    return getAllVendors(req, res);
  }
);

// ✅ PHARMACY VENDORS SPECIFIC ROUTE  
router.get('/pharmacy',
  subAdminMiddleware,
  checkPermission('vendors', 'view', 'pharmacy'), // Pharmacy specific permission
  locationFilter(),
  (req, res) => {
    req.query.vendorType = 'Pharmacy';
    return getAllVendors(req, res);
  }
);

// ✅ FOOD VENDORS SPECIFIC ROUTE
router.get('/food',
  subAdminMiddleware,
  checkPermission('vendors', 'view', 'food'), // Food specific permission
  locationFilter(),
  (req, res) => {
    req.query.vendorType = 'Food';
    return getAllVendors(req, res);
  }
);

// ✅ VENDOR STATISTICS
router.get('/stats',
  subAdminMiddleware,
  checkPermission('vendors', 'view'),
  locationFilter(),
  getVendorStats
);

// ✅ GET VENDOR BY ID
router.get('/:id',
  subAdminMiddleware,
  checkPermission('vendors', 'view'),
  locationFilter(),
  getVendorById
);

// ✅ UPDATE VENDOR STATUS WITH DYNAMIC PERMISSION CHECK
router.put('/:id/status',
  subAdminMiddleware,
  locationFilter(),
  async (req, res, next) => {
    try {
      // ✅ Pehle vendor ka type check karen
      const vendor = await Vendor.findById(req.params.id);
      if (!vendor) {
        return res.status(404).json({
          success: 0,
          message: "Vendor not found"
        });
      }
      
      // ✅ Vendor type ke hisab se permission check
      let vendorType = vendor.vendor.toLowerCase();
      if (vendorType === 'lab' || vendorType === 'pharmacy' || vendorType === 'food') {
        return checkPermission('vendors', 'edit', vendorType)(req, res, next);
      } else {
        return checkPermission('vendors', 'edit')(req, res, next);
      }
    } catch (error) {
      return res.status(500).json({
        success: 0,
        message: error.message
      });
    }
  },
  updateVendorStatus
);

// ✅ DELETE VENDOR WITH DYNAMIC PERMISSION CHECK
router.delete('/:id',
  subAdminMiddleware,
  locationFilter(),
  async (req, res, next) => {
    try {
      const vendor = await Vendor.findById(req.params.id);
      if (!vendor) {
        return res.status(404).json({
          success: 0,
          message: "Vendor not found"
        });
      }
      
      let vendorType = vendor.vendor.toLowerCase();
      if (vendorType === 'lab' || vendorType === 'pharmacy' || vendorType === 'food') {
        return checkPermission('vendors', 'delete', vendorType)(req, res, next);
      } else {
        return checkPermission('vendors', 'delete')(req, res, next);
      }
    } catch (error) {
      return res.status(500).json({
        success: 0,
        message: error.message
      });
    }
  },
  deleteVendor
);

module.exports = router;