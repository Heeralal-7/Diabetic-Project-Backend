const Driver = require("../../../modal/driver");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const TempPhone = require("../../../modal/TempPhone");


// Generate token
const genrateToken = (id) => {
  return jwt.sign({ id }, process.env.SECRETKEY, { expiresIn: "30d" });
};

// Login driver
// Method: POST
// Endpoint: /driver/login
const loginDriver = async (req, res) => {
  try {
    const { serviceType, email, password } = req.body;

    if (!serviceType || !email || !password) {
      return res.status(400).send({
        success: 0,
        message: "Please enter all the required fields",
      });
    }

    const isExist = await Driver.findOne({
      $or: [{ email }, { phoneNumber: email }],
    }).populate({
      path: "vendorId",
      select: "vendor",
    });

    if (!isExist) {
      return res.status(404).send({
        success: 0,
        message: "No Driver found",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, isExist.password);

    if (
      isExist.vendorId?.vendor === serviceType &&
      isPasswordCorrect
    ) {
      const token = genrateToken(isExist._id);

      // Save token in DB (optional)
      isExist.token = token;
      await isExist.save();

      return res.status(200).send({
        success: 1,
        message: "Driver logged in successfully",
        details: {
          token,
          driver: {
            id: isExist._id,
            name: isExist.name,
            email: isExist.email,
            phoneNumber: isExist.phoneNumber,
          },
        },
      });
    }

    return res.status(401).send({
      success: 0,
      message: "Invalid credentials",
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).send({
      success: 0,
      message: "Server error",
    });
  }
};


// Get Driver profile
// Method: GET
// Endpoint: /driver/profile
const getDriverProfile = async (req, res) => {
  try {
    const isExist = await Driver.findOne({ _id: req.user._id });

    if (!isExist) {
      return res.send({
        success: 0,
        message: "No driver found",
      });
    }

    return res.send({
      success: 1,
      message: "Driver profile fetched successfully",
      details: {
        ...isExist._doc, // spread existing fields
        isOnline: isExist.isOnline, // explicitly add status
      },
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};


// Toggle Driver Online/Offline
// Method: POST
// Endpoint: /driver/toggle-status
const toggleDriverStatus = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user._id);

    if (!driver) {
      return res.status(404).send({
        success: 0,
        message: "Driver not found",
      });
    }

    // Toggle status
    driver.isOnline = !driver.isOnline;
    await driver.save();

    return res.send({
      success: 1,
      message: `Driver is now ${driver.isOnline ? "Online" : "Offline"}`,
      isOnline: driver.isOnline,
    });
  } catch (error) {
    console.error("Toggle Status Error:", error);
    return res.status(500).send({
      success: 0,
      message: "Server error",
    });
  }
};



//Change password
//Method:Post
//Endpoint:driver-addmember/change
const changePassword = async (req, res) => {
  try {
    const { oldpassword, password, confirmpassword } = req.body;
    if (!oldpassword || !password || !confirmpassword) {
      return res.send({
        success: 0,
        message: "Pleasee enter required fields",
      });
    }

    const isExist = await Driver.findOne({ _id: req.user._id });
    // console.log(req.user);
    if (!isExist) {
      return res.send({
        success: 0,
        message: "Pleasee enter required fields",
      });
    }

    if (isExist && (await bcrypt.compare(oldpassword, isExist.password))) {
      const salt = await bcrypt.genSalt(10);
      const hashPass = await bcrypt.hash(password, salt);
      if (password === confirmpassword) {
        await isExist.updateOne({ password: hashPass });
        return res.send({
          success: 1,
          message: "Password changed successfully",
        });
      } else {
        return res.send({
          success: 0,
          message: "Password did not matched",
        });
      }
    }
    return res.send({
      success: 0,
      message: "Incorrect password",
    });
  } catch (error) {
    // console.log(error);
    return res.send({
      message: "Something went wrong",
      success: 0,
      error: error.message,
    });
  }
};

//otp send to phone driver
//Method:post
//Endpoint:driver-addmember/phone-otp-sent
const otpSentToPhone = async (req, res) => {
  try {
    const { phone, ctrcode } = req.body;
    // const otp = Math.floor(1000 + Math.random() * 9000);
    const otp = 1111;

    const isUnqiue = await Driver.findOne({ phone });
    if (isUnqiue) {
      return res.send({
        success: 0,
        message: "Phone number is already in use.Try another one.",
      });
    }

    const checkPhone = await TempPhone.findOne({ phone });
    if (!checkPhone) {
      const createOtpOfPhone = await TempPhone.create({
        phone,
        ctrcode,
        otp: otp,
      });
      return res.send({
        success: 1,
        message: "Otp has been sent to your phone.",
      });
    } else {
      const updateOtpOfPhone = await checkPhone.updateOne({ otp: otp });
      return res.send({
        success: 1,
        message: "Otp has been sent to your phone.",
      });
    }
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};


//verify driver phone otp
//Method:post
//Endpoint:driver-addmember/phone-otp-verify
const verifyPhoneOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const findPhone = await TempPhone.findOne({ phone });

    if (!findPhone) {
      return res.send({
        success: 0,
        message: "Please enter correct phone number",
      });
    }

    if (findPhone && findPhone.otp !== otp) {
      return res.send({
        success: 0,
        message: "Please enter correct otp",
      });
    }

    return res.send({
      success: 1,
      message: "Phone number verified successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};


//Reset driver password
//Method:post
//Endpoint:driver-addmember/reset-password
const resetPassword = async (req, res) => {
  try {
    const { ctrCode, phoneNumber, password } = req.body;

    const user = await Driver.findOne({
      $and: [{ ctrCode }, { phoneNumber }],
    });
    if (!user) {
      return res.send({
        success: 0,
        message: "User is not authenticated",
      });
    }
    const salt = await bcrypt.genSalt(10);
    var hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    await user.save();

    return res.send({
      success: 1,
      message: "Password reset successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = {
  loginDriver,
  getDriverProfile,
  getDriverProfile,
  changePassword,
  otpSentToPhone,
  verifyPhoneOtp,
  resetPassword,
  toggleDriverStatus
};
