const Clinic = require("../../../modal/clinic");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const TempMail = require("../../../modal/TempEmail");
const TempPhone = require("../../../modal/TempPhone");
const sendMailToUser = require("../../../config/mail");
const Document = require("../../../modal/Document");
const Wallet = require("../../../modal/wallet");
const Doctor = require("../../../modal/docter");
const mongoose = require("mongoose"); // at the top
const path = require('path');
const genrateToken = (id) => {
  return jwt.sign({ id }, process.env.SECRETKEY);
};

// EndPoint: Clinic/otpSentToDcotor
const otpSentToDcotor = async (req, res) => {
  try {
    const { email } = req.body;

    const otpD = Math.floor(1000 + Math.random() * 9000);
    const vendor = await Clinic.findOne({ email });

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
// EndPoint: Clinic/otpSentToPhone
const otpSentToPhone = async (req, res) => {
  try {
    const { phone, ctrcode } = req.body;
    // const otp = Math.floor(1000 + Math.random() * 9000);
    const otp = 1111;

    const isUnqiue = await Clinic.findOne({ phone });
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

// endpoint:/ Clinic/verifyPhoneOtp
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
// EndPoint: Clinic/verifyEmailOtp
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

// endpoint - Clinic/register
// method - post
// create a new clinic

const registerClinic = async (req, res) => {
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
        clinicName,
        password,
        experience,
        licenceNumber,
        councilNumber,
        longitude,
        latitude
      } = req.body;

      // 1) Validate required fields
      if (
        !name || !email || !phoneNumber || !alternatePhoneNumber ||
        !address || !country || !state || !city ||
        !clinicName || !password ||
        !longitude || !latitude
      ) {
        return res.status(400).json({
          success: 0,
          message: "Please enter all the required fields",
        });
      }

      // 2) Prevent duplicates
      const isExist = await Clinic.findOne({
        $or: [{ email }, { phoneNumber }],
      });
      if (isExist) {
        // clean up uploaded files on duplicate
        if (req.files) {
          req.files.image       && fs.unlinkSync(req.files.image[0].path);
          req.files.certificate && fs.unlinkSync(req.files.certificate[0].path);
          req.files.licenceImage&& fs.unlinkSync(req.files.licenceImage[0].path);
        }
        return res.status(409).json({
          success: 0,
          message: "Clinic already exists",
        });
      }

      // 3) Hash password
      const salt     = await bcrypt.genSalt(10);
      const hashPass = await bcrypt.hash(password, salt);

      // 4) Handle file uploads
      let certificateImage         = "";
      let licenceCertificate       = "";
      let CertificateStatus        = "0";
      let licenceCertificateStatus = "0";

      if (req.files) {
        if (req.files.certificate?.[0]) {
          certificateImage         = `/Clinic/certificateImage/${req.files.certificate[0].filename}`;
          CertificateStatus        = "1";
        }
        if (req.files.licenceImage?.[0]) {
          licenceCertificate        = `/Clinic/licenceImage/${req.files.licenceImage[0].filename}`;
          licenceCertificateStatus  = "1";
        }
      }

      // 5) Create clinic document
      const createClinic = await Clinic.create({
        name,
        image: req.files?.image ? `/Clinic/image/${req.files.image[0].filename}` : "",
        email,
        phoneNumber,
        alternatePhoneNumber,
        address,
        ctrCode,
        altphnctrcode,
        country,
        state,
        city,
        clinicName,
        certificateImage,
        CertificateStatus,
        licenceCertificate,
        licenceCertificateStatus,
        password: hashPass,
        experience,
        licenceNumber,
        councilNumber,

        // raw fields
        longitude,
        latitude,

        // GeoJSON for geospatial queries
        location: {
          type: "Point",
          coordinates: [
            parseFloat(longitude),  // longitude first
            parseFloat(latitude)    // latitude second
          ]
        }
      });

      // 6) Create associated Document record
      const docs = await Document.create({
        doctorCertificate: certificateImage,
        licenceNo:         licenceCertificate,
        ClinicId:          createClinic._id,
      });

      // 7) Link back
      await Clinic.findByIdAndUpdate(
        createClinic._id,
        { myDocumentId: docs._id }
      );

      return res.json({
        success: 1,
        message: "Clinic has been registered successfully",
      });

    } catch (error) {
      console.error("registerClinic error:", error);
      return res.status(500).json({
        success: 0,
        message: error.message,
      });
    }
}

// Clinic/loginDoctor
const loginDoctor = async (req, res) => {
  try {
    const { email, phoneNumber, password, regId, longitude, latitude } =
      req.body;

    const findDoctor = await Clinic.findOne({
      $or: [{ email }, { phoneNumber: email }],
    });

    if (!findDoctor) {
      return res.send({ success: 0, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, findDoctor.password);

    if (findDoctor && isMatch) {
      const token = genrateToken(findDoctor._id);

      const updatedDoctor = await Clinic.findOneAndUpdate(
        { _id: findDoctor._id },
        {
          token,
          regId: regId || "",
          longitude: longitude || "",
          latitude: latitude || "",
        },
        { new: true }
      ).select("-password");

      return res.send({
        success: 1,
        message: "Doctor logged in successfully",
        details: {
          token: updatedDoctor.token,
          regId: updatedDoctor.regId,
          longitude: updatedDoctor.longitude,
          latitude: updatedDoctor.latitude,
        },
      });
    }

    return res.send({
      success: 0,
      message: "Invalid credentials",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

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

// Clinic/getClinic
const getClinic = async (req, res) => {
  try {
    const data = await Clinic.findOne({ _id: req.user._id }).populate({
      path: "myDocumentId",
      select: `
        licenceNo licenceNoStatus 
        accreditation accreditationStatus 
        doctorCertificate doctorCertificateStatus 
        aadharCard aadharCardStatus 
        panCard panCardStatus 
        drivingLicence drivingLicenceStatus
      `,
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

// diabtic-backend/uploads/Clinic/ClinicImages

//  Clinic/update-doctor
const updateDoctors = async (req, res) => {
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
      altphnctrcode,
      country,
      state,
      city,
      experience,
      qualification,
      specialist,
      About
    } = req.body;

    let image,
      posterimage,
      clinicImages = [];

    if (req.files && req.files.image) {
      image = `/Clinic/image/${req.files.image[0].filename}`;
    }

    if (req.files && req.files.posterimage) {
      posterimage = `/Clinic/posterimage/${req.files.posterimage[0].filename}`;
    }

    // ✅ Replace clinicImages
    if (
      req.files &&
      req.files.clinicImages &&
      req.files.clinicImages.length > 0
    ) {
      clinicImages = req.files.clinicImages.map(
        (file) => `/Clinic/clinicImages/${file.filename}`
      );
    }

    const clinic = await Clinic.findById(req.user._id);
    if (!clinic) {
      return res.send({
        success: 0,
        message: "Clinic is not authenticated",
      });
    }

    // ✅ Construct update object
    const updateData = {
      name,
      email,
      address,
      licenceNumber,
      councilNumber,
      clinicName,
      phoneNumber,
      alternatePhoneNumber,
      ctrCode,
      altphnctrcode,
      country,
      state,
      city,
      experience,
      qualification: qualification || clinic.qualification,
      specialist: specialist || clinic.specialist,
      image: image || clinic.image,
      posterimage: posterimage || clinic.posterimage,
      About
    };

    // ✅ Only set clinicImages if new ones uploaded
    if (clinicImages.length > 0) {
      updateData.clinicImages = clinicImages;
    }

    await Clinic.findOneAndUpdate({ _id: clinic._id }, updateData, {
      new: true,
    });

    return res.send({
      success: 1,
      message: "Clinic profile updated successfully with new images",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//    Clinic/getDoctor
const getDoctor = async (req, res) => {
  try {
    const clinic = req.user; // 👈 middleware se clinic data mil raha hai
    const clinicId = clinic?._id;

    if (!clinicId) {
      return res
        .status(400)
        .json({ success: 0, message: "Clinic ID not found" });
    }

    // 👇 Doctor model se find karo jaha ClinicId match kare
    const doctors = await Doctor.find({ ClinicId: clinicId });

    return res.json({
      success: 1,
      message: "List of doctors in your clinic",
      details: doctors,
    });
  } catch (error) {
    return res.status(500).json({
      success: 0,
      message: error.message,
    });
  }
};


// Clinic/editclinicDoctor
const editclinicDoctor = async (req, res) => {
  try {
    const clinicId = req.user._id; // ClinicMiddleware se mil raha hoga
    const doctorId = req.query.doctorId;

    if (!clinicId) {
      return res
        .status(400)
        .send({ success: 0, message: "Clinic ID not found in token" });
    }

    if (!doctorId) {
      return res
        .status(400)
        .send({ success: 0, message: "Doctor ID is required" });
    }

    // Confirm doctor belongs to this clinic
    const doctor = await Doctor.findOne({ _id: doctorId, ClinicId: clinicId });
    if (!doctor) {
      return res.status(404).send({
        success: 0,
        message: "Doctor not found or does not belong to this clinic",
      });
    }

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
    if (req.files?.image?.[0]) {
      image = `/doctor/image/${req.files.image[0].filename}`;
    }
    if (req.files?.posterimage?.[0]) {
      posterimage = `/doctor/posterimage/${req.files.posterimage[0].filename}`;
    }

    const updateData = {
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
    };

    if (image) updateData.image = image;
    if (posterimage) updateData.posterimage = posterimage;

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      doctorId,
      { $set: updateData },
      { new: true }
    );

    return res.send({
      success: 1,
      message: "Doctor updated successfully",
      data: updatedDoctor,
    });
  } catch (error) {
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// Clinic/deleteDoctor
const deleteDoctor = async (req, res) => {
  try {
    const { _id } = req.query;

    if (!_id) {
      return res.status(400).send({
        success: 0,
        message: "Doctor ID is required",
      });
    }

    // Check if doctor exists and delete
    const deletedDoctor = await Doctor.findByIdAndDelete(_id);

    if (!deletedDoctor) {
      return res.status(404).send({
        success: 0,
        message: "Doctor not found",
      });
    }

    console.log("ClinicId from doctor:", deletedDoctor.ClinicId);
    console.log("DoctorId to remove:", _id);

    // Convert both IDs to ObjectId
    const clinicId = new mongoose.Types.ObjectId(deletedDoctor.ClinicId);
    const doctorObjectId = new mongoose.Types.ObjectId(_id);

    // Pull doctor ID from Clinic model
    const updateResult = await Clinic.updateOne(
      { _id: clinicId },
      { $pull: { DoctorId: doctorObjectId } }
    );

    console.log("Update result:", updateResult);

    return res.send({
      success: 1,
      message: "Doctor deleted successfully",
      data: deletedDoctor,
    });
  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// diabtic-backend/uploads/Clinic/achievement
 // Clinic/uploadAchievement
 const uploadAchievement = async (req, res) => {
  try {
    const clinicId = req.user._id;
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.send({ success: 0, message: "Clinic not found" });
    }

    // Store new images
    const newImages = req.files.map(
      (file) => `/Clinic/achievement/${file.filename}`
    );

    // Append new images to existing ones
    clinic.achievementImages = [
      ...(clinic.achievementImages || []),
      ...newImages,
    ];

    await clinic.save();

    return res.send({
      success: 1,
      message: "Achievement images uploaded successfully",
      images: clinic.achievementImages, // return full list
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};
 // Clinic/getClinicAchievement
const getClinicAchievement = async (req, res) => {
  try {
    const clinicId = req.user._id; // authenticated clinic ID

    const clinic = await Clinic.findById(clinicId).select("achievementImages");

    if (!clinic) {
      return res.send({
        success: 0,
        message: "Clinic not found",
      });
    }

    return res.send({
      success: 1,
      message: "Achievement images fetched successfully",
      achievementImages: clinic.achievementImages,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

 //    Clinic/deleteAchievementImages
const deleteAchievementImages = async (req, res) => {
  try {
    const clinicId = req.user._id;
    const { imagePath, all } = req.body;

    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).send({ success: 0, message: "Clinic not found" });
    }

    if (all === true) {
      // Delete all achievement images
      clinic.achievementImages.forEach((imgPath) => {
        const fullPath = path.join(__dirname, '..', 'uploads', imgPath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      });

      clinic.achievementImages = [];
      await clinic.save();

      return res.send({
        success: 1,
        message: "All achievement images deleted successfully",
      });
    }

    if (!imagePath) {
      return res.send({ success: 0, message: "Provide imagePath or all: true" });
    }

    // Delete specific image
    const index = clinic.achievementImages.indexOf(imagePath);
    if (index === -1) {
      return res.send({ success: 0, message: "Image not found in clinic data" });
    }

    const fullPath = path.join(__dirname, '..', 'uploads', imagePath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);

    clinic.achievementImages.splice(index, 1);
    await clinic.save();

    return res.send({
      success: 1,
      message: "Image deleted successfully",
    });

  } catch (error) {
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

  
  //    Clinic/service
  // add serivce in clinic model 
  const service = async (req, res) => {
    try {
      const { specialists } = req.body;
      const clinicId = req.user._id; // ID from token
  
      const clinic = await Clinic.findById(clinicId);
  
      if (!clinic) {
        return res.send({ success: 0, message: "Clinic not found" });
      }
  
      // Find duplicates
      const existingIds = clinic.SpecialistsId.map(id => id.toString());
      const duplicates = specialists.filter(id => existingIds.includes(id));
  
      if (duplicates.length > 0) {
        return res.send({
          success: 0,
          message: "This service already exists",
          duplicateIds: duplicates,
        });
      }
  
      // Append new specialists to existing list
      clinic.SpecialistsId.push(...specialists);
      await clinic.save();
  
      return res.send({
        success: 1,
        message: "Specialists added successfully",
        data: clinic.SpecialistsId,
      });
    } catch (error) {
      return res.send({
        success: 0,
        message: error.message,
      });
    }
  };
  
 // Clinic/getClinicSpecialists
 // get all ClinicSpecialists 
  const getClinicSpecialists = async (req, res) => {
    try {
      const clinicId = req.user._id; // Get clinic ID from token
  
      const clinic = await Clinic.findById(clinicId)
        .populate("SpecialistsId") // populate full specialist documents
        .select("SpecialistsId");   // only return the specialists list
  
      if (!clinic) {
        return res.send({ success: 0, message: "Clinic not found" });
      }
  
      return res.send({
        success: 1,
        message: "Specialists fetched successfully",
        specialists: clinic.SpecialistsId, // populated specialist data
      });
    } catch (error) {
      return res.send({
        success: 0,
        message: error.message,
      });
    }
  };
 // Clinic/removeSpecialistFromClinic
 // remove single ClinicSpecialists 
  const removeSpecialistFromClinic = async (req, res) => {
    try {
      const clinicId = req.user._id; // clinic ID from token
      const { specialistId } = req.body; // ID to remove (can also use req.params)
  
      const updatedClinic = await Clinic.findByIdAndUpdate(
        clinicId,
        {
          $pull: { SpecialistsId: specialistId }, // remove from array
        },
        { new: true } // return updated doc
      );
  
      if (!updatedClinic) {
        return res.send({ success: 0, message: "Clinic not found" });
      }
  
      return res.send({
        success: 1,
        message: "Specialist removed successfully",
        data: updatedClinic.SpecialistsId,
      });
    } catch (error) {
      return res.send({
        success: 0,
        message: error.message,
      });
    }
  };

//      Clinic/updateClinicTimings
  const updateClinicTimings = async (req, res) => {
    try {
      const clinicId = req.user._id; // Token se clinic ID
  
      const {
        startDay,
        endDay,
        MorningStartTime,
        MorningEndTime,
        eveningStartTime,
        eveningEndTime,
        holiday,
      } = req.body;
  
      const updatedClinic = await Clinic.findByIdAndUpdate(
        clinicId,
        {
          $set: {
            startDay,
            endDay,
            MorningStartTime,
            MorningEndTime,
            eveningStartTime,
            eveningEndTime,
            holiday,
          },
        },
        { new: true }
      );
  
      if (!updatedClinic) {
        return res.send({ success: 0, message: "Clinic not found" });
      }
  
      return res.send({
        success: 1,
        message: "Clinic timings updated successfully",
        data: updatedClinic,
      });
    } catch (error) {
      return res.send({
        success: 0,
        message: error.message,
      });
    }
  };

module.exports = {
  registerClinic,
  loginDoctor,
  otpSentToDcotor,
  otpSentToPhone,
  verifyPhoneOtp,
  verifyEmailOtp,
  getClinic,
  updateDoctors,
  getDoctor,
  editclinicDoctor,
  deleteDoctor,
  uploadAchievement,
  deleteAchievementImages,
  getClinicAchievement,
  service,
  getClinicSpecialists,
  removeSpecialistFromClinic,
  updateClinicTimings
};

// posterimage
