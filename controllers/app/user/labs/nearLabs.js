const Vendor = require("../../../../modal/vandor");
const Addtest = require("../../../../modal/addTest");
const Availability = require("../../../../modal/availability");
const moment = require("moment");
const Package = require("../../../../modal/AddPackages");
const Organs = require("../../../../modal/organs");
const maxLimit = require("../../../../modal/distanceLimit");
const Rating = require("../../../../modal/rating");
// Google Maps import हटा दिया गया
// const { calculateOnRoadDistance } = require("../../../utils/googleMapsDistance");

// Straight-line distance calculation function (Haversine Formula)
const calculateStraightLineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in KM
};

// Function to calculate rating statistics
const calculateRatingStats = (ratings) => {
  if (!ratings || ratings.length === 0) {
    return {
      averageRating: 0,
      totalRatings: 0,
      starBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  let totalSum = 0;
  let starCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  ratings.forEach(rating => {
    const ratingValue = parseFloat(rating.rating) || 0;
    totalSum += ratingValue;
    
    const roundedRating = Math.round(ratingValue);
    if (starCount[roundedRating] !== undefined) {
      starCount[roundedRating] += 1;
    }
  });

  return {
    averageRating: parseFloat((totalSum / ratings.length).toFixed(1)),
    totalRatings: ratings.length,
    starBreakdown: starCount
  };
};

// POST Endpoint: /labnear/near
const getVendor = async (req, res) => {
  try {
    // Get parameters from both POST body and GET query
    const page = parseInt(req.body.page) || parseInt(req.query.page) || 1;
    const limit = parseInt(req.body.limit) || parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get location from request
    const latitude = req.body.latitude || req.query.latitude;
    const longitude = req.body.longitude || req.query.longitude;
    const search = req.body.search || req.query.search;
    
    // Check if valid location is provided
    const userLat = parseFloat(latitude);
    const userLng = parseFloat(longitude);
    const hasUserLocation = !isNaN(userLat) && !isNaN(userLng);

    // Get distance limit from database
    const distanceLimit = await maxLimit.findOne().sort({ createdAt: -1 });
    const maxDistance = distanceLimit ? distanceLimit.labLimit : 20; // Default 20km (labLimit)
    const maxDistanceInMeters = maxDistance * 1000; // Convert km to meters

    // Build match conditions
    const matchConditions = {
      vendor: "Lab"
    };
    
    // Add search condition if provided
    if (search) {
      matchConditions.$or = [
        { vendorName: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    let vendors = [];
    
    // If location is provided, use geoNear for initial filtering
    if (hasUserLocation) {
      try {
        // Check if Vendor model has location field
        const vendorWithLocation = await Vendor.findOne({
          vendor: "Lab",
          location: { $exists: true, $ne: null },
          "location.coordinates": { $exists: true }
        }).limit(1);

        if (vendorWithLocation) {
          // Use geoNear aggregation
          const aggregationPipeline = [
            {
              $geoNear: {
                near: { type: "Point", coordinates: [userLng, userLat] },
                distanceField: "geoDistance",
                spherical: true,
                maxDistance: maxDistanceInMeters,
                query: matchConditions,
                key: "location"
              }
            },
            { $skip: skip },
            { $limit: limit }
          ];

          vendors = await Vendor.aggregate(aggregationPipeline);
          
          // Convert geoNear distance from meters to km
          vendors = vendors.map(vendor => ({
            ...vendor,
            geoDistance: vendor.geoDistance ? vendor.geoDistance / 1000 : null
          }));
        }
      } catch (geoNearError) {
        console.log("geoNear failed, using manual calculation:", geoNearError.message);
        // Fall through to manual query
      }
    }

    // If no geoNear results or no location provided, use regular query
    if (vendors.length === 0) {
      let query = Vendor.find(matchConditions);
      query = query.skip(skip).limit(limit);
      const vendorDocs = await query;
      vendors = vendorDocs.map(doc => doc.toObject());
    }

    if (!vendors || vendors.length === 0) {
      return res.send({
        success: 0,
        message: "No lab vendors available",
      });
    }

    // Get ratings for all vendors in bulk
    const vendorIds = vendors.map(v => v._id);
    const allRatings = await Rating.find({ vendorId: { $in: vendorIds } });

    // Group ratings by vendorId
    const ratingsByVendor = {};
    allRatings.forEach(rating => {
      const vendorId = rating.vendorId.toString();
      if (!ratingsByVendor[vendorId]) {
        ratingsByVendor[vendorId] = [];
      }
      ratingsByVendor[vendorId].push(rating);
    });

    // Calculate distances and prepare vendor data
    const vendorDetails = await Promise.all(vendors.map(async (vendor) => {
      // Get ratings for this vendor
      const vendorRatings = ratingsByVendor[vendor._id.toString()] || [];
      const ratingStats = calculateRatingStats(vendorRatings);

      // Prepare base vendor data
      const vendorData = {
        _id: vendor._id,
        vendorName: vendor.name,
        image: vendor.image,
        posterimage: vendor.posterimage,
        email: vendor.email,
        phoneNumber: vendor.phoneNumber,
        alternatePhoneNumber: vendor.alternatePhoneNumber,
        address: vendor.address,
        ctrCode: vendor.ctrCode,
        country: vendor.country,
        state: vendor.state,
        city: vendor.city,
        location: vendor.location,
        vendor: vendor.vendor,
        rating: ratingStats.averageRating,
        totalRatings: ratingStats.totalRatings,
        starBreakdown: ratingStats.starBreakdown,
        // Include only essential additional fields
        licenceNumber: vendor.licenceNumber,
        councilNumber: vendor.councilNumber,
        clinicName: vendor.clinicName,
        About: vendor.About,
        startDay: vendor.startDay,
        endDay: vendor.endDay,
        MorningStartTime: vendor.MorningStartTime,
        eveningStartTime: vendor.eveningStartTime,
        MorningEndTime: vendor.MorningEndTime,
        eveningEndTime: vendor.eveningEndTime,
        holiday: vendor.holiday,
        bankDetails: vendor.bankDetails
      };

      // Calculate distance if location is provided
      if (hasUserLocation) {
        let distance = null;
        
        // Check if vendor has location coordinates
        if (vendor.location && 
            vendor.location.coordinates && 
            vendor.location.coordinates.length === 2) {
          
          const vendorLng = vendor.location.coordinates[0];
          const vendorLat = vendor.location.coordinates[1];
          
          // Validate coordinates
          if (!isNaN(vendorLat) && !isNaN(vendorLng)) {
            // DIRECT CALCULATION: Straight Line
            distance = calculateStraightLineDistance(
              userLat, 
              userLng, 
              vendorLat, 
              vendorLng
            );
            distance = parseFloat(distance.toFixed(2));
          }
        }
        
        // If geoNear was used, we already have distance
        if (!distance && vendor.geoDistance) {
          distance = parseFloat(vendor.geoDistance.toFixed(2));
        }
        
        // Add distance to vendor data
        if (distance !== null) {
          vendorData.distance = distance;
        }
      }

      return vendorData;
    }));

    // If location provided, filter by distance limit and sort
    if (hasUserLocation) {
      // Filter vendors within distance limit
      const filteredVendors = vendorDetails.filter(vendor => 
        vendor.distance && vendor.distance <= maxDistance
      );

      // Sort by distance (nearest first)
      filteredVendors.sort((a, b) => {
        if (!a.distance) return 1;
        if (!b.distance) return -1;
        return a.distance - b.distance;
      });

      // Get counts for stats
      const vendorsWithValidDistance = filteredVendors.length;
      const vendorsWithoutLocation = vendorDetails.length - vendorsWithValidDistance;

      return res.send({
        success: 1,
        message: "Lab vendors fetched successfully",
        details: filteredVendors,
        distanceLimit: maxDistance,
        userLocation: {
          latitude: userLat,
          longitude: userLng
        },
        stats: {
          totalVendors: vendorDetails.length,
          vendorsWithinLimit: vendorsWithValidDistance,
          vendorsWithoutLocation: vendorsWithoutLocation,
          calculationMethod: 'STRAIGHT_LINE'
        },
        pagination: {
          page: page,
          limit: limit,
          hasMore: vendors.length === limit
        }
      });
    }

    // If no location provided, return all vendors
    return res.send({
      success: 1,
      message: "All lab vendors fetched successfully",
      details: vendorDetails,
      note: "Provide latitude and longitude to filter by distance",
      pagination: {
        page: page,
        limit: limit,
        hasMore: vendors.length === limit
      }
    });
  } catch (error) {
    console.error("Error in getVendor API:", error);
    return res.status(500).send({
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

    const formattedData = data.map((item) => {
      
      // 🔥 Convert DD/MM/YYYY -> YYYY-MM-DD
      const formatDate = (dateStr) => {
        const [day, month, year] = dateStr.split("/");
        return `${year}-${month}-${day}`;
      };

      // Combine date + time
      const startDateTime = new Date(
        `${formatDate(item.startDate)}T${item.startTime}`
      );

      const endDateTime = new Date(
        `${formatDate(item.endDate)}T${item.endTime}`
      );

      return {
        ...item._doc,

        //  Date
        formattedStartDate: startDateTime.toLocaleDateString("en-GB"),
        formattedEndDate: endDateTime.toLocaleDateString("en-GB"),

        //  12-hour format
        startTime12hr: startDateTime.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        endTime12hr: endDateTime.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),

        //  24-hour format
        startTime24hr: startDateTime.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        endTime24hr: endDateTime.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      };
    });

    return res.send({
      success: 1,
      message: "Fetched",
      details: formattedData,
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
// labnear/test/:id
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

// Endpoint: /labnear/package
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

//Get all organs
//Method:Get
//Endpoints:/labnear/getAllOrgans
const getAllOrgans = async (req, res) => {
  try {
    const data = await Organs.find({}); // Fetch all documents from the Organs collection

    if (!data || data.length === 0) {
      return res.send({
        success: 1,
        message: "No organs found.",
        data: [],
      });
    }

    return res.send({
      success: 1,
      message: "Successfully fetched all organs.",
      data,
    });
  } catch (error) {
    console.error(error);
    return res.send({
      success: 0,
      message: error.message,
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
  getPackagecollection,
  getAllOrgans
};