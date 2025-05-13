const Docter = require("../../../modal/docter");
const Document = require("../../../modal/Document");
const TempMail = require("../../../modal/TempEmail");
const TempPhone = require("../../../modal/TempPhone");
const sendMailToUser = require("../../../config/mail");
const Wallet = require("../../../modal/wallet");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const genrateToken = (id) => {
  return jwt.sign({ id }, process.env.SECRETKEY);
};

// Get Profile percentage of doctor
const getProfilePercentage = async (val) => {
  // List of all required fields
  const requiredFields = [
    "name",
    "image",
    "email",
    "phoneNumber",
    "alternatePhoneNumber",
    "address",
    "ctrCode",
    "country",
    "state",
    "city",
    "qualification",
    "altphnctrcode",
    "specialist",
    "experience",
    "clinicName",
    "myDocumentId",
  ];

  // Count fields that are filled
  const filledFields = requiredFields.filter((field) => {
    const value = val[field];

    if (field === "myDocumentId") {
      // For ObjectId, check if it exists
      return value && value.toString(); // Assuming value is an ObjectId
    }

    // For other fields, ensure it's a non-empty string
    return typeof value === "string" && value.trim() !== "";
  });

  // Calculate the completion percentage
  const completionPercentage =
    (filledFields.length / requiredFields.length) * 100;

  // Return the percentage rounded to two decimal places
  return parseFloat(completionPercentage.toFixed(2));
};

