const Availability = require("../../../../modal/availability");
const BookedSlot = require("../../../../modal/BookedSlot");
const moment = require("moment");

// Get Available slot of the doctor
// Method:Post
// EndPoint:/user-doctor-getAvailabilty


const getAvailabiltyOfVendorAndTimeInUser = async (req, res) => {
  try {
    const { doctorId, day, startDate } = req.body;

    // Step 1: Find availability document
    const availabilityDoc = await Availability.findOne({ doctorId, day });

    if (!availabilityDoc) {
      return res.send({
        success: 0,
        message: "Availability not found",
      });
    }

    const rangeStart = moment(availabilityDoc.startDate, "DD/MM/YYYY");
    const rangeEnd = moment(availabilityDoc.endDate, "DD/MM/YYYY");
    const requestedDate = moment(startDate, "DD/MM/YYYY");

    // Check if requested date is within the range
    if (!requestedDate.isBetween(rangeStart.clone().subtract(1, "days"), rangeEnd.clone().add(1, "days"))) {
      return res.send({
        success: 0,
        message: "Requested date is out of available range",
      });
    }

    const slotTime = parseInt(availabilityDoc.slotTime);
    const startTime = availabilityDoc.startTime;
    const endTime = availabilityDoc.endTime;

    // Step 2: Find booked slots for that date
    const bookedSlots = await BookedSlot.find({
      doctorId,
      day,
      startDate, // match with requested startDate
    });

    const bookedSlotsTimes = bookedSlots.map((slot) =>
      moment(slot.startTime, "HH:mm").format("hh:mm A")
    );

    // Step 3: Generate available time slots
    const availableSlots = [];
    let currentSlot = moment(startTime, "HH:mm");
    const endSlot = moment(endTime, "HH:mm");

    while (currentSlot.isBefore(endSlot)) {
      const slot = currentSlot.format("hh:mm A");
      if (!bookedSlotsTimes.includes(slot)) {
        availableSlots.push(slot);
      }
      currentSlot.add(slotTime, "minutes");
    }

    return res.send({
      success: 1,
      message: "Fetched successfully",
      details: {
        date: startDate,
        [day]: availableSlots,
      },
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};



module.exports = { getAvailabiltyOfVendorAndTimeInUser };
