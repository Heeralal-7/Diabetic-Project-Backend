const Doctor = require("../../../modal/docter");
const Appointment = require("../../../modal/Appointment");
const Prescribe = require("../../../modal/Prescribe");
const Availablity = require("../../../modal/availability");
const BookedSlot = require("../../../modal/BookedSlot");
const patient = require("../../../modal/addpatientdetails")
const formatTime = (time) => {
  let [hours, minutes] = time.split(":");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
};

// Get All apointments
// Method: Get
// EndPoint:/appointments/
// query : type 0 for digital and 1 for walkin
// status : 0 for pending 1 for accepted 2 for rejected 3 for done
const getAllDoctorAppointments = async (req, res) => {
  try {
    const { type, status, page = 1 } = req.query;
    const limit = Number(process.env.LIMIT);
    const pageNumber = +page;
    const skip = (pageNumber - 1) * limit;

    const matchStage = {
      _id: req.user._id,
    };

    const appointmentMatch = {};
    if (status) appointmentMatch["appointments.status"] = status;
    if (type) appointmentMatch["appointments.type"] = type;

    const pipeline = [
      {
        $match: matchStage,
      },
      {
        $lookup: {
          from: "appointments",
          localField: "_id",
          foreignField: "doctorId",
          as: "appointments",
        },
      },
      {
        $unwind: "$appointments",
      },
      {
        $match: appointmentMatch,
      },
      {
        $lookup: {
          from: "users",
          localField: "appointments.userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $lookup: {
          from: "patients",
          localField: "appointments.patientId",
          foreignField: "_id",
          as: "patientDetails",
        },
      },
      {
        $unwind: {
          path: "$patientDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "prescribes",
          localField: "appointments._id",
          foreignField: "appointmentId",
          as: "prescribeDetails",
        },
      },
      {
        $unwind: {
          path: "$prescribeDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "coupons",
          localField: "appointments.couponId",
          foreignField: "_id",
          as: "couponDetails",
        },
      },
      {
        $unwind: {
          path: "$couponDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          appointment: "$appointments",
          prescribe: "$prescribeDetails",
          coupon: "$couponDetails",
          patient: "$patientDetails", // Includes `pic`, `name`, etc.
          user: "$userDetails",       // Optional, includes account-level info
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      }
    ];

    const allAppointments = await Doctor.aggregate(pipeline);

    return res.send({
      success: 1,
      message: "All Appointments fetched successfully",
      details: allAppointments,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};




// Accept or Reject Appointment
// Method: Patch
// EndPoint:/appointments/accept-reject
// status 1 for accepted or 2 for rejected
const acceptOrRejctAppointment = async (req, res) => {
  try {
    const { appointmentId, status } = req.query;

    // Check if the appointment exists
    const isAppointments = await Appointment.findOne({ _id: appointmentId });
    if (!isAppointments) {
      return res.send({
        success: 0,
        message: "Oops Sorry!! No Appointment found.",
      });
    }

    // Allow only 0, 1, or 2 as valid statuses
    if (!["0", "1", "2"].includes(status)) {
      return res.send({
        success: 0,
        message: "Please enter status 0, 1 or 2",
      });
    }

    // Update appointment status
    await isAppointments.updateOne({ status });

    // Message based on status
    let message = "Appointment ";
    if (status === "1") message += "accepted";
    else message += "rejected";

    return res.send({
      success: 1,
      message: `${message} successfully.`,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};



// Add Prescribe of appointment
// Method: Post
// EndPoint:/appointments/prescribe
const addPrescribe = async (req, res) => {
  try {
    const {
      adviceInvestigation,
      anyAdvice,
      specialInstruction,
      nextAppointment,
      medicineName,
      morning,
      afternoon,
      evening,
      days,
    } = req.body;
    const requiredFields = [
      {
        fields: adviceInvestigation,
        error: "Please Enter Advice Investigation",
      },
      {
        fields: anyAdvice,
        error: "Please Enter Any Advice",
      },
      {
        fields: specialInstruction,
        error: "Please Enter Special Instruction",
      },
      {
        fields: nextAppointment,
        error: "Please Enter Next Appointment",
      },
      {
        fields: medicineName,
        error: "Please Enter Medicine Name",
      },
      {
        fields: days,
        error: "Please Enter the days",
      },
    ];

    const invalidFields = requiredFields.filter((item) => !item.fields);
    if (invalidFields.length > 0) {
      const errorMessages = invalidFields.map((d) => {
        return d.error;
      });
      return res.send({
        success: 0,
        message: errorMessages.join(", "),
      });
    }

    const createPrescribe = await Prescribe.create({
      adviceInvestigation,
      anyAdvice,
      specialInstruction,
      nextAppointment,
      medicineName,
      morning,
      afternoon,
      evening,
      days,
      appointmentId: req.user._id,
    });
    await Appointment.findByIdAndUpdate(appointmentId, {
      prescribe: createPrescribe._id,
    });
    return res.send({
      success: 1,
      message: "Prescribe is added successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Postponed the appointment
// Method: Post
// EndPoint:/appointments/postponed
const postPonedAppointment = async (req, res) => {
  try {
    const { day, date, startTime, endTime, appointmentId } = req.body;
    // Check availablity
    const isExist = await Availablity.findOne({
      $and: [{ doctorId: req.user._id }, { startDate: date }, { day }],
    });

    if (!isExist) {
      return res.send({
        success: 0,
        message: "No Availablity Found",
      });
    }
    // Finding Appointment by their id
    const checkAppointment = await Appointment.findOne({
      $and: [{ _id: appointmentId }, { doctorId: req.user._id }],
    });

    if (!checkAppointment) {
      return res.send({
        success: 0,
        message: "No Appointment Exists",
      });
    }

    // Checking Booking Slot that i have booked
    const checkBookedSlot = await BookedSlot.findOne({
      $and: [{ appointmentId }, { doctorId: req.user._id }],
    });
    if (!checkBookedSlot) {
      return res.send({
        success: 0,
        message: "No Booked Slot Yet",
      });
    }

    const formattedStartime = formatTime(startTime);
    const formattedEndtime = formatTime(endTime);
    const formattedTimeSlot = `${formattedStartime} - ${formattedEndtime}`;

    //Updating the appointment
    await checkAppointment.updateOne({
      day,
      timeSlot: formattedTimeSlot,
      date,
    });
    // Updating the bookedSlot
    await checkBookedSlot.updateOne({ day, startTime, startDate: date });

    return res.send({
      success: 1,
      message: "Appointment has been postponed successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = {
  getAllDoctorAppointments,
  acceptOrRejctAppointment,
  addPrescribe,
  postPonedAppointment,
};
