const Appointment = require("../../../../modal/Appointment");
const BookedSlot = require("../../../../modal/BookedSlot");
const Wallet = require("../../../../modal/wallet");
const AddMember = require("../../../../modal/AddMembers");

const formatTime = (time) => {
  let [hours, minutes] = time.split(":");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
};

// Create user appointments
// Method:Post
// EndPoits:/add-appointment
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
      endtime,
      problem,
      type,
      day,
      patientId,
    } = req.body;

    const requiredFields = {
      serviceType: "Service type is required",
      price: "Price is required",
      startime: "Start time is required",
      endtime: "End time is required",
      problem: "Problem description is required",
      day: "Day is required",
      type: "Type is required",
      patientId: "Patient ID is required",
    };

    const fieldsToCheck = [
      { field: serviceType, errorMessage: requiredFields.serviceType },
      { field: price, errorMessage: requiredFields.price },
      { field: startime, errorMessage: requiredFields.startime },
      { field: endtime, errorMessage: requiredFields.endtime },
      { field: problem, errorMessage: requiredFields.problem },
      { field: day, errorMessage: requiredFields.day },
      { field: type, errorMessage: requiredFields.type },
      { field: patientId, errorMessage: requiredFields.patientId },
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
    const formattedEndtime = formatTime(endtime);
    const formattedTimeSlot = `${formattedStartime} - ${formattedEndtime}`;

    // Checking you have booked your appointment or not
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

    let valueData = {
      userId: req.user._id,
      serviceType,
      date,
      price,
      timeSlot: formattedTimeSlot,
      doctorId,
      vendorId,
      problem,
      type,
      day,
      patientId,
    };
    if (doctorId) {
      valueData.doctorId = doctorId;
    }

    if (vendorId) {
      valueData.vendorId = vendorId;
    }

    const newappointment = await Appointment.create(valueData);

    await BookedSlot.create({
      startTime: startime,
      startDate: date,
      userId: req.user._id,
      doctorId,
      vendorId,
      day,
      price,
      patientId,
    });

    await Wallet.create({
      credit: price,
      userId: req.user._id,
      doctorId,
      vendorId,
    });

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

module.exports = { appointment };
