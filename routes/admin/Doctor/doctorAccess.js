const {Router} = require('express')
const { 
  getDoctors,
  getDocumentByDoctorId,
  verifyDoctorAccount, 
  rejectDoctorAccount,
  approveDocumentField,
  rejectDocumentField, 
  createInsurance, 
  Membership, 
  getMembership, 
  calculateDiscountedPrice,
  getCouponsByDoctorId 
} = require('../../../controllers/admin/Doctor/doctorAccess')
const { 
  adminOrSubAdmin,
  checkPermission,
  locationFilter 
, middlewere
} = require('../../../middleware/auth');
const locationFilterMiddleware = require('../../../middleware/locationFilter');

const route = Router()

// ✅ UPDATED ROUTES WITH PERMISSION & LOCATION FILTERING

route.get('/getDoctors', 
  locationFilterMiddleware,
  getDoctors
);

route.get("/getDocumentByDoctorId/:id", 
  adminOrSubAdmin,
  checkPermission('doctors', 'view'),
  getDocumentByDoctorId
);

route.patch("/verifyDoctorAccount/:id", 
  adminOrSubAdmin,
  checkPermission('doctors', 'edit'),
  verifyDoctorAccount
);

route.patch("/rejectDoctorAccount/:id", 
  adminOrSubAdmin,
  checkPermission('doctors', 'edit'),
  rejectDoctorAccount
);

route.patch("/approveDocumentField/:id",
  adminOrSubAdmin,
  checkPermission('doctors', 'edit'),
  approveDocumentField
);

route.patch("/rejectDocumentField/:id",
  adminOrSubAdmin,
  checkPermission('doctors', 'edit'),
  rejectDocumentField
);

route.get("/getCouponsByDoctorId", 
  
  getCouponsByDoctorId
);

route.post("/addInsuranceType", 
  adminOrSubAdmin,
  checkPermission('doctors', 'create'),
  createInsurance
);

route.post("/Membership",
  adminOrSubAdmin,
  checkPermission('doctors', 'create'),
  Membership
);

route.get("/getMembership",
  middlewere,
  getMembership
);

route.post("/calculateDiscountedPrice",
  middlewere,
  calculateDiscountedPrice
);

module.exports = route