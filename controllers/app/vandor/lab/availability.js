const Availability = require("../../../../modal/availability");
const Vendor = require("../../../../modal/vandor");
const moment = require("moment");

const checkAvailablity = async () => {
  try {
    const isExist = await Availability.find();
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//create availability
//Method:Post
//Endpoints:/availability/create
const createAvailability = async (req, res) => {
  try {
    const { day, startTime, endTime, startDate, endDate, slotTime } = req.body;

    // Verify the vendor
    const vendor = await Vendor.findById(req.user._id);
    if (!vendor) {
      return res.send({
        success: 0,
        message: "Vendor is not authenticated",
      });
    }

    // Define time periods (can be adjusted as needed)
    const periods = {
      Morning: { start: "01:00", end: "12:00" },
      Afternoon: { start: "12:00", end: "18:00" },
      Evening: { start: "18:00", end: "24:00" },
    };

    // Helper function to parse and compare times
    const parseTime = (timeStr) => moment(timeStr, "HH:mm");

    const period = periods[day];
    if (!period) {
      return res.send({
        success: 0,
        message: "Invalid day period selected",
      });
    }

    const startSlotTime = parseTime(startTime);
    const endSlotTime = parseTime(endTime);
    const periodStart = parseTime(period.start);
    const periodEnd = parseTime(period.end);

    if (
      !startSlotTime.isBetween(periodStart, periodEnd, null, "[)") ||
      !endSlotTime.isBetween(periodStart, periodEnd, null, "[)")
    ) {
      return res.send({
        success: 0,
        message: `Selected time does not fall within the ${day} period (${period.start} - ${period.end})`,
      });
    }

    // Helper function to parse and compare dates in dd/mm/yy format
    const parseDate = (dateStr) => {
      const [day, month, year] = dateStr.split("/").map(Number);
      return new Date(year + 2000, month - 1, day); // Assuming yy is in 2000s
    };

    const parsedStartDate = parseDate(startDate);
    const parsedEndDate = parseDate(endDate);

    if (isNaN(parsedStartDate) || isNaN(parsedEndDate)) {
      return res.send({
        success: 0,
        message: "Invalid date format. Please use dd/mm/yy.",
      });
    }

    // Check for overlapping availability on the same date and period
    const availabilities = await Availability.find({
      vendorId: req.user._id,
      day,
      startDate: startDate, // Match the specific day
    });

    const isOverlap = availabilities.some((availability) => {
      const availabilityStartTime = parseTime(availability.startTime);
      const availabilityEndTime = parseTime(availability.endTime);
      const availabilityStartDate = parseDate(availability.startDate);
      const availabilityEndDate = parseDate(availability.endDate);

      // Check if the new time slot overlaps with any existing slots
      const isTimeOverlap =
        startSlotTime.isBetween(
          availabilityStartTime,
          availabilityEndTime,
          null,
          "[)"
        ) ||
        endSlotTime.isBetween(
          availabilityStartTime,
          availabilityEndTime,
          null,
          "(]"
        ) ||
        availabilityStartTime.isBetween(
          startSlotTime,
          endSlotTime,
          null,
          "[)"
        ) ||
        availabilityEndTime.isBetween(startSlotTime, endSlotTime, null, "(]");

      const isDateOverlap =
        (parsedStartDate <= availabilityEndDate &&
          parsedEndDate >= availabilityStartDate) ||
        (parsedStartDate >= availabilityStartDate &&
          parsedStartDate <= availabilityEndDate) ||
        (parsedEndDate >= availabilityStartDate &&
          parsedEndDate <= availabilityEndDate);

      return isDateOverlap && isTimeOverlap;
    });

    if (isOverlap) {
      return res.send({
        success: 0,
        message: "Availability for the selected date and time already exists.",
      });
    }

    // Create new availability
    const newAvailability = await Availability.create({
      day,
      startTime,
      endTime,
      startDate,
      endDate,
      slotTime,
      vendorId: req.user._id,
    });

    return res.send({
      success: 1,
      message: "Created successfully",
      data: newAvailability,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// const createAvailability = async (req, res) => {

//   try {
//     const { day, startTime, endTime, startDate, endDate, slotTime } = req.body;

//     const vendor = await Vendor.findById(req.user._id);
//     if (!vendor) {
//       return res.send({
//         success: 0,
//         message: "Vendor is not authenticated",
//       });
//     }

//     // Helper function to parse and compare dates in dd/mm/yy format
//     const parseDate = (dateStr) => {
//       const [day, month, year] = dateStr.split('/').map(Number);
//       return new Date(year + 2000, month - 1, day); // Assuming yy is in 2000s
//     };

//     const parsedStartDate = parseDate(startDate);
//     const parsedEndDate = parseDate(endDate);

//     // Check for overlapping availability
//     const availabilities = await Availability.find({
//       vendorId: req.user._id,
//       day,
//     });

//     const isOverlap = availabilities.some((availability) => {
//       const availabilityStartDate = parseDate(availability.startDate);
//       const availabilityEndDate = parseDate(availability.endDate);

//       return (
//         (parsedStartDate <= availabilityEndDate && parsedEndDate >= availabilityStartDate) ||
//         (parsedStartDate >= availabilityStartDate && parsedStartDate <= availabilityEndDate) ||
//         (parsedEndDate >= availabilityStartDate && parsedEndDate <= availabilityEndDate)
//       );
//     });

//     if (isOverlap) {
//       return res.send({
//         success: 0,
//         message: "Availability between these dates already exists",
//       });
//     }

//     const newAvailability = await Availability.create({
//       day,
//       startTime,
//       endTime,
//       startDate,
//       endDate,
//       slotTime,
//       vendorId: req.user._id,
//     });

//     return res.send({
//       success: 1,
//       message: "Created successfully",
//       data: newAvailability,
//     });
//   } catch (error) {
//     return res.send({
//       success: 0,
//       message: error.message,
//     });
//   }
// };

const getAllStartAndEndDate = async (req, res) => {
  try {
    const findAllDates = await Availability.find({
      vendorId: req.user._id,
    }).select("startDate endDate");

    if (!findAllDates) {
      return res.send({
        success: 0,
        message: "No Availability found of vendor yet.",
      });
    }

    if (findAllDates && findAllDates.length == 0) {
      return res.send({
        success: 0,
        message: "No Availability found of vendor yet.",
      });
    }

    return res.send({
      success: 1,
      message: "All availability found ",
      details: findAllDates,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

const getAvailabiltyOfVendorAndTime = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    const findDate = await Availability.find({
      startDate,
      endDate,
      vendorId: req.user._id,
    });

    if (!findDate) {
      return res.send({
        success: 0,
        message: "Availability not found",
      });
    }

    // return res.send(findDate);

    const result = await Promise.all(
      findDate.map((b) => {
        const startTime = b.startTime.split(" ")[0];
        const endTime = b.endTime.split(" ")[0];
        const slotTime = parseInt(b.slotTime.split(" ")[0]);

        // Parse start time and end time using moment with format detection
        const startMoment = moment(startTime, ["HH:mm", "hh:mm A"], true);
        const endMoment = moment(endTime, ["HH:mm", "hh:mm A"], true);

        if (!startMoment.isValid() || !endMoment.isValid()) {
          return res.send({
            success: 0,
            message: "Invalid start or end time format",
          });
        }

        // Calculate available slots
        const availableSlots = [];
        let currentSlot = moment(startMoment);

        while (currentSlot.isBefore(endMoment)) {
          availableSlots.push(currentSlot.format(`hh:mm A`)); // Format output as 12-hour with AM/PM
          currentSlot.add(slotTime, "minutes");
        }
        let Morning, Afternoon, Evening;
        if (b.day == "Morning") {
          Morning = availableSlots;
        } else if (b.day == "Afternoon") {
          Afternoon = availableSlots;
        } else if (b.day == "Evening") {
          Evening = availableSlots;
        }

        return {
          Morning: Morning ? Morning : [],
          Afternoon: Afternoon ? Afternoon : [],
          Evening: Evening ? Evening : [],
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

//Delete dates
//Method:Delete
//Endpoints:availability/remove/id
const removeDates = async (req, res) => {
  try {
    const { id } = req.params;

    await Availability.findByIdAndDelete(id);

    return res.send({
      success: 1,
      message: "Deleted successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = {
  createAvailability,
  getAvailabiltyOfVendorAndTime,
  getAllStartAndEndDate,
  removeDates,
};
