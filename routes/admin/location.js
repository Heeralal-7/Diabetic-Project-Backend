const express = require("express");
const router = express.Router();
const {
  addLocation,
  getAllLocations,
  getCountries,
  getStatesByCountry,
  getCitiesByState,

  getLocationData, // ✅ New function imported
  getStatesForCountry, // ✅ New function imported
  getCitiesForState // ✅ New function imported
} = require("../../controllers/admin/location");

const { adminMiddleware } = require("../../middleware/auth");

router.post("/add", adminMiddleware, addLocation);
router.get("/all", adminMiddleware, getAllLocations);
router.get("/countries", adminMiddleware, getCountries);
router.get("/states/:country", adminMiddleware, getStatesByCountry);
router.get("/cities/:country/:state", adminMiddleware, getCitiesByState);

// ✅ NEW ROUTES FOR DASHBOARD FILTERS
router.get('/dashboard/locations', getLocationData); // For all location data
router.get('/dashboard/states', getStatesForCountry); // For cascading states
router.get('/dashboard/cities', getCitiesForState); // For cascading cities

module.exports = router;