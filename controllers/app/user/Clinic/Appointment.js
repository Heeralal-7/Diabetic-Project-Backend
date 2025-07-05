const Appointment = require("../../../../modal/Appointment");
const BookedSlot = require("../../../../modal/BookedSlot");
const Wallet = require("../../../../modal/wallet");
const AddMember = require("../../../../modal/AddMembers");
const Doctor = require("../../../../modal/docter");
const Prescribe = require("../../../../modal/Prescribe");
const Availablity = require("../../../../modal/availability");
const patient = require("../../../../modal/addpatientdetails")
const doctorPrescription = require("../../../../modal/DoctorPrescription")
const mongoose = require("mongoose"); // ज़रूरी है अगर ObjectId check करना हो
const User = require("../../../../modal/user")
const Clinic = require("../../../../modal/clinic")
const formatTime = (time) => {
  // If already includes AM or PM, return as-is
  if (time.toLowerCase().includes("am") || time.toLowerCase().includes("pm")) {
    return time.toUpperCase(); // Normalize casing
  }

  let [hours, minutes] = time.split(":");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes.padStart(2, "0")} ${ampm}`;
};

// Create user appointments
// Method:Post
// EndPoits:/clincuser/appointment
// type 0 for digital and 1 for walkin
// day  may be Morning | Afternoon | Evening
const appointment = async (req, res) => {
  try {
    const {
      doctorId,
      vendorId,
      serviceType,
      date,
      price,
      startime,
      type,
      day,
      patientId,
      couponId,
      problemDescription,
      age,
      clinicId, // <- new
    } = req.body;

    const requiredFields = {
      serviceType: "Service type is required",
      price: "Price is required",
      startime: "Start time is required",
      day: "Day is required",
      type: "Type is required",
      patientId: "Patient ID is required",
      problemDescription: "Problem description is required",
      age: "Age is required",
    };

    const fieldsToCheck = [
      { field: serviceType, errorMessage: requiredFields.serviceType },
      { field: price, errorMessage: requiredFields.price },
      { field: startime, errorMessage: requiredFields.startime },
      { field: day, errorMessage: requiredFields.day },
      { field: type, errorMessage: requiredFields.type },
      { field: patientId, errorMessage: requiredFields.patientId },
      { field: problemDescription, errorMessage: requiredFields.problemDescription },
      { field: age, errorMessage: requiredFields.age },
    ];

    const missingFields = fieldsToCheck.filter((field) => !field.field);
    if (missingFields.length > 0) {
      const errorMessages = missingFields.map((field) => field.errorMessage);
      return res.send({
        success: 0,
        message: "The following fields are required:",
        errors: errorMessages,
      });
    }

    const formattedStartime = formatTime(startime);
    const formattedTimeSlot = `${formattedStartime}`;

    // Check for duplicate booking
    const isExist = await BookedSlot.findOne({
      $or: [
        {
          $and: [
            { doctorId },
            { startDate: date },
            { startTime: startime },
            { userId: req.user._id },
          ],
        },
        {
          $and: [
            { vendorId },
            { startDate: date },
            { startTime: startime },
            { userId: req.user._id },
          ],
        },
      ],
    });

    if (isExist) {
      return res.send({
        success: 0,
        message: "You have already booked your appointment.",
      });
    }

    // Build appointment data
    let valueData = {
      userId: req.user._id,
      serviceType,
      date,
      price,
      timeSlot: formattedTimeSlot,
      type,
      day,
      patientId,
      problemDescription,
      age,
    };

    if (doctorId) valueData.doctorId = doctorId;
    if (vendorId) valueData.vendorId = vendorId;
    if (couponId && couponId !== "") valueData.couponId = couponId;

    // ✅ If clinicId is present
    if (clinicId) {
      valueData.clinicId = clinicId;
      valueData.clinicStatus = "1";
      valueData.status = "9";
    }

    const newappointment = await Appointment.create(valueData);

    // Booked slot data
    const bookedSlotData = {
      startTime: startime,
      startDate: date,
      userId: req.user._id,
      day,
      price,
      patientId,
    };
    if (doctorId) bookedSlotData.doctorId = doctorId;
    if (vendorId) bookedSlotData.vendorId = vendorId;
    if (couponId && couponId !== "") bookedSlotData.couponId = couponId;

    await BookedSlot.create(bookedSlotData);

    // Wallet entry
    const walletData = {
      credit: price,
      userId: req.user._id,
    };
    if (doctorId) walletData.doctorId = doctorId;
    if (vendorId) walletData.vendorId = vendorId;

    await Wallet.create(walletData);

    return res.send({
      message: "Appointment created successfully",
      success: 1,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

  

// /clincuser/getAllUserAppointments
const getAllUserAppointments = async (req, res) => {
  try {
    const { type, page = 1, clinicStatus } = req.query;
    const limit = Number(process.env.LIMIT) || 100; // If you want all data, set high limit
    const pageNumber = +page;
    const skip = (pageNumber - 1) * limit;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: 0, message: "Unauthorized user." });
    }

    console.log("userId:", req.user._id);
    console.log("clinicStatus:", clinicStatus);
    console.log("type:", type);

    // Status filter
    const allStatuses = ["1", "2", "3", "4"];
    const statusFilter = clinicStatus && allStatuses.includes(clinicStatus)
      ? [clinicStatus]
      : allStatuses;

    const pipeline = [
      {
        $match: {
          userId: req.user._id,
          clinicStatus: { $in: statusFilter },
          ...(type ? { type } : {})
        }
      },
      {
        $lookup: {
          from: "doctors",
          localField: "doctorId",
          foreignField: "_id",
          as: "doctorDetails"
        }
      },
      { $unwind: { path: "$doctorDetails", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "patients",
          localField: "patientId",
          foreignField: "_id",
          as: "patientDetails"
        }
      },
      { $unwind: { path: "$patientDetails", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "doctorprescriptions",
          localField: "_id",
          foreignField: "AppointmentId",
          as: "prescriptionDetails"
        }
      },

      {
        $lookup: {
          from: "coupons",
          localField: "couponId",
          foreignField: "_id",
          as: "couponDetails"
        }
      },
      { $unwind: { path: "$couponDetails", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "clinics",
          localField: "clinicId",
          foreignField: "_id",
          as: "clinicDetails"
        }
      },
      { $unwind: { path: "$clinicDetails", preserveNullAndEmptyArrays: true } },

      {
        $addFields: {
          clinicPriority: {
            $switch: {
              branches: [
                { case: { $eq: ["$clinicStatus", "1"] }, then: 1 },
                { case: { $eq: ["$clinicStatus", "2"] }, then: 2 },
                { case: { $eq: ["$clinicStatus", "3"] }, then: 3 },
                { case: { $eq: ["$clinicStatus", "4"] }, then: 4 }
              ],
              default: 5
            }
          }
        }
      },
      { $sort: { clinicPriority: 1, createdAt: -1 } },

      { $skip: skip },
      { $limit: limit }
    ];

    const details = await Appointment.aggregate(pipeline);

    if (details.length === 0) {
      console.warn("No appointments found for user", req.user._id);
    }

    return res.status(200).json({
      success: 1,
      message: "User appointments fetched successfully",
      total: details.length,
      details
    });

  } catch (error) {
    console.error("getAllUserAppointments error:", error);
    return res.status(500).json({
      success: 0,
      message: error.message
    });
  }
};





  


module.exports = {appointment,getAllUserAppointments}
 