// Otp Sent to Vendor Email
// Method:Post
// EndPoint: /email-otp-sent
const otpSentToDcotor = async (req, res) => {
  try {
    const { email } = req.body;

    const otpD = Math.floor(1000 + Math.random() * 9000);
    const vendor = await Docter.findOne({ email });

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

// Otp Sent to Phone
// Method:Post
// EndPoint:/phone-otp-sent
const otpSentToPhone = async (req, res) => {
  try {
    const { phone, ctrcode } = req.body;
    // const otp = Math.floor(1000 + Math.random() * 9000);
    const otp = 1111;

    const isUnqiue = await Docter.findOne({ phone });
    if (isUnqiue && isUnqiue.verify === true) {
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

// verify forgot otp
// Method:Post
// EndPoint:/verify-otp
const verifyForgotOtp = async (req, res) => {
  try {
    const { ctrCode, phoneNumber, otp } = req.body;
    const findDocter = await Docter.findOne({
      $and: [{ ctrCode }, { phoneNumber }],
    });
    if (+findDocter.phnOtp !== +otp) {
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

// otp for forget
// Method:Post
// EndPoint:/otp
const otpForForget = async (req, res) => {
  try {
    const { ctrCode, phoneNumber } = req.body;
    const exist = await Docter.findOne({
      $and: [{ phoneNumber }, { ctrCode }],
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
// Verify Phone Otp
// Method:Post
// EndPoint:/phone-otp-verify
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

// Verify Email Otp
// Method:Post
// EndPoint:/email-otp-verify
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

//change password
//Method:Post
//Endpoint:doctor/password
const changePassword = async (req, res) => {
  try {
    const { oldpassword, password, confirmpassword } = req.body;
    if (!oldpassword || !password || !confirmpassword) {
      return res.send({
        success: 0,
        message: "Pleasee enter required fields",
      });
    }

    const isExist = await Docter.findOne({ _id: req.user._id });
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

//Reset doctor password
// Method:Post
// EndPoint:/reset
const resetPassword = async (req, res) => {
  try {
    const { ctrCode, password, phoneNumber } = req.body;
    if (!ctrCode || !password || !phoneNumber) {
      return res.send({
        success: 0,
        message: "All fields are required",
      });
    }
    const doctor = await Docter.findOne({
      $and: [{ ctrCode }, { phoneNumber }],
    });
    if (!doctor) {
      return res.send({
        success: 0,
        message: "Doctor is not authenticated",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    doctor.password = hashedPassword;
    await doctor.save();

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

// Register Doctor
// Method:Post
// EndPoint:/register
const registerDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      phoneNumber,
      alternatePhoneNumber,
      address,
      ctrCode,
      altphnctrcode,
      country,
      state,
      city,
      qualification,
      specialist,
      experience,
      licenceNumber,
      councilNumber,
      clinicName,
      password,
      patientstreated,
      Award,
      About,
      Verified,
      phnOtp,
    } = req.body;

    // Required fields validation
    if (
      !name ||
      !email ||
      !phoneNumber ||
      !alternatePhoneNumber ||
      !address ||
      !country ||
      !state ||
      !city ||
      !qualification ||
      !specialist ||
      !experience ||
      !licenceNumber ||
      !councilNumber ||
      !clinicName ||
      !password ||
      !patientstreated ||
      !About
    ) {
      return res.send({
        success: 0,
        message: "Please enter all the required fields",
      });
    }

    // Check for existing doctor
    const isExist = await Docter.findOne({
      $or: [{ email }, { phoneNumber }],
    });

    if (isExist) {
      // Delete uploaded files if user exists
      if (req.files) {
        if (req.files.image) {
          fs.unlinkSync(req.files.image[0].path);
        }
        if (req.files.certificate) {
          fs.unlinkSync(req.files.certificate[0].path);
        }
        if (req.files.licenceImage) {
          fs.unlinkSync(req.files.licenceImage[0].path);
        }
      }
      return res.send({
        success: 0,
        message: "User already exists",
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashPass = await bcrypt.hash(password, salt);

    // Create the doctor
    const createDoctor = await Docter.create({
      name,
      image: req.files?.image ? `/doctor/image/${req.files.image[0].filename}` : "",
      email,
      phoneNumber,
      alternatePhoneNumber,
      address,
      ctrCode,
      altphnctrcode,
      country,
      state,
      city,
      qualification,
      specialist,
      experience,
      licenceNumber,
      councilNumber,
      clinicName,
      password: hashPass,
      About,
      patientstreated,
      phnOtp
    });

    return res.send({
      success: 1,
      message: "You have been registered successfully",
    });

  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Login doctor
// Method:Post
// EndPoint:/login
const loginDoctor = async (req, res) => {
  try {
    const { email, phoneNumber, password } = req.body;

    const findDoctor = await Docter.findOne({
      $or: [{ email }, { phoneNumber: email }],
    });

    if (!findDoctor) {
      res.send({ success: 0, message: "Invalid credentials" });
    }

    if (findDoctor && (await bcrypt.compare(password, findDoctor.password))) {
      // Updating the token
      const updatedDoctor = await Docter.findOneAndUpdate(
        { _id: findDoctor._id },
        { token: genrateToken(findDoctor._id) },
        { new: true }
      ).select("-password");

      return res.send({
        success: 1,
        message: "Doctor logged in successfully",
        details: {
          token: updatedDoctor.token,
        },
      });
    }

    return res.send({
      success: 0,
      message: "Invalid credentails",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Get doctor profile
//Method:GET
//EndPoint:/doctor/get-doctor
// const getDoctor = async (req, res) => {
//   try {
//     const data = await Docter.findOne({ _id: req.user._id }).populate({
//       path: "myDocumentId",
//       select:
//         "licenceNo accreditation doctorCertificate aadharCard panCard drivingLicence",
//     });
//     if (!data) {
//       return res.send({
//         success: 0,
//         message: "Doctor is not authenticated",
//       });
//     }

//     const amountCheck = await Wallet.find({ doctorId: req.user._id });
//     const totalAmount = amountCheck.reduce((acc, total) => +acc + +total, 0);
//     let percentage = await getProfilePercentage(data);

//     const data1 = {
//       ...data,
//       amount: totalAmount,
//       profilePercentage: percentage,
//     };
//     return res.send({
//       success: 1,
//       message: "Fetched successfully",
//       details: data1._doc,
//     });
//   } catch (error) {
//     return res.send({
//       success: 0,
//       message: error.message,
//     });
//   }
// };

const getDoctor = async (req, res) => {
  try {
    const data = await Docter.findOne({ _id: req.user._id }).populate({
      path: "myDocumentId",
      select:
        "licenceNo accreditation doctorCertificate aadharCard panCard drivingLicence",
    });

    if (!data) {
      return res.status(404).send({
        success: 0,
        message: "Doctor not found",
      });
    }

    const amountCheck = await Wallet.find({ doctorId: req.user._id });
    const totalAmount = amountCheck.reduce(
      (acc, total) => acc + parseFloat(total.amount),
      0
    );

    const percentage = await getProfilePercentage(data._doc);

    const data1 = {
      ...data._doc,
      amount: totalAmount,
      profilePercentage: percentage,
    };

    return res.status(200).send({
      success: 1,
      message: "Fetched successfully",
      details: data1,
    });
  } catch (error) {
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

//Update doctor profile
//Method:PATCH
//EndPoint:/doctor/update-doctor
const updateDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      address,
      licenceNumber,
      councilNumber,
      clinicName,
      phoneNumber,
      alternatePhoneNumber,
      ctrCode,
      country,
      state,
      city,
      qualification,
      altphnctrcode,
      specialist,
      experience,
    } = req.body;

    let image, posterimage;
    if (req.files && req.files.image) {
      image = `/doctor/image/${req.files.image[0].filename}`;
    }
    if (req.files && req.files.posterimage) {
      posterimage = `/doctor/posterimage/${req.files.posterimage[0].filename}`;
    }

    const doctor = await Docter.findById({ _id: req.user._id });
    if (!doctor) {
      return res.send({
        success: 0,
        message: "Doctor is not authenticated",
      });
    }

    await Docter.findOneAndUpdate(
      { _id: doctor._id },
      {
        name,
        email,
        address,
        licenceNumber,
        councilNumber,
        clinicName,
        phoneNumber,
        alternatePhoneNumber,
        ctrCode,
        country,
        state,
        city,
        qualification,
        altphnctrcode,
        specialist,
        experience,
        image,
        posterimage,
      },
      { new: true }
    );

    return res.send({
      success: 1,
      message: "Updated successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Get Doctor Appointment
// Method:Get
// EndPoint:/appointments
const getAllAppointments = async (req, res) => {
  try {
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//////////////////////////////////////////////////////////////

// add. docter
const addDocter = async (req, res) => {
  const {
    email,
    name,
    bio,
    study,
    residency,
    boardCertification,
    memberships,
    specialist,
    about,
  } = req.body;
  try {
    const exist = await Docter.findOne({ email });
    if (!exist) {
      const data = await Docter.create({
        name,
        bio,
        study,
        residency,
        boardCertification,
        memberships,
        specialist,
        image: req.file ? `/doctor/${req.file.filename}` : "",
        email,
        about,
      });
      return res.send({
        message: "Your details added successfully  ",
        success: 1,
        data: data,
      });
    } else {
      return res.send({
        message: "This mail is already exist ",
        success: 0,
      });
    }
  } catch (error) {
    return res.send({
      message: "something went Wrong",
      success: 0,
      error: error.message,
    });
  }
};
// Docter list
const docterList = async (req, res) => {
  try {
    const data = await Docter.find();
    return res.send({
      message: "Your details added success fully  ",
      success: 1,
      data: data,
    });
  } catch (error) {
    return res.send({
      message: "something went Wrong",
      success: 0,
      error: error.message,
    });
  }
};
// profile of  sapacific docter
const profleView = async (req, res) => {
  const { id } = req.query;
  try {
    const data = await Docter.aggregate([{ $match: { _id: id } }]);
    return res.send({
      message: "profile successfully load",
      success: 1,
      data: data,
    });
  } catch (error) {
    return res.send({
      message: "something went Wrong",
      success: 0,
      error: error.message,
    });
  }
};

  module.exports = {
    addDocter,
    docterList,
    profleView,
    registerDoctor,
    loginDoctor,
    otpSentToDcotor,
    otpSentToPhone,
    verifyPhoneOtp,
    verifyEmailOtp,
    resetPassword,
    otpForForget,
    verifyForgotOtp,
    getDoctor,
    updateDoctor,
    changePassword,
  };
