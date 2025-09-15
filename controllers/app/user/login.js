const User = require("../../../modal/user");
const TempOtp = require("../../../modal/TempOtp");
const jwt = require("jsonwebtoken");

// Generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.SECRETKEY);
};

const generateReferralCode = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let referralCode = "";
  for (let i = 0; i < 9; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    referralCode += characters[randomIndex];
  }
  return referralCode;
};

const getProfilePercentage = async (user) => {
  try {
    // Fields to exclude from the completion calculation
    const excludedFields = [
      "_id",
      "__v",
      "timestamps",
      "password",
      "redeem",
      "verified",
      "otp",
    ];

    // Get all fields from the user document
    const userFields = Object.keys(user._doc);

    // Filter out excluded fields
    const filteredFields = userFields.filter(
      (field) => !excludedFields.includes(field)
    );

    const totalFields = filteredFields.length;
    let filledFields = 0;

    for (const key of filteredFields) {
      if (user._doc[key]) {
        if (Array.isArray(user._doc[key])) {
          if (user._doc[key].length > 0) {
            filledFields++;
          }
        } else {
          filledFields++;
        }
      }
    }

    const completionPercentage = (filledFields / totalFields) * 100;

    return completionPercentage.toFixed(2);
  } catch (error) { 
    return res.send({ 
      success: 0,
      message: error.message,
    });
  }
};

