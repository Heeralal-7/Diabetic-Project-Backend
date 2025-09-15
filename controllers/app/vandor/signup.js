const sendMailToUser = require("../../../config/mail");
const TempMail = require("../../../modal/TempEmail");
const TempPhone = require("../../../modal/TempPhone");
const Vendor = require("../../../modal/vandor");
const Document = require("../../../modal/Document");
const User = require("../../../modal/user")
const bcrypt = require("bcryptjs");
const secretkey = process.env.SECRETKEY;
const jwt = require("jsonwebtoken");
const fs = require("fs");

// Otp Sent to Vendor Email
// Method:Post
// EndPoint:/vendor/email-otp-sent
const otpSentToVendor = async (req, res) => {
  try {
    const { email } = req.body;

    const otpD = Math.floor(1000 + Math.random() * 9000);
    const vendor = await Vendor.findOne({ email });

    if (vendor && vendor.verify === true) {
      return res.send({ success: 0, message: "Email is already verified." });
    }

    const createTemp = await TempMail.findOne({ email });
    if (!createTemp) {
      const createMail = await TempMail.create({
        email,
        otp: otpD,
      });
      await sendMailToUser(createMail.email, otpD);
      return res.send({
        success: 1,
        message: "Otp sent successfully",
      });
    } else {
      const updateOtp = await createTemp.updateOne({ otp: otpD });
      await sendMailToUser(createTemp.email, otpD);
      return res.send({
        success: 1,
        message: "Otp sent successfully",
      });
    }
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Verify Sent To Phone
// Method:Post
// EndPoint:/vendor/phone-otp-sent
const otpSentToPhone = async (req, res) => {
  try {
    const { phone, ctrcode } = req.body;
    // const otp = Math.floor(1000 + Math.random() * 9000);
    const otp = 1111;

    const isUnqiue = await Vendor.findOne({ phone });
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

// Verify phone otp
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

// Verify forgot otp
const verifyForgotOtp = async (req, res) => {
  try {
    const { countryCode, phone, otp } = req.body;
    const findVendor = await Vendor.findOne({
      $and: [{ ctrcode: countryCode, phone }],
    });
    if (+findVendor.phnOtp !== +otp) {
      return res.send({
        success: 0,
        message: "Incorrect Otp",
      });
    }
    return res.send({
      success: 1,
      message: "Phone verified successfully",
    });
  } catch (error) {
    res.status(500).send({
      message: "Something went wrong",
      success: 0,
      error: error.message,
    });
  }
};

// Verify mail with otp
// Method:Post
// EndPoint:/vendor/register
const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const findTempOtp = await TempMail.findOne({ email });

    if (!findTempOtp) {
      res.send({ success: 0, message: "Please provide correct email" });
    }

    if (findTempOtp && findTempOtp.otp !== otp) {
      res.send({ success: 0, message: "Please enter correct otp" });
    }
    return res.send({
      success: 1,
      message: "Vendor verified successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

const register = async (req, res) => {
  try {
    const {
      business,
      vendor,
      city,
      state,
      country,
      altphnctrcode,
      name,
      phone,
      password,
      altrphone,
      ctrcode,
      email,
      latitude,
      longitude,
    
    } = req.body;
 


    console.log(req.files)

    const isExist = await Vendor.findOne({ email });
    if (isExist && isExist.verify === true) {
      if (req.files) {
        if (req.files.image) {
          fs.unlinkSync(req.files.image[0].path);
        }
        if (req.files.register) {
          fs.unlinkSync(req.files.register[0].path);
        }
        if (req.files.licence) {
          fs.unlinkSync(req.files.licence[0].path);
        }
      }
      return res.json({
        success: 0,
        message: "User already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPass = await bcrypt.hash(password, salt);

    const registrationcert =
      req.files.register &&
      `/vendor/registration/${req.files.register[0].filename}`;
    const licencenum =
      req.files.licence && `/vendor/licence/${req.files.licence[0].filename}`;

    const image =
      req.files.image && `/vendor/avatar/${req.files.image[0].filename}`;

 

    const vendorUpdate = await Vendor.create({
      name,
      email,
      phone,
      altrphone,
      ctrcode,
      altphnctrcode,
      country,
      state,
      city,
      vendor,
      business,
      image,
      password: hashPass,
      verify: true,
      latitude,
      longitude,

    });

    const newdoc = await Document.create({
      registrationNo: registrationcert,
      licenceNo: licencenum,
      vendorId: vendorUpdate._id,
    });

    await Vendor.findOneAndUpdate(
      { _id: vendorUpdate._id },
      {
        myDocumentId: newdoc._id,
      }
    );

    return res.json({
      success: 1,
      message: "Vendor registered successfully",
    });
  } catch (error) {
    return res.json({
      success: 0,
      message: error.message,
    });
  }
};

// Login vandor
// Method:Post
// EndPoint:/vendor/login
// status 0  - user is blocked and status 1 - user is unblocked(initially)
const loginVendor = async (req, res) => {
  try {
    const { email, password, type } = req.body;

    // Check for required fields
    if (!password || !email || !type) {
      return res.send({
        message: "Email and password are required along with vendor type",
        success: 0,
      });
    }

    // Find the vendor by email
    const vendor = await Vendor.findOne({
      $or: [{ email }, { phone: email }],
    });

    if (!vendor) {
      return res.send({
        message: "Vendor not found",
        success: 0,
      });
    }

    // Check if the vendor is blocked
    if (vendor.isActive === false) {
      return res.send({
        message: "Login failed: Your account has been blocked",
        success: 0,
      });
    }

    // Check if the provided type matches the vendor's type
    if (type !== vendor.vendor) {
      return res.send({
        message: "Login failed: Vendor type mismatch",
        success: 0,
      });
    }

    // Validate the password
    const isPasswordValid = await bcrypt.compare(password, vendor.password);

    if (!isPasswordValid) {
      return res.send({
        message: "Invalid password",
        success: 0,
      });
    }

    // Generate a JWT token
    const token = jwt.sign({ id: vendor._id }, secretkey);
    await vendor.updateOne({ token });

    return res.send({
      message: "Login successfully.",
      success: 1,
      details: {
        token: token,
        vendorId: vendor._id,
      },
    });
  } catch (error) {
    return res.send({
      message: "Something went wrong",
      success: 0,
      error: error.message,
    });
  }
};
// Forget password
const otpForForget = async (req, res) => {
  try {
    const { countryCode, phone } = req.body;
    const exist = await Vendor.findOne({
      $and: [{ phone }, { ctrcode: countryCode }, { verify: true }],
    });
    if (!exist) {
      return res.send({ success: 0, message: "Invalid credentials" });
    }
    // const otpD = Math.floor(1000 + Math.random() * 9000);
    const otpD = 1111;
    // const sentotp = await Vendor.findOneAndUpdate(
    //   { phone: phone },
    //   { phnOtp: otpD },
    //   { new: true }
    // ).select("phnOtp");
    const sentotp = await exist
      .updateOne({ phnOtp: otpD }, { new: true })
      .select("phnOtp");

    return res.send({
      success: 1,
      message: "OTP sent to your phone number",
    });
  } catch (error) {
    // console.log(error)
    return res.send({
      message: "Something went wrong",
      success: 0,
      error: error.message,
    });
  }
};

// Get Vendor Profile
// Method:Patch
// EndPoint:/vendor/updateprofile
const getVendorProfile = async (req, res) => {
  try {
    const isVendorProfile = await Vendor.findById(req.user._id)
      .populate({
        path: "myDocumentId",
        select: "registrationNo licenceNo accreditation others",
      })
      .select("-registrationcert -licencenum -phnOtp -emailOtp -confirmpass");
    if (!isVendorProfile) {
      return res.send({
        success: 0,
        message: "No Vendor found ",
      });
    }

    return res.send({
      success: 1,
      message: "Vendor Fetched successfully",
      details: isVendorProfile,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Update Vendor Profile
// Method:Patch
// EndPoint:/vendor/profile
const updateVendorProfile = async (req, res) => {
  try {
    const id = req.user._id;
    const {
      name,
      email,
      phone,
      altrphone,
      ctrcode,
      altphnctrcode,
      country,
      state,
      city,
      vendor,
      business,
      // registrationcert,
      // licencenum,
      labName,
      address,
    } = req.body;

    let avatar, posterImage;
    if (req.files && req.files.avatar) {
      avatar = `/vendor/avatar/${req.files.avatar[0].filename}`;
    }
    if (req.files && req.files.banner) {
      posterImage = `/vendor/banner/${req.files.banner[0].filename}`;
    }

    const user = await Vendor.findById(id);
    if (!user) {
      return res.send({
        success: false,
        message: "User is not authenticated",
      });
    }

    const newuser = await Vendor.findByIdAndUpdate(
      id,
      {
        name,
        email,
        image: avatar,
        phone,
        altrphone,
        ctrcode,
        altphnctrcode,
        country,
        state,
        city,
        vendor,
        business,
        // registrationcert,
        // licencenum,
        banner: posterImage,
        labName,
        address,
      },
      { new: true }
    ).select("-phnOtp -emailOtp -password -confirmpass");

    return res.send({
      success: true,
      message: "User updated",
      details: newuser,
    });
  } catch (error) {
    res.status(500).send({
      message: "Something went wrong",
      success: 0,
      error: error.message,
    });
  }
};
// Enter new password
// Method:Post
// EndPoint:/vendor/change-password
const changePassword = async (req, res) => {
  try {
    const { oldpassword, password, confirmpassword } = req.body;
    if (!oldpassword || !password || !confirmpassword) {
      return res.send({
        success: 0,
        message: "Pleasee enter required fields",
      });
    }

    const isExist = await Vendor.findOne({ _id: req.user._id });
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




//reset password
const resetPassword = async (req, res) => {
  try {
    const { countryCode, phone, password } = req.body;

    const user = await Vendor.findOne({
      $and: [{ ctrcode: countryCode }, { phone }],
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

const updateUser = async (req, res) => {
  try {
    await User.updateMany({
      isActive: "true",
    });

    return res.send({
      success: 1,
      message: "updated",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = {
  register,
  otpSentToPhone,
  otpSentToVendor,
  verifyPhoneOtp,
  verifyEmailOtp,
  loginVendor,
  otpForForget,
  getVendorProfile,
  updateVendorProfile,
  changePassword,
  verifyForgotOtp,
  resetPassword,
  updateUser,
};
