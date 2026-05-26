const Appointment = require("../../../modal/Appointment");
const BookedSlot = require("../../../modal/BookedSlot");
const Wallet = require("../../../modal/wallet");
const AddMember = require("../../../modal/AddMembers");
const Doctor = require("../../../modal/docter");
const Prescribe = require("../../../modal/Prescribe");
const Availablity = require("../../../modal/availability");
const patient = require("../../../modal/addpatientdetails");
const doctorPrescription = require("../../../modal/DoctorPrescription");
const mongoose = require("mongoose"); // ज़रूरी है अगर ObjectId check करना हो
const User = require("../../../modal/user");
const Clinic = require("../../../modal/clinic");
const Rating = require("../../../modal/rating");

//   ClinicAppointment/getAllClinicAppointments
const getAllClinicAppointments = async (req, res) => {
  try {
    const { type, page = 1 } = req.query;
    const limit = Number(process.env.LIMIT) || 10;
    const pageNumber = +page;
    const skip = (pageNumber - 1) * limit;

    const clinicId = req.user._id;

    const pipeline = [
      {
        $match: {
          clinicId,
          // clinicStatus: { $in: ["1", "2"] }, // ✅ clinic active or pending
          status: { $nin: [2, 3, 6] }, // ✅ exclude specific statuses
          PostponeStaus: { $ne: "1" }, // ✅ exclude postponed appointments
          ...(type && { type }), // optional filter
        },
      },
      {
        $lookup: {
          from: "doctors",
          localField: "doctorId",
          foreignField: "_id",
          as: "doctorDetails",
        },
      },
      { $unwind: "$doctorDetails" },
      {
        $lookup: {
          from: "patients",
          localField: "patientId",
          foreignField: "_id",
          as: "patientDetails",
        },
      },
      {
        $unwind: { path: "$patientDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "doctorprescriptions",
          localField: "_id",
          foreignField: "AppointmentId",
          as: "prescriptionDetails",
        },
      },
      {
        $unwind: {
          path: "$prescriptionDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "coupons",
          localField: "couponId",
          foreignField: "_id",
          as: "couponDetails",
        },
      },
      { $unwind: { path: "$couponDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "clinics",
          localField: "clinicId",
          foreignField: "_id",
          as: "clinicDetails",
        },
      },
      { $unwind: { path: "$clinicDetails", preserveNullAndEmptyArrays: true } },
      { $skip: skip },
      { $limit: limit },
    ];

    const details = await Appointment.aggregate(pipeline);

    res.send({
      success: 1,
      message: "Clinic appointments fetched successfully",
      details,
    });
  } catch (error) {
    res.send({
      success: 0,
      message: error.message,
    });
  }
};

//  ClinicAppointment/acceptOrRejctAppointment
const acceptOrRejctAppointment = async (req, res) => {
  try {
    const { appointmentId, status } = req.query;
    const { reason } = req.body;

    // Find appointment
    const appt = await Appointment.findById(appointmentId);
    if (!appt) {
      return res.send({ success: 0, message: "No Appointment found." });
    }

    // Check if appointment has clinicId
    if (!appt.clinicId) {
      return res.send({
        success: 0,
        message: "Unauthorized clinic access. Appointment has no clinicId.",
      });
    }

    // Validate status
    if (!["0", "1", "2", "3"].includes(status)) {
      return res.send({
        success: 0,
        message:
          "Status must be 0 (pending), 1 (accepted), 2 (rejected), or 3 (done)",
      });
    }

    // If status === "3" (done), check prescription first
    if (status === "3") {
      const prescription = await doctorPrescription.findOne({
        AppointmentId: appointmentId,
      });

      if (!prescription || String(prescription.PrescriptionStatus) !== "4") {
        return res.send({
          success: 0,
          message:
            "Cannot mark as done. PrescriptionStatus must be 4 before completing.",
        });
      }

      // Update prescription status to "3"
      prescription.PrescriptionStatus = "3";
      await prescription.save();
    }

    // Build update object
    let updateData = {};

    if (status === "1") {
      updateData.status = "0"; // Set status to 0 on accept
      updateData.clinicStatus = "2"; // clinicStatus 2 on accept
    } else if (status === "2") {
      updateData.status = "10"; // Set status to 10 on reject
      updateData.clinicStatus = "3"; // clinicStatus 3 on reject
      updateData.rejectionReason = reason || "No reason provided";
    } else {
      // For other statuses (0 or 3), update status directly
      updateData.status = status;
    }

    // Update appointment
    await Appointment.findByIdAndUpdate(appointmentId, updateData);

    // Response message
    let message = "Appointment ";
    if (status === "1") message += "accepted";
    else if (status === "2") message += "rejected";
    else if (status === "3") message += "marked as done";
    else message += "status updated";

    return res.send({ success: 1, message: `${message} successfully.` });
  } catch (err) {
    console.error(err);
    return res.send({ success: 0, message: err.message });
  }
};

