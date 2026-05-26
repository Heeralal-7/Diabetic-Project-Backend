const Availability = require("../../../modal/availability");
const Docter = require("../../../modal/docter");
const moment = require("moment");

// Create doctor availability
//Method: Post
//Endpoints:/doctor-availability/create
const createAvailability = async (req, res) => {
  try {
    const { day, startTime, endTime, startDate, endDate, slotTime } = req.body;

    const isExist = await Availability.findOne({
      $and: [
        { startDate },
        { endDate },
        { startTime },
        { endTime },
        { day: day },
        { docterId: req.user._id },
      ],
    });

    if (isExist) {
      return res.send({
        success: 0,
        message: "This startDate or endDate already exists",
      });
    }

    const newAvailability = await Availability.create({
      day,
      startTime,
      endTime,
      startDate,
      endDate,
      slotTime,
      doctorId: req.user._id,
    });

    return res.send({
      success: 1,
      message: "Created successfully",
      details:newAvailability
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Needs to delete automatically...
const deleteExpiredAvailablity = async (currentTime, currentDate) => {
  const result = await Availability.deleteMany({
    $or: [
      // Documents where endDate is less than the current date
      { endDate: { $lt: currentDate } },
      // Documents where endDate is today but endTime is less than the current time
      {
        $and: [
          { endDate: { $eq: currentDate } },
          { endTime: { $lt: currentTime } },
        ],
      },
    ],
  });
};

// Get doctor startorenddate
//Method: Get
//Endpoints:/doctor-availability/dates
const getAllStartAndEndDate = async (req, res) => {
  try {
    let testDate = new Date();
    const currentTime = moment(testDate).format("HH:mm");
    const currentDate = moment(testDate).format("DD/MM/YYYY");
    await deleteExpiredAvailablity(currentTime, currentDate);

    const findAllDates = await Availability.find({
      doctorId: req.user._id,
    }).select("day startTime endTime startDate endDate slotTime vendorId doctorId");
    if (!findAllDates) {
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

// Get Availability of doctor time
//Method: Post
//Endpoints:/doctor-availability/getAvailabilty
const getAvailabiltyOfDoctorAndTime = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    const findDate = await Availability.find({
      $and: [{ startDate }, { endDate }, { doctorId: req.user._id }],
      // startDate,
      // endDate,
      // doctorId: req.user._id,
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

// Delete doctor availability
//Method: Delete
//Endpoint:/doctor-availability/delete/:id
const deleteAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if availability exists and belongs to the doctor
    const availability = await Availability.findOne({
      _id: id,
      doctorId: req.user._id,
    });

    if (!availability) {
      return res.send({
        success: 0,
        message: "Availability not found or unauthorized",
      });
    }

    await Availability.findByIdAndDelete(id);

    return res.send({
      success: 1,
      message: "Availability deleted successfully",
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
  getAvailabiltyOfDoctorAndTime,
  getAllStartAndEndDate,
  deleteAvailability,
};
