const Doctor = require("../../../modal/docter");
const Appointment = require("../../../modal/Appointment");
const Prescribe = require("../../../modal/Prescribe");
const Availablity = require("../../../modal/availability");
const BookedSlot = require("../../../modal/BookedSlot");
const patient = require("../../../modal/addpatientdetails")
const doctorPrescription = require("../../../modal/DoctorPrescription")
const mongoose = require("mongoose"); // ज़रूरी है अगर ObjectId check करना हो
const cron = require("node-cron");
const moment = require("moment");

const autoRevertPostponedAppointments = async () => {
  try {
    const today = moment().format("YYYY-MM-DD");

    const result = await Appointment.updateMany(
      {
        date: today,
        PostponeStaus: "1",
      },
      {
        $set: {
          PostponeStaus: "0",
          status: "1",
        },
      }
    );

    console.log(`${result.modifiedCount} postponed appointments activated today.`);
  } catch (err) {
    console.error("Error in auto reverting postponed appointments:", err.message);
  }
};


cron.schedule("0 6 * * *", () => {
  autoRevertPostponedAppointments();
  console.log("Cron job ran at 6:00 AM");
});




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
    // Extract query parameters: filter by type/status, with pagination support
    const { type, status, page = 1 } = req.query;
    
    // Remove the limit to get all appointments without pagination
    // const limit = Number(process.env.LIMIT) || 10;
    // const pageNumber = +page;
    // const skip = (pageNumber - 1) * limit;

    const pipeline = [
      // Join appointments collection with doctors
      {
        $lookup: {
          from: "appointments",
          localField: "_id",
          foreignField: "doctorId",
          as: "appointments",
        },
      },
      // Unwind to deconstruct appointments array into individual documents
      { $unwind: "$appointments" },
      // Filter appointments: current doctor's appointments with optional status/type filters
      {
        $match: {
          "appointments.doctorId": req.user._id,
          ...(status && { "appointments.status": status }),
          ...(type && { "appointments.type": type }),
        },
      },

      // Join user details for the appointment
      {
        $lookup: {
          from: "users",
          localField: "appointments.userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },

      // Join patient details (if exists)
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
          preserveNullAndEmptyArrays: true, // Keep appointments without patient data
        },
      },

      // Join prescription details (if exists)
      {
        $lookup: {
          from: "doctorprescriptions",
          localField: "appointments._id",
          foreignField: "AppointmentId",
          as: "prescriptionDetails",
        },
      },
      {
        $unwind: {
          path: "$prescriptionDetails",
          preserveNullAndEmptyArrays: true, // Keep appointments without prescriptions
        },
      },
      // Join insurance details (if prescription has insurance)
      {
        $lookup: {
          from: "addinsurancetypes",
          localField: "prescriptionDetails.addInsuranceTypeId",
          foreignField: "_id",
          as: "insuranceDetails",
        },
      },
      {
        $unwind: {
          path: "$insuranceDetails",
          preserveNullAndEmptyArrays: true, // Keep appointments without insurance
        },
      },
      // Join coupon details (if appointment used a coupon)
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
          preserveNullAndEmptyArrays: true, // Keep appointments without coupons
        },
      },
      // Shape the final response structure
      {
        $project: {
          _id: 0,
          appointment: "$appointments",
          user: "$userDetails",
          patient: "$patientDetails",
          coupon: "$couponDetails",
          prescription: {
            $mergeObjects: [
              "$prescriptionDetails",
              {
                insuranceName: "$insuranceDetails.addInsurance",
                insuranceImage: "$insuranceDetails.insuranceImage",
              },
            ],
          },
        },
      },
      // Remove pagination stages to get all records
      // { $skip: skip },
      // { $limit: limit },
    ];

    // Execute aggregation pipeline
    const allAppointments = await Doctor.aggregate(pipeline)
    .sort({createdAt:-1});

    // Return successful response with all appointments
    return res.send({
      success: 1,
      message: "All Appointments fetched successfully",
      details: allAppointments,
    });
  } catch (error) {
    // Handle errors
    return res.send({ success: 0, message: error.message });
  }
};