// clinicid appoinmentid doctorid
// ClinicAppointment/reassignDoctor
const reassignDoctor = async (req, res) => {
  try {
    const { appointmentId, doctorid } = req.body;
    // Authenticated user is the clinic itself; use its _id as the clinic ID
    const clinicId = req.user?._id;

    // Check for required fields
    if (!appointmentId || !doctorid || !clinicId) {
      console.error("Missing fields:", { appointmentId, doctorid, clinicId });
      return res.status(400).json({
        success: 0,
        message: "Appointment ID, Doctor ID, and Clinic ID are required",
      });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res
        .status(400)
        .json({ success: 0, message: "Invalid appointment ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(doctorid)) {
      return res.status(400).json({ success: 0, message: "Invalid doctor ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(clinicId)) {
      return res.status(400).json({ success: 0, message: "Invalid clinic ID" });
    }

    // Find the appointment under the clinic
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      clinicId: clinicId, // stored as ObjectId in Appointment
    });

    if (!appointment) {
      return res.status(404).json({
        success: 0,
        message: "Appointment not found or not under your clinic",
      });
    }

    // Check if the same doctor is already assigned
    if (appointment.doctorId?.toString() === doctorid.toString()) {
      return res.json({
        success: 0,
        message: "Same doctor is already assigned to this appointment",
      });
    }

    // Reassign doctor and save
    appointment.doctorId = doctorid;
    await appointment.save();

    return res.json({
      success: 1,
      message: "Doctor reassigned successfully",
      updatedAppointment: appointment,
    });
  } catch (error) {
    console.error("Reassign Doctor Error:", error);
    return res.status(500).json({
      success: 0,
      message: "Server error: " + error.message,
    });
  }
};
//  ClinicAppointment/getClinicOrderHistory
const getClinicOrderHistory = async (req, res) => {
  try {
    // 1️⃣ Identify clinic
    const clinicId = req.user._id;

    // 2️⃣ Validate clinicId
    if (!mongoose.Types.ObjectId.isValid(clinicId)) {
      return res.status(400).json({
        success: 0,
        message: "Invalid clinic ID",
      });
    }

    // 3️⃣ Pagination params
    const { page = 1 } = req.query;
    const limit = Number(process.env.LIMIT) || 20;
    const skip = (Number(page) - 1) * limit;

    // 4️⃣ Aggregation pipeline
    const pipeline = [
      // Match only this clinic’s done appointments
      {
        $match: {
          clinicId: new mongoose.Types.ObjectId(clinicId),
          clinicStatus: "4",
        },
      },

      // Lookup doctor details
      {
        $lookup: {
          from: "doctors",
          localField: "doctorId",
          foreignField: "_id",
          as: "doctorDetails",
        },
      },
      { $unwind: { path: "$doctorDetails", preserveNullAndEmptyArrays: true } },

      // Lookup patient details
      {
        $lookup: {
          from: "patients",
          localField: "patientId",
          foreignField: "_id",
          as: "patientDetails",
        },
      },
      { $unwind: { path: "$patientDetails", preserveNullAndEmptyArrays: true } },

      // Lookup user who booked
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },

      // Lookup prescription details
      {
        $lookup: {
          from: "doctorprescriptions",
          localField: "_id",
          foreignField: "AppointmentId",
          as: "prescriptionDetails",
        },
      },
      { $unwind: { path: "$prescriptionDetails", preserveNullAndEmptyArrays: true } },

      // Lookup coupon details
      {
        $lookup: {
          from: "coupons",
          localField: "couponId",
          foreignField: "_id",
          as: "couponDetails",
        },
      },
      { $unwind: { path: "$couponDetails", preserveNullAndEmptyArrays: true } },

      // Lookup clinic details (self)
      {
        $lookup: {
          from: "clinics",
          localField: "clinicId",
          foreignField: "_id",
          as: "clinicDetails",
        },
      },
      { $unwind: { path: "$clinicDetails", preserveNullAndEmptyArrays: true } },

      // Sort and paginate
      { $sort: { updatedAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    // 5️⃣ Execute pipeline
    const history = await Appointment.aggregate(pipeline);

    // 6️⃣ Return
    return res.status(200).json({
      success: 1,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error("getClinicOrderHistory error:", error);
    return res.status(500).json({
      success: 0,
      message: error.message,
    });
  }
};



const getAverage = async (data, ClinicId) => {
  try {
    const ratings = await Rating.find({
      $and: [{ rating: data }, { ClinicId }],
    });
    // console.log(ratings);
    // Check if there are no ratings found
    if (ratings.length === 0) {
      return { average: 0 };
    }
    let sum = 0;

    // Iterate over each rating document
    ratings.forEach((d) => {
      const numericRating = Number(d.rating);

      // Ensure the rating is between 0 and 5
      if (numericRating >= 0 && numericRating <= 5) {
        sum += numericRating;
      }
    });

    const count = ratings.length;
    // Calculate the average rating
    const avg = sum / count;

    // Return the calculated average
    return { average: avg };
  } catch (error) {
    // Log any errors and return null as the average
    console.error("Error calculating average rating:", error);
  }
};

const getClinicRating = async (req, res) => {
  try {
    // 1️⃣ Fetch all ratings for this clinic, populating user details
    const ClinicId = req.user._id;
    const ratings = await Rating.find({ ClinicId })
      .populate({ path: "userId", select: "name image" })
      .sort({ rating: -1 });

    if (!ratings || ratings.length === 0) {
      return res.status(201).json({
        success: 1,
        message: "No ratings found for this clinic",
      });
    }

    // 2️⃣ Calculate sum and overall average rating
    const totalCount = ratings.length;
    const sum = ratings.reduce((acc, r) => acc + Number(r.rating), 0);
    const overallRating = totalCount > 0 ? Math.ceil(sum / totalCount) : 0;

    // 3️⃣ Compute category-wise averages (0 to 5 stars)
    const category = ["0", "1", "2", "3", "4", "5"];
    const averages = {};
    for (let cat of category) {
      // getAverage(targetRating, clinicId) returns { count, average }
      const result = await getAverage(cat, ClinicId, "ClinicId");
      // e.g. averages.excellent, averages.good...
      switch (cat) {
        case "5":
          averages.excellent = result.average;
          break;
        case "4":
          averages.good = result.average;
          break;
        case "3":
          averages.average = result.average;
          break;
        case "2":
          averages.belowAverage = result.average;
          break;
        case "1":
          averages.poor = result.average;
          break;
        default:
          break;
      }
    }

    // 4️⃣ Respond with aggregated data
    return res.status(200).json({
      success: 1,
      message: "Clinic ratings fetched successfully",
      overallRating,
      ...averages,
      count: totalCount,
      ratings, // raw list if needed
    });
  } catch (error) {
    console.error("getClinicRating error:", error);
    return res.status(500).json({
      success: 0,
      message: error.message,
    });
  }
};

const getRatingFeedbackclinic = async (req, res) => {
  try {
    let { page, limit } = req.query;
    page = parseInt(page, 10) || 1;
    limit = +limit || 5;

    const skip = (page - 1) * limit;

    const getAllRating = await Rating.find({ ClinicId: req.user._id })
      .populate({
        path: "userId",
        select: "name image",
      })
      .sort({
        rating: -1,
      })
      .skip(skip)
      .limit(limit);
    if (!getAllRating) {
      return res.send({
        success: 0,
        message: "Not found Rating yet",
      });
    }
    return res.send({
      success: 1,
      message: "Feedback fetched successfully",
      details: getAllRating,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = {
  getAllClinicAppointments,
  acceptOrRejctAppointment,
  reassignDoctor,
  getClinicOrderHistory,
  getClinicRating,
  getRatingFeedbackclinic,
};
