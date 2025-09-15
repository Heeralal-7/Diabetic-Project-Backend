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
// EndPoits:/user-appointment/appointment
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
      problemDescription, // <- new
      age,                // <- new
    } = req.body;

    const requiredFields = {
      serviceType: "Service type is required",
      price: "Price is required",
      startime: "Start time is required",
      day: "Day is required",
      type: "Type is required",
      patientId: "Patient ID is required",
      problemDescription: "Problem description is required",
      age: "Age is required", // <- age validation
    };

    const fieldsToCheck = [
      { field: serviceType, errorMessage: requiredFields.serviceType },
      { field: price, errorMessage: requiredFields.price },
      { field: startime, errorMessage: requiredFields.startime },
      { field: day, errorMessage: requiredFields.day },
      { field: type, errorMessage: requiredFields.type },
      { field: patientId, errorMessage: requiredFields.patientId },
      { field: problemDescription, errorMessage: requiredFields.problemDescription },
      { field: age, errorMessage: requiredFields.age }, // <- check age
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

    // Appointment data
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
      age, // <- added
    };

    if (doctorId) valueData.doctorId = doctorId;
    if (vendorId) valueData.vendorId = vendorId;
    if (couponId && couponId !== "") valueData.couponId = couponId;

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

    // Wallet data
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

// /user-appointment/getAllDoctorAppointments
const getAllUserAppointments = async (req, res) => {
  try {
    const { type, status, page = 1 } = req.query;
    const limit = Number(process.env.LIMIT);
    const pageNumber = +page;
    const skip = (pageNumber - 1) * limit;

    const pipeline = [
      { $match: { userId: req.user._id } },
      {
        $match: {
          ...(status && status === "6"
            ? { status: "6", PostponeStaus: "1" }
            : status ? { status } : {}),
          ...(type && { type })
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
      { $unwind: "$doctorDetails" },
      {
        $lookup: {
          from: "patients",
          localField: "patientId",
          foreignField: "_id",
          as: "patientDetails"
        }
      },
      {
        $unwind: {
          path: "$patientDetails",
          preserveNullAndEmptyArrays: true
        }
      },

      // Get prescription details
      {
        $lookup: {
          from: "doctorprescriptions",
          localField: "_id",
          foreignField: "AppointmentId",
          as: "prescriptionDetails"
        }
      },
      {
        $unwind: {
          path: "$prescriptionDetails",
          preserveNullAndEmptyArrays: true
        }
      },

      // Get insurance details from prescription
      {
        $lookup: {
          from: "addinsurancetypes",
          localField: "prescriptionDetails.addInsuranceTypeId",
          foreignField: "_id",
          as: "insuranceDetails"
        }
      },
      {
        $unwind: {
          path: "$insuranceDetails",
          preserveNullAndEmptyArrays: true
        }
      },

      // Get coupon details
      {
        $lookup: {
          from: "coupons",
          localField: "couponId",
          foreignField: "_id",
          as: "couponDetails"
        }
      },
      {
        $unwind: {
          path: "$couponDetails",
          preserveNullAndEmptyArrays: true
        }
      },

      // Final projection with merged insurance fields into prescription
      {
        $project: {
          _id: 0,
          appointment: "$$ROOT",
          doctor: "$doctorDetails",
          patient: "$patientDetails",
          coupon: "$couponDetails",
          prescription: {
            $mergeObjects: [
              "$prescriptionDetails",
              {
                insuranceName: "$insuranceDetails.addInsurance",
                insuranceImage: "$insuranceDetails.insuranceImage"
              }
            ]
          }
        }
      },

      { $skip: skip },
      { $limit: limit }
    ];

    const details = await Appointment.aggregate(pipeline);

    res.send({
      success: 1,
      message: "User appointments fetched successfully",
      details
    });
  } catch (error) {
    res.send({ success: 0, message: error.message });
  }
};





module.exports = { appointment,getAllUserAppointments };
