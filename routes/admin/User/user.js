const {Router} = require('express')
const { 
  getallUsers, 
  activeUser, 
  inActiveUser, 
  firstuser, 
  allusersdata 
} = require('../../../controllers/admin/User/user')
const { 
  adminMiddleware, 
  subAdminMiddleware,
  checkPermission,
  locationFilter 
} = require('../../../middleware/auth');
const locationFilterMiddleware = require('../../../middleware/locationFilter');

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

// Get all users
route.get('/all', 

  locationFilterMiddleware,

  getallUsers
);

// Get active users
route.get('/active', 
  locationFilterMiddleware,
  activeUser
);

// Get inactive users
route.get('/inactive', 
  adminOrSubAdmin,
  checkPermission('users', 'view'),
  locationFilter(),
  inActiveUser
);

// Get first 5 users
route.get('/firstlogin',
  adminOrSubAdmin,
  checkPermission('users', 'view'),
  firstuser
);

// Get user statistics
route.get("/allusersdata",
  locationFilterMiddleware,
  allusersdata
);

module.exports = route