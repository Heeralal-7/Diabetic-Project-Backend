const jwt = require("jsonwebtoken");
const User = require("../modal/user");
const Admin = require("../modal/adminlogin");
const Doctor = require("../modal/docter");
const Vendor = require("../modal/vandor");
const Driver = require("../modal/driver");
const Clinic = require("../modal/clinic");
const SubAdmin = require("../modal/subAdmin");

// ✅ COMMON TOKEN VERIFICATION MIDDLEWARE
const generateMiddleware = (model, options = {}) => async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.headers.token) {
      token = req.headers.token;
    }

    if (!token) {
      return res.status(401).json({
        success: 0,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.SECRETKEY);

    let query = { _id: decoded.id };
    
    if (options.checkActive) {
      query.isActive = true;
    }

    const user = await model.findOne(query);
    if (!user) {
      return res.status(404).json({
        success: 0,
        message: options.checkActive ? "User not found or inactive." : "User not found.",
      });
    }

    req.user = user;
    
    // ✅ SET ROLE INFORMATION
    if (model.modelName === 'Admin') {
      req.admin = user;
      req.userRole = 'admin';
    } else if (model.modelName === 'SubAdmin') {
      req.subAdmin = user;
      req.userRole = 'subadmin';
    } else {
      req.userRole = 'user';
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: 0,
      message: "Invalid token.",
      error: error.message,
    });
  }
};

// ✅ ENHANCED PERMISSION CHECK MIDDLEWARE
const checkPermission = (module, action, vendorType = null) => {
  return (req, res, next) => {
    try {
      // ✅ Admin ko direct access
      if (req.userRole === 'admin') {
        return next();
      }
      
      // ✅ Sub-admin ke liye permission check
      if (req.userRole === 'subadmin' && req.subAdmin) {
        const { permissions } = req.subAdmin;
        
        let hasPermission = false;
        
        // ✅ Vendor type specific permission check
        if (vendorType && module === 'vendors') {
          hasPermission = permissions?.vendors?.[vendorType]?.[action] || false;
        } 
        // ✅ General module permission check
        else if (permissions?.[module]) {
          if (typeof permissions[module] === 'boolean') {
            hasPermission = permissions[module];
          } else if (permissions[module][action]) {
            hasPermission = permissions[module][action];
          }
        }
        
        // ✅ Wildcard permission check
        if (!hasPermission && permissions?.['*']?.[action]) {
          hasPermission = true;
        }
        
        if (hasPermission) {
          return next();
        }
      }
      
      return res.status(403).json({
        success: 0,
        message: `Access denied. No ${action} permission for ${vendorType ? `${vendorType} ${module}` : module}.`,
      });
      
    } catch (error) {
      return res.status(500).json({
        success: 0,
        message: "Permission check failed",
        error: error.message
      });
    }
  };
};

// ✅ IMPROVED LOCATION FILTER MIDDLEWARE
const locationFilter = () => {
  return async (req, res, next) => {
    try {
      // ✅ Admin - no location filter
      if (req.userRole === 'admin') {
        req.locationQuery = {};
        return next();
      }
      
      // ✅ Sub-admin - apply location filter
      if (req.userRole === 'subadmin' && req.subAdmin && req.subAdmin.locationAccess) {
        const { locationAccess } = req.subAdmin;
        
        let locationQuery = {};
        
        // ✅ Build location query from sub-admin's access
        if (locationAccess.countries && locationAccess.countries.length > 0) {
          locationQuery.country = { $in: locationAccess.countries };
        }
        if (locationAccess.states && locationAccess.states.length > 0) {
          locationQuery.state = { $in: locationAccess.states };
        }
        if (locationAccess.cities && locationAccess.cities.length > 0) {
          locationQuery.city = { $in: locationAccess.cities };
        }
        
        req.locationQuery = locationQuery;
      } else {
        req.locationQuery = {};
      }
      
      next();
    } catch (error) {
      return res.status(500).json({
        success: 0,
        message: "Location filter failed",
        error: error.message
      });
    }
  };
};

// ✅ COMMON MIDDLEWARE FOR ADMIN & SUB-ADMIN
const adminOrSubAdmin = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.headers.token) {
      token = req.headers.token;
    }

    if (!token) {
      return res.status(401).json({ 
        success: 0, 
        message: "No token provided" 
      });
    }

    const decoded = jwt.verify(token, process.env.SECRETKEY);

    // ✅ Try Admin first
    const admin = await Admin.findById(decoded.id);
    if (admin) {
      req.user = admin;
      req.admin = admin;
      req.userRole = 'admin';
      return next();
    }

    // ✅ Try SubAdmin with active check
    const subAdmin = await SubAdmin.findOne({ 
      _id: decoded.id, 
      isActive: true 
    });
    if (subAdmin) {
      req.user = subAdmin;
      req.subAdmin = subAdmin;
      req.userRole = 'subadmin';
      return next();
    }

    return res.status(401).json({
      success: 0,
      message: "Authentication failed"
    });

  } catch (error) {
    return res.status(401).json({
      success: 0,
      message: "Invalid token"
    });
  }
};

// ✅ MIDDLEWARE EXPORTS
const middlewere = generateMiddleware(User);
const adminMiddleware = generateMiddleware(Admin);
const doctorMiddleware = generateMiddleware(Doctor);
const VendorMiddleware = generateMiddleware(Vendor);
const driverMiddleware = generateMiddleware(Driver);
const ClinicMiddleware = generateMiddleware(Clinic);
const subAdminMiddleware = generateMiddleware(SubAdmin, { checkActive: true });

module.exports = {
  middlewere,
  adminMiddleware,
  doctorMiddleware,
  VendorMiddleware,
  driverMiddleware,
  ClinicMiddleware,
  subAdminMiddleware,
  checkPermission,
  locationFilter,
  adminOrSubAdmin, // ✅ ADD THIS
  generateMiddleware
};