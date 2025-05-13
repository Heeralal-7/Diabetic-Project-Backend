const Availability = require("../../../../modal/availability");
const BookedSlot = require("../../../../modal/BookedSlot");
const moment = require("moment");

// Get Available slot of the doctor
// Method:Post
// EndPoint:/user-doctor-availablity
const getAvailabiltyOfVendorAndTimeInUser = async (req, res) => {
  try {
    const { startDate, doctorId, day } = req.body;

    // Step 1: Find all availability slots
    const findDate = await Availability.find({
      $and: [{ startDate }, { doctorId }, { day }],
    });

    if (!findDate || findDate.length === 0) {
      return res.send({
        success: 0,
        message: "Availability not found",
      });
    }

    // Step 2: Find booked slots for the given doctor on the specified day and date
    const bookedSlots = await BookedSlot.find({
      $and: [{ doctorId }, { day }, { startDate }],
    });

    // Function to convert 24-hour format to 12-hour format
    const convertTo12HourFormat = (time24) => {
      return moment(time24, "HH:mm").format("hh:mm A");
    };

    // Create an array of booked slots in 'hh:mm A' format
    const bookedSlotsTimes = bookedSlots.map((slot) => {
      // Assuming `startTime` is in 24-hour format "HH:mm"
      const time24 = slot.startTime;
      return convertTo12HourFormat(time24);
    });

    // Debugging: Check the booked slots times
    // console.log("Booked Slots Times:", bookedSlotsTimes);

    // Step 3: Process available slots and filter out booked slots
    const result = await Promise.all(
      findDate.map(async (b) => {
        const startTime = b.startTime.split(" ")[0];
        const endTime = b.endTime.split(" ")[0];
        const slotTime = parseInt(b.slotTime.split(" ")[0]);

        // Parse start time and end time with error handling
        const startMoment = moment(startTime, ["HH:mm", "hh:mm A"], true);
        const endMoment = moment(endTime, ["HH:mm", "hh:mm A"], true);

        if (!startMoment.isValid() || !endMoment.isValid()) {
          console.error(
            `Invalid start or end time format: ${startTime} to ${endTime}`
          );
          return {
            Morning: [],
            Afternoon: [],
            Evening: [],
          };
        }

        // Calculate available slots
        const availableSlots = [];
        let currentSlot = moment(startMoment);

        while (currentSlot.isBefore(endMoment)) {
          const formattedSlot = currentSlot.format("hh:mm A");

          // Debugging: Check the current slot being processed
          // console.log("Current Slot:", formattedSlot);

          if (!bookedSlotsTimes.includes(formattedSlot)) {
            availableSlots.push(formattedSlot);
          }
          currentSlot.add(slotTime, "minutes");
        }

        // Organize slots by period
        let Morning = [],
          Afternoon = [],
          Evening = [];

        if (day === "Morning") {
          Morning = availableSlots;
        } else if (day === "Afternoon") {
          Afternoon = availableSlots;
        } else if (day === "Evening") {
          Evening = availableSlots;
        }

        return {
          Morning,
          Afternoon,
          Evening,
        };
      })
    );

    return res.send({
      success: 1,
      message: "Fetched successfully",
      details: result,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = { getAvailabiltyOfVendorAndTimeInUser };