// Accept or Reject Appointment
// Method: Patch
// EndPoint:/appointments/accept-reject
// status 1 for accepted or 2 for rejected
const acceptOrRejctAppointment = async (req, res) => {
  try {
    const { appointmentId, status } = req.query;
 
    // 1️⃣ Appointment exists?
    const appt = await Appointment.findById(appointmentId);
    if (!appt) {
      return res.status(404).json({
        success: 0,
        message: "No appointment found.",
      });
    }
 
    // 2️⃣ Valid status?
    if (!["0", "1", "2", "3"].includes(status)) {
      return res.status(400).json({
        success: 0,
        message: "Status must be 0 (pending), 1 (accepted), 2 (rejected), or 3 (done).",
      });
    }
 
    // ✅ ADDED: If status is 1 (Accepted), set vendorAcceptedAt
    if (String(status) === "1") {
      appt.vendorAcceptedAt = new Date();
    }
 
    // 3️⃣ If marking as done, enforce PrescriptionStatus === "4"
    if (status === "3") {
      const prescription = await doctorPrescription.findOne({
        AppointmentId: new mongoose.Types.ObjectId(appointmentId),
      });
 
      if (!prescription || String(prescription.PrescriptionStatus) !== "4") {
        return res.status(400).json({
          success: 0,
          message: "Cannot mark as done. PrescriptionStatus must be 4 before completing.",
        });
      }
 
      // 4️⃣ All good → update the PrescriptionStatus to "3"
      prescription.PrescriptionStatus = "3";
      await prescription.save();
 
      // ✨ Also set clinicStatus to "4" on the appointment
      appt.clinicStatus = "4";
 
      // ✨ Set orderCompletedAt timestamp
      appt.orderCompletedAt = new Date();
    }
 
    // 5️⃣ Update appointment status
    appt.status = status;
    await appt.save();
 
    // 6️⃣ Build response message
    let message = "Appointment ";
    if (status === "1") message += "accepted";
    else if (status === "2") message += "rejected";
    else if (status === "3") message += "marked as done";
    else message += "status updated";
 
    return res.json({
      success: 1,
      message: `${message} successfully.`,
      appointment: appt,
    });
  } catch (err) {
    console.error("acceptOrRejctAppointment Error:", err);
    return res.status(500).json({
      success: 0,
      message: "Server error: " + err.message,
    });
  }
};
 


// Add Prescribe of appointment
// Method: Post
// EndPoint:/appointments/prescribe
const addPrescribe = async (req, res) => {
  try {
    const {
      appointmentId,
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
      appointmentId: appointmentId,
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
    const doctorId = req.user._id;

    // Format date for storage
    const formattedDate = moment(date, "DD-MM-YYYY").startOf("day").toDate();

    // Check if appointment exists
    const checkAppointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId,
    });

    if (!checkAppointment) {
      return res.send({
        success: 0,
        message: "No Appointment Exists",
      });
    }

    // Check if booked slot exists
    const checkBookedSlot = await BookedSlot.findOne({
      
      doctorId,
    });

    if (!checkBookedSlot) {
      return res.send({
        success: 0,
        message: "No Booked Slot Yet",
      });
    }

    // Format time
    const formatTime = (time) => {
      return moment(time, "HH:mm").format("hh:mm A");
    };

    const formattedStartime = formatTime(startTime);
    const formattedEndtime = formatTime(endTime);
    const formattedTimeSlot = `${formattedStartime} - ${formattedEndtime}`;

    // Update Appointment (Postpone)
    await checkAppointment.updateOne({
      day,
      timeSlot: formattedTimeSlot,
      date: formattedDate,
      PostponeStaus: "1",
      status: "6",
    });

    // Update Booked Slot
    await checkBookedSlot.updateOne({
      day,
      startTime,
      startDate: formattedDate,
    });

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

// appointments/getpayment
const getpayment = async (req, res) => {
  try {
    const { appointmentId } = req.query;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    return res.json({
      success: true,
      isPaid: appointment.isPaid,
      paymentDetails: appointment.paymentDetails || {},
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

 // appointments/paymentDone
const paymentDone = async (req, res) => {
  try {
    const { appointmentId, upiRef } = req.body;

    const updated = await Appointment.findByIdAndUpdate(
      appointmentId,
      {
        isPaid: true,
        paymentDetails: {
          upiRef,
          paidAt: new Date(),
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    return res.send({
      success:1,
      messgae:"payment done",
      details:updated
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Appointment API
// Method: Delete
// EndPoint:/appointments/delete
const deleteAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.query;

    if (!appointmentId) {
      return res.send({
        success: 0,
        message: "Appointment ID is required",
      });
    }

    const deletedAppointment = await Appointment.findByIdAndDelete(appointmentId);

    if (!deletedAppointment) {
      return res.send({
        success: 0,
        message: "Appointment not found or already deleted",
      });
    }

    return res.send({
      success: 1,
      message: "Appointment deleted successfully",
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
  getpayment,
  paymentDone,
  deleteAppointment // Naya function yahan export kiya gaya hai
};