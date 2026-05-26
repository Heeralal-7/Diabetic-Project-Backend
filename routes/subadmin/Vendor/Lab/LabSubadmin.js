const express = require('express');
const router = express.Router();
const { 
  getLabVendors, 
  getLabVendorById, 
  getLabVendorsStats,
  searchVendorTest,
  updateVendorStatus,
  getInactiveLabs
} = require('../../../../controllers/subadmin/Vendor/Lab/LabSubadmin');
const { subAdminMiddleware } = require('../../../../middleware/auth');

// ✅ MAIN LAB VENDORS ROUTE WITH FILTERING
router.get('/', subAdminMiddleware, getLabVendors);

// ✅ LAB VENDORS STATISTICS
router.get('/stats', subAdminMiddleware, getLabVendorsStats);

// ✅ INACTIVE LABS
router.get('/inactive', subAdminMiddleware, getInactiveLabs);

// ✅ SEARCH VENDOR TESTS
router.get('/search-tests', subAdminMiddleware, searchVendorTest);

// ✅ GET SINGLE LAB VENDOR
router.get('/:id', subAdminMiddleware, getLabVendorById);

// ✅ UPDATE VENDOR STATUS
router.put('/status/:id', subAdminMiddleware, updateVendorStatus);

module.exports = router;