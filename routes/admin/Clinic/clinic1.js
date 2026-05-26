const express = require("express");
const { 
  getAllClinics, 
  getClinicStats, 
  getClinicsByStatus, 
  getClinicById, 
  approveClinic, 
  rejectClinic,   
  getDocumentByClinicId, 
  approveClinicDocumentField, 
  rejectClinicDocumentField, 
 
} = require("../../../controllers/admin/Clinic/clinic.js");
const { 
  adminMiddleware, 
  subAdminMiddleware,
  checkPermission,
  locationFilter 
} = require('../../../middleware/auth');
const locationFilterMiddleware = require("../../../middleware/locationFilter.js");

const router = express.Router();

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

// Get all clinics with filters and pagination
router.get("/clinics", 

  locationFilterMiddleware,
  getAllClinics
);

// Approve clinic account
router.patch("/approve/:id", 
  adminOrSubAdmin,
  checkPermission('clinics', 'edit'),
  approveClinic
);

// Reject clinic account
router.patch("/reject/:id", 
  adminOrSubAdmin,
  checkPermission('clinics', 'edit'),
  rejectClinic
);

// Approve specific document field
router.patch("/approveClinicDocumentField/:id", 
  adminOrSubAdmin,
  checkPermission('clinics', 'edit'),
  approveClinicDocumentField
);

// Reject specific document field
router.patch("/rejectClinicDocumentField/:id", 
  adminOrSubAdmin,
  checkPermission('clinics', 'edit'),
  rejectClinicDocumentField
);

// Get document by clinic ID
router.get("/getDocumentByClinicId/:id", 
  adminOrSubAdmin,
  checkPermission('clinics', 'view'),
  getDocumentByClinicId
);



// Get clinic statistics for dashboard
router.get("/clinics/stats", 
  adminOrSubAdmin,
  checkPermission('clinics', 'view'),
  locationFilter(),
  getClinicStats
);

// Get clinics by verification status (0=pending, 1=verified, 2=rejected)
router.get("/clinics/status/:status", 
  adminOrSubAdmin,
  checkPermission('clinics', 'view'),
  locationFilter(),
  getClinicsByStatus
);

// Get single clinic by ID (keep this at the end to avoid route conflicts)
router.get("/clinics/:id", 
  adminOrSubAdmin,
  checkPermission('clinics', 'view'),
  getClinicById
);

module.exports = router;