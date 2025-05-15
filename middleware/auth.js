const jwt = require("jsonwebtoken");
const User = require("../modal/user");
const Admin = require("../modal/adminlogin");
const Doctor = require("../modal/docter");
const Vendor = require("../modal/vandor");
const Driver = require("../modal/driver");
const generateMiddleware = (model) => async (req, res, next) => {
  try {
    if (req.headers && req.headers.token) {
      const token = req.headers.token;
      const decode = jwt.verify(token, process.env.SECRETKEY);
      req.user = await model.findById(decode.id);
      next();
    } else {
      return res.status(401).send({
        success: 0,
        message: "Unauthorized...",
      });
    }
  } catch (error) {
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

const generateMiddleware1 = (model) => async (req, res, next) => {
  try {
    let token;

    // ✅ Accept both "token" and "Authorization: Bearer <token>"
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

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.SECRETKEY);

    // ✅ Find user from DB
    const user = await model.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: 0,
        message: "User not found.",
      });
    }

    req.user = user; // ✅ Attach user to request
    next();
  } catch (error) {
    return res.status(401).json({
      success: 0,
      message: "Invalid token.",
      error: error.message,
    });
  }
};

const middlewere = generateMiddleware(User);
const adminMiddleware = generateMiddleware(Admin);
const doctorMiddleware = generateMiddleware(Doctor);
const VendorMiddleware = generateMiddleware1(Vendor);
const driverMiddleware = generateMiddleware(Driver);
 
module.exports = {
  middlewere,
  adminMiddleware,
  doctorMiddleware,
  VendorMiddleware,
  driverMiddleware,
};
