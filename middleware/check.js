const User = require("../modal/user"); 
const Vendor = require("../modal/vandor"); 

const checkUserActive = (model) => {
  return async (req, res, next) => {
    try {
      const userId = req.user._id;
      const user = await model.findById(userId);

      if (!user || !user.isActive) {
        return res.send({
          success: 0,
          message: "Your account has been disabled. Please contact support.",
        });
      }

      next();
    } catch (error) {
      return res.status(500).send({
        success: 0,
        message: error.message,
      });
    }
  };
};

module.exports = { 
  checkVendorActive: checkUserActive(Vendor),
  checkUserActive: checkUserActive(User)
};

