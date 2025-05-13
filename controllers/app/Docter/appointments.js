const Doctor = require("../../../modal/docter");
const Appointment = require("../../../modal/Appointment");
const Prescribe = require("../../../modal/Prescribe");
const Availablity = require("../../../modal/availability");
const BookedSlot = require("../../../modal/BookedSlot");

const formatTime = (time) => {
  let [hours, minutes] = time.split(":");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
};

// Get All apointments
// Method: Get
// EndPoint:/
// query : type 0 for digital and 1 for walkin
// status : 0 for pending 1 for accepted 2 for rejected 3 for done
const getAllDoctorAppointments = async (req, res) => {
  try {
    const { type, status, page = 1 } = req.query;
    const limit = Number(process.env.LIMIT);
    const pageNumber = +page;
    const skip = (pageNumber - 1) * limit;

    const pipeline = [
      {
        $match: {
          _id: req.user._id,
        },
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
    ];

    if (type) {
      pipeline.push({
        $match: {
          "appointments.type": type,
          "appointments.status": status,
        },
      });
    } else {
      pipeline.push({
        $match: {
          "appointments.status": status,
        },
      });
    }

    pipeline.push(
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
          from: "prescribes", // Assuming 'prescribes' is the collection where prescription details are stored
          localField: "appointments._id",
          foreignField: "appointmentId", // Adjust according to the actual field name in 'prescribes'
          as: "prescribeDetails",
        },
      },
      {
        $unwind: {
          path: "$prescribeDetails",
          // preserveNullAndEmptyArrays: true, // To keep appointments even if they don't have prescriptions
        },
      },
      {
        $project: {
          _id: 0,
          appointments: 1,
          "userDetails.name": 1,
          "userDetails.number": 1,
          "userDetails.age": 1,
          "userDetails.address": 1,
          "userDetails.image": 1,
          prescribe: "$prescribeDetails",
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      }
    );
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
// EndPoint:/accept-reject
// status 1 for accepted or 2 for rejected
const acceptOrRejctAppointment = async (req, res) => {
  try {
    const { appointmentId, status } = req.query;

    const isAppointments = await Appointment.findOne({ _id: appointmentId });
    if (!isAppointments) {
      return res.send({
        success: 0,
        message: "Oops Sorry!! No Appointment found.",
      });
    }
    if (!status == 0 || !status == 1) {
      return res.send({
        success: 0,
        message: "Pleaes enter status 0 or 1 ",
      });
    }

    await isAppointments.updateOne({ status });
    return res.send({
      success: 1,
      message: `Appointment ${
        status == "1"
          ? "accepted"
          : status == "2"
          ? "rejected"
          : "change to pending"
      } successfully.`,
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
