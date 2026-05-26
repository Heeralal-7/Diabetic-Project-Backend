// middleware/locationFilter.js
const locationFilterMiddleware = (req, res, next) => {
  try {
    const { country, state, city } = req.query;
    
    // Build location filter object
    req.locationFilters = {};
    
    if (country && country.trim() !== '') {
      req.locationFilters.country = country.trim();
    }
    
    if (state && state.trim() !== '') {
      req.locationFilters.state = state.trim();
    }
    
    if (city && city.trim() !== '') {
      req.locationFilters.city = city.trim();
    }
    
    console.log("📍 Location Filters Applied:", req.locationFilters);
    next();
  } catch (error) {
    console.error("❌ Location Filter Middleware Error:", error);
    next();
  }
};

module.exports = locationFilterMiddleware;