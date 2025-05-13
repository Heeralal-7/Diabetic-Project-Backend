const Vendor = require("../../../../modal/vandor");
const Addtest = require("../../../../modal/addTest");
const Availability = require("../../../../modal/availability");
const moment = require("moment");
const Package = require("../../../../modal/AddPackages");



//Get vendor details
//Method:Get
//Endpoints:/labnear/near
const getVendor = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;
    // Fetch all vendors
    const vendors = await Vendor.find({ vendor: "Lab" })
      .skip(skip)
      .limit(limit);

    // Use Promise.all to handle asynchronous operations in parallel
    const vendorDetails = await Promise.all(
      vendors.map(async (vendor) => {
        // Fetch associated availability for the vendor
        const availability = await Availability.find({ vendorId: vendor._id });

        // Fetch associated tests for the vendor
        const tests = await Addtest.find({ vendorId: vendor._id });

        // Return vendor details along with availability and tests
        return {
          ...vendor._doc, // Spread the vendor's details
          availability,
          tests,
        };
      })
    );

    return res.send({
      success: 1,
      data: vendorDetails,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Get vendor availability
//Method:Get
//Endpoints:/labnear/available/id
const getVendoravailability = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await Availability.find({ vendorId: id });

    return res.send({
      success: 1,
      message: "Fetched",
      details: data,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Get vendor start date or end date
//Method:Get
//Endpoints:/labnear/startdate/id
const getAllStartAndEndDateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const findAllDates = await Availability.find({
      vendorId: id,
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

//Get vendor time slot
//Method:post
//Endpoints:/labnear/time/id
const getAvailabiltyOfUserVendorAndTime = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const { id } = req.params;
    console.log(req.body);
    const findDate = await Availability.find({
      startDate,
      endDate,
      vendorId: id,
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

const getVendorTest = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await Addtest.find({ vendorId: id });

    return res.send({
      success: 1,
      message: "fetched",
      details: data,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Get vendor date , day and Slots
//Method:Get
//Endpoints:/labnear/date/id
const getVendorDate = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the vendor by ID
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.send({
        success: 0,
        message: "Vendor not found",
      });
    }
console.log(vendor)
    // Find all availability dates for this vendor
    const availability = await Availability.find({ vendorId: vendor._id });
    if (availability.length === 0) {
      return res.send({
        success: 1,
        message: "No availability data found for this vendor",
        data: availability,
      });
    }

    console.log(availability)

    // Define time periods
    const periods = {
      Morning: { start: "01:00", end: "12:00" },
      Afternoon: { start: "12:00", end: "18:00" },
      Evening: { start: "18:00", end: "24:00" },
    };

    // Function to convert dd/mm/yyyy to a Date object
    const convertToDate = (dateStr) => {
      const [day, month, year] = dateStr.trim().split("/");
      return new Date(`${year}-${month}-${day}`);
    };

    // Function to categorize slots into periods
    const categorizeSlots = (slots) => {
      const categorizedSlots = {
        Morning: [],
        Afternoon: [],
        Evening: [],
      };

      slots.forEach((slot) => {
        const slotTime = moment(slot, "HH:mm");
        Object.keys(periods).forEach((period) => {
          const { start, end } = periods[period];
          const periodStart = moment(start, "HH:mm");
          const periodEnd = moment(end, "HH:mm");
          if (slotTime.isBetween(periodStart, periodEnd, null, "[)")) {
            categorizedSlots[period].push(slot);
          }
        });
      });

      return categorizedSlots;
    };

    // Function to get all dates between two dates with slots
    const getDatesWithSlots = (
      startDate,
      endDate,
      startTime,
      endTime,
      slotTime
    ) => {
      let dates = {};
      let currentDate = new Date(startDate);

      while (currentDate <= new Date(endDate)) {
        // Calculate available slots for this day
        const availableSlots = [];
        let startSlot = moment(startTime.trim(), "HH:mm A"); // Handle possible spaces
        let endSlot = moment(endTime.trim(), "HH:mm A"); // Handle possible spaces

        while (startSlot.isBefore(endSlot)) {
          availableSlots.push(startSlot.format("HH:mm")); // Format output as 24-hour time
          startSlot.add(slotTime, "minutes");
        }

        // Categorize slots by periods
        const categorizedSlots = categorizeSlots(availableSlots);

        // Store the data for this date
        const dateKey = currentDate.toISOString().split("T")[0];
        if (!dates[dateKey]) {
          dates[dateKey] = {
            date: dateKey,
            day: moment(currentDate).format("dddd"),
            slots: {
              Morning: [],
              Afternoon: [],
              Evening: [],
            },
          };
        }

        Object.keys(categorizedSlots).forEach((period) => {
          dates[dateKey].slots[period] = [
            ...new Set([
              ...dates[dateKey].slots[period],
              ...categorizedSlots[period],
            ]),
          ];
        });

        currentDate.setDate(currentDate.getDate() + 1); // Increment by one day
      }

      // Convert the object to an array
      return Object.values(dates);
    };

    // Extract all dates with time slots for each availability entry
    const allDatesWithSlots = availability.flatMap((entry) =>
      getDatesWithSlots(
        convertToDate(entry.startDate),
        convertToDate(entry.endDate),
        entry.startTime,
        entry.endTime,
        parseInt(entry.slotTime)
      )
    );

    // Consolidate the results to ensure unique entries
    const consolidatedDates = allDatesWithSlots.reduce((acc, curr) => {
      if (!acc[curr.date]) {
        acc[curr.date] = curr;
      } else {
        // Merge slots
        Object.keys(curr.slots).forEach((period) => {
          acc[curr.date].slots[period] = [
            ...new Set([
              ...acc[curr.date].slots[period],
              ...curr.slots[period],
            ]),
          ];
        });
      }
      return acc;
    }, {});

    return res.send({
      success: 1,
      data: Object.values(consolidatedDates),
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Get particular vendor
//Method :Get
//Endpoints: /labnear/particular/:id
const getParticularVendor = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the vendor by ID
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.send({
        success: 0,
        message: "Vendor not registered",
      });
    }

    const availability = await Availability.find({ vendorId: vendor._id });

    const tests = await Addtest.find({ vendorId: vendor._id });

    return res.send({
      success: 1,
      data: {
        ...vendor._doc,
        availability,
        tests,
      },
    });
  } catch (error) {
    console.error(error);
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Get packages
//Method: Get
//Endpoints: /labnear/package/:id
const getpackages = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.send({
        success: 0,
        message: "Vendor not registered yet",
      });
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const data = await Package.find({ vendorId: vendor._id })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    return res.send({
      success: 1,
      details: data,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

const getallpacakge = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    const data = await Package.find().populate('vendorId')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    return res.send({
      success: 1,
      details: data,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Get particular test according to organ
//Method :Get
//Endpoints : /labnear/parttest?organ
const getparticulatlabtest = async (req, res) => {
  try {
    const { organ } = req.query; 
    const { page = 1, limit = 10 } = req.query;

    if (!organ) {
      return res.status(400).send({
        success: 0,
        message: "Organ is required in the query",
      });
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const data = await Addtest.find({ organ }).populate('vendorId'). populate('testName')
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

    return res.send({
      success: 1,
      data,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Get package collection according to category
//Method:Get
//Endpoint: /labnear/getcollectionPackage?packageName
const getPackagecollection = async (req, res) => {
  try {
    const { packageName } = req.query;
    const { page = 1, limit = 10 } = req.query;

    if (!packageName) {
      return res.send({
        success: 0,
        message: 'Package name is required'
      });
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const data = await Package.findOne({ packageName, method: "Package Collection" }).populate("vendorId")
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

    if (!data || data.length === 0) {
      return res.send({
        success: 1,
        data: [], // Return empty array when no data is found
        message: 'No packages found'
      });
    }

    return res.send({
      success: 1,

      data
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message
    });
  }
};



module.exports = {
  getVendor,
  getVendoravailability,
  getVendorTest,
  getAllStartAndEndDateUser,
  getAvailabiltyOfUserVendorAndTime,
  getVendorDate,
  getParticularVendor,
  getpackages,
  getallpacakge,
  getparticulatlabtest,
  getPackagecollection
};
