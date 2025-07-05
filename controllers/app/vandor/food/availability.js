const Availability = require("../../../../modal/availability");
const moment = require("moment");
const Vendor = require("../../../../modal/vandor");

//Create availability
//Method:Post
//Endpoint:/food-available/available
const createAvailability = async (req, res) => {
  try {
    const { day, startTime, endTime, startDate, endDate } = req.body;

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
      return new Date(year + 2000, month - 1, day);
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

//Get food vendor start and end date
//Method:Get
//Endpoint:/food-available/startdate
const getStartAndEndDate = async (req, res) => {
  try {
    const findAllDates = await Availability.find({
      vendorId: req.user._id,
    }).select("startDate endDate day startTime endTime");

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


//Get vendor availabilty time
//Method:Post
//Endpoint:/food-available/timeavailability
const getAvailabiltyOfVendorAndTime = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    // Parse the incoming dates
    const parsedStartDate = moment(startDate, "DD/MM/YYYY").startOf("day");
    const parsedEndDate = moment(endDate, "DD/MM/YYYY").endOf("day");

    // Check if dates are valid
    if (!parsedStartDate.isValid() || !parsedEndDate.isValid()) {
      return res.send({
        success: 0,
        message: "Invalid date format. Please use dd/mm/yyyy.",
      });
    }

    // Convert parsed dates to string format matching your database
    const formattedStartDate = parsedStartDate.format("DD/MM/YYYY");
    const formattedEndDate = parsedEndDate.format("DD/MM/YYYY");

    // Fetch availability for the vendor that overlaps with the specified date range
    const data = await Availability.find({
      vendorId: req.user._id,
      startDate: { $lte: formattedEndDate }, // Availability starts before or on the end date
      endDate: { $gte: formattedStartDate }, // Availability ends after or on the start date
    });

    // If no data is found, send an appropriate response
    if (!data || data.length === 0) {
      return res.send({
        success: 0,
        message: "No availability right now",
      });
    }

    // Prepare availability details to return, converting times to AM/PM format
    const availabilityDetails = data.map((availability) => {
      const startTime = moment(availability.startTime, "HH:mm").format("hh:mm A"); // Convert to AM/PM
      const endTime = moment(availability.endTime, "HH:mm").format("hh:mm A");     // Convert to AM/PM

      return {
        day: availability.day, // Assuming 'day' is a property in your schema
        startDate: availability.startDate,
        endDate: availability.endDate,
        startTime,  // AM/PM formatted start time
        endTime,    // AM/PM formatted end time
      };
    });

    return res.send({
      success: 1,
      message: "Availability fetched successfully",
      details: availabilityDetails,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};



//Remove dates
//Method:Delete
//Endpoint:/food-available/remove/id
const removethestartandenddate = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.send({
        success: 0,
        message: "Availability ID is required.",
      });
    }

    const deletedData = await Availability.findByIdAndDelete(id);

    if (!deletedData) {
      return res.send({
        success: 0,
        message: "No availability found with the provided ID.",
      });
    }

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
  getStartAndEndDate,
  getAvailabiltyOfVendorAndTime,
  removethestartandenddate,
};
