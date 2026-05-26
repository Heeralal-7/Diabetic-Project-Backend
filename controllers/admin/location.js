const Location = require("../../modal/location");
const Vendor = require("../../modal/vandor");
const Docter = require("../../modal/docter");
const Users = require("../../modal/user");
const clinicModel = require("../../modal/clinic");

// Add Location
const addLocation = async (req, res) => {
  try {
    const { country, state, city } = req.body;

    if (!country || !state || !city) {
      return res.send({
        success: 0,
        message: "Country, state and city are required",
      });
    }

    // Check if location already exists
    const existingLocation = await Location.findOne({ country, state, city });
    if (existingLocation) {
      return res.send({
        success: 0,
        message: "Location already exists",
      });
    }

    const newLocation = await Location.create({
      country,
      state,
      city
    });

    return res.send({
      success: 1,
      message: "Location added successfully",
      data: newLocation
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Get All Locations
const getAllLocations = async (req, res) => {
  try {
    const { country, state, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (country) query.country = new RegExp(country, 'i');
    if (state) query.state = new RegExp(state, 'i');

    const locations = await Location.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ country: 1, state: 1, city: 1 });

    const total = await Location.countDocuments(query);

    return res.send({
      success: 1,
      message: "Locations fetched successfully",
      data: {
        locations,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Get Countries
const getCountries = async (req, res) => {
  try {
    const countries = await Location.distinct("country");
    
    return res.send({
      success: 1,
      message: "Countries fetched successfully",
      data: countries
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Get States by Country
const getStatesByCountry = async (req, res) => {
  try {
    const { country } = req.params;
    
    const states = await Location.distinct("state", { country });
    
    return res.send({
      success: 1,
      message: "States fetched successfully",
      data: states
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Get Cities by State
const getCitiesByState = async (req, res) => {
  try {
    const { country, state } = req.params;
    
    const cities = await Location.distinct("city", { country, state });
    
    return res.send({
      success: 1,
      message: "Cities fetched successfully",
      data: cities
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};









// ✅ NEW: Get All Location Data for Dashboard Filters /////// working filter on admin  ///////// 
// Location API ko update karein - multiple models se data fetch karein
const getLocationData = async (req, res) => {
  try {
    // Multiple collections se distinct locations fetch karein
    const vendorCountries = await Vendor.distinct("country", { country: { $ne: "", $exists: true } });
    const doctorCountries = await Docter.distinct("country", { country: { $ne: "", $exists: true } });
    const userCountries = await Users.distinct("country", { country: { $ne: "", $exists: true } });
    const clinicCountries = await clinicModel.distinct("country", { country: { $ne: "", $exists: true } });

    const vendorStates = await Vendor.distinct("state", { state: { $ne: "", $exists: true } });
    const doctorStates = await Docter.distinct("state", { state: { $ne: "", $exists: true } });
    const userStates = await Users.distinct("state", { state: { $ne: "", $exists: true } });
    const clinicStates = await clinicModel.distinct("state", { state: { $ne: "", $exists: true } });

    const vendorCities = await Vendor.distinct("city", { city: { $ne: "", $exists: true } });
    const doctorCities = await Docter.distinct("city", { city: { $ne: "", $exists: true } });
    const userCities = await Users.distinct("city", { city: { $ne: "", $exists: true } });
    const clinicCities = await clinicModel.distinct("city", { city: { $ne: "", $exists: true } });

    // Combine all unique values
    const allCountries = [...new Set([...vendorCountries, ...doctorCountries, ...userCountries, ...clinicCountries])];
    const allStates = [...new Set([...vendorStates, ...doctorStates, ...userStates, ...clinicStates])];
    const allCities = [...new Set([...vendorCities, ...doctorCities, ...userCities, ...clinicCities])];

    // Sort arrays alphabetically
    const sortedCountries = allCountries.sort();
    const sortedStates = allStates.sort();
    const sortedCities = allCities.sort();

    return res.status(200).json({
      success: true,
      message: "Location data fetched successfully",
      data: {
        countries: sortedCountries,
        states: sortedStates,
        cities: sortedCities
      }
    });

  } catch (error) {
    console.error("Error fetching location data:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching location data",
      error: error.message
    });
  }
};

// ✅ NEW: Get States for a specific country (for cascading dropdown)
const getStatesForCountry = async (req, res) => {
  try {
    const { country } = req.query;
    
    if (!country) {
      return res.status(400).json({
        success: false,
        message: "Country parameter is required"
      });
    }

    const states = await Location.distinct("state", { 
      country: country,
      state: { $ne: "", $exists: true }
    });

    return res.status(200).json({
      success: true,
      message: "States fetched successfully",
      data: states.sort()
    });

  } catch (error) {
    console.error("Error fetching states:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching states",
      error: error.message
    });
  }
};

// ✅ NEW: Get Cities for a specific state (for cascading dropdown)
const getCitiesForState = async (req, res) => {
  try {
    const { country, state } = req.query;
    
    if (!country || !state) {
      return res.status(400).json({
        success: false,
        message: "Country and state parameters are required"
      });
    }

    const cities = await Location.distinct("city", { 
      country: country,
      state: state,
      city: { $ne: "", $exists: true }
    });

    return res.status(200).json({
      success: true,
      message: "Cities fetched successfully",
      data: cities.sort()
    });

  } catch (error) {
    console.error("Error fetching cities:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching cities",
      error: error.message
    });
  }
};

module.exports = {
  addLocation,
  getAllLocations,
  getCountries,
  getStatesByCountry,
  getCitiesByState,

  getLocationData, // ✅ New function added
  getStatesForCountry, // ✅ New function added
  getCitiesForState // ✅ New function added
};