// User login or Sign up
// Method:Post
// EndPoint:"/login"
const userRegisterAndLogin = async (req, res) => {
  try {
    const { ctrCode, number } = req.body;
    const otp = "1111";

    const checkIsExist = await TempOtp.findOne({ ctrCode, number });

    if (!checkIsExist) {
      await TempOtp.create({ ctrCode, number, otp,  });
    } else {
      await TempOtp.updateOne(
        { _id: checkIsExist._id },
        { $set: { otp } }
      );
    }

    return res.send({
      success: 1,
      message: "Otp has been sent successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};




// Verfiy User
// Method:Post
// EndPoint:"/verify"
const verifyUser = async (req, res) => {
  try {
    const { number, otp, ctrCode, regId } = req.body;

    const checkOtp = await TempOtp.findOne({ number, ctrCode });
    if (!checkOtp) {
      return res.send({
        success: 0,
        message: "Please register your account",
      });
    }

    if (checkOtp.otp !== otp) {
      return res.send({
        success: 0,
        message: "Please enter correct otp",
      });
    }

    const userExist = await User.findOne({ number, ctrCode });

    if (userExist) {
      // User exists, update regId + return token
      const updatedUser = await User.findByIdAndUpdate(
        userExist._id,
        {
          $set: {
            regId: regId || '',
          },
        },
        { new: true }
      );

      return res.send({
        success: 1,
        message: "User logged in successfully",
        details: {
          token: updatedUser.token,
          regId: updatedUser.regId,
          userId: updatedUser._id,
          name: updatedUser.name || "",
        },
      });
    } else {
      // New user: create and set token, referralCode
      let userCreate = await User.create({
        number,
        ctrCode,
        regId: regId || '',
      });

      const token = generateToken(userCreate._id);
      const referralCode = generateReferralCode();

      const finalUser = await User.findByIdAndUpdate(
        userCreate._id,
        {
          $set: {
            token,
            referralCode,
          },
        },
        { new: true }
      );

      return res.send({
        success: 1,
        message: "User has been created successfully",
        details: {
          token: finalUser.token,
          referralCode: finalUser.referralCode,
          regId: finalUser.regId,
        },
      });
    }
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};




// Update User profile
// Method:Patch
// EndPoint:user/update-user
const updateUserProfileData = async (req, res) => {
  try {
    const {
      name,
      address,
      email,
      occupation,
      gender,
      diabteticType,
      diabeticduration,
      dailyactivity,
      bloodgroup,
      otherMedicalCondition,
      familyhistorydiabetic,
      relationship,
      caregiversname,
      caregiversnumber,
      caregiversdibtype,
      dob,
      birthyear,
      
      partnerCode
    } = req.body;

    const findUserAndUpdate = await User.findById(req.user._id);
   

    if (!findUserAndUpdate) {
      return res.send({
        success: 0,
        message: "Opps sorry invalid credentials.",
      });
    }

    await findUserAndUpdate.updateOne(
      {
        name: name ? name : findUserAndUpdate.name,
        email: email ? email : findUserAndUpdate.email,
        address: address ? address : findUserAndUpdate.address,
        occupation: occupation ? occupation : findUserAndUpdate.occupation,
        otherMedicalCondition: otherMedicalCondition
          ? otherMedicalCondition
          : findUserAndUpdate.otherMedicalCondition,
        gender: gender ? gender : findUserAndUpdate.gender,
        relationship: relationship
          ? relationship
          : findUserAndUpdate.relationship,
        diabteticType: diabteticType
          ? diabteticType
          : findUserAndUpdate.diabteticType,
        diabeticduration: diabeticduration
          ? diabeticduration
          : findUserAndUpdate.diabeticduration,
        dailyactivity: dailyactivity
          ? dailyactivity
          : findUserAndUpdate.dailyactivity,
        bloodgroup: bloodgroup ? bloodgroup : findUserAndUpdate.bloodgroup,
        familyhistorydiabetic: familyhistorydiabetic
          ? familyhistorydiabetic
          : findUserAndUpdate.familyhistorydiabetic,
        takingmedicines: req.files.prescription
          ? `/user/prescription/${req.files.prescription[0].filename}`
          : findUserAndUpdate.takingmedicines,
        image: req.files.avatar
          ? `/user/avatar/${req.files.avatar[0].filename}`
          : findUserAndUpdate.image,
        caregiversname: caregiversname
          ? caregiversname
          : findUserAndUpdate.caregiversname,
        caregiversnumber: caregiversnumber
          ? caregiversnumber
          : findUserAndUpdate.caregiversnumber,
        caregiversdibtype: caregiversdibtype
          ? caregiversdibtype
          : findUserAndUpdate.caregiversdibtype,
        dob: dob ? dob : findUserAndUpdate.dob,
        birthyear: birthyear ? birthyear : findUserAndUpdate.birthyear,
        partnerCode: partnerCode
      },

      { new: true }
    );

    return res.send({
      success: 1,
      message: "User update successfully.",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Get User profile
// Method:Get
// EndPoint:
const getProfile = async (req, res) => {
  try {
    const data = await User.findById(req.user._id);
    if (!data) {
      return res.send({
        success: 0,
        message: "User not found",
      });
    }
    let val = await getProfilePercentage(data);
    const finalResult = { ...data._doc, profilePercentage: +val };
    return res.send({
      success: 1,
      message: "Fetched",
      details: finalResult,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Update User Profile Picture
const updatUserImage = async (req, res) => {
  try {
    const { number } = req.body;

    const findUserAndUpdate = await User.findOne({ number });

    await findUserAndUpdate.updateOne({
      image: req.file && `/user/avatar/${req.file.filename}`,
    });

    return res.send({
      success: 1,
      message: "updated successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};



//api for verfiy
//Method:Post
//Endpoint:/user/partner
const verfiy = async (req, res) => {
  try {
    const { partnerCode } = req.body;


    const user = await User.aggregate([{
      $match :{referralCode: partnerCode}
    }])
 
    if (user.lenght === 0) {
      return res.send({
        success: 0,
        message: "Please enter a correct code"
      });
    }

    await User.findByIdAndUpdate(req.user._id,{
      partnerCode
    },{new:true})


    return res.send({
      success: 1,
      message: "Verified successfully"
    });

  } catch (error) {
    return res.status(500).send({
      success: 0,
      message: error.message
    });
  }
};



module.exports = {
  userRegisterAndLogin,
  verifyUser,
  updateUserProfileData,
  updatUserImage,
  getProfile,
  getProfilePercentage,
  verfiy
};
