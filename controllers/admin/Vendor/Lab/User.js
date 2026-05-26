const Vendor = require("../../../../modal/vandor");
const Admin = require("../../../../modal/adminlogin");
const Addtest = require("../../../../modal/addTest");
const Users = require("../../../../modal/user");
const SubAdmin = require("../../../../modal/subAdmin");

// Get all vendor lists - UPDATED WITH SUB-ADMIN SUPPORT
// Method:Get
// EndPoint:/admin-vendor-all
const getAllVendorsLists = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const locationFilters = req.locationFilters || {};

    const skip = (page - 1) * limit;

    console.log("🔬 Fetching lab vendors with filters:", locationFilters);

    const finalQuery = {
      vendor: "Lab",
      isActive: true,
      ...locationFilters
    };

    const getAll = await Vendor.aggregate([
      { $match: finalQuery },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const totalLength = await Vendor.countDocuments(finalQuery);
    const pages = Math.ceil(totalLength / limit);
    
    console.log(`✅ Found ${getAll.length} lab vendors`);

    return res.send({
      success: 1,
      message: "Lab vendors fetched successfully",
      pages,
      details: getAll,
      appliedFilters: locationFilters
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Search Vendor - UPDATED WITH LOCATION FILTERING
// Method:Get
// EndPoint:/admin-vendor-all/search
const searchVendor = async (req, res) => {
  try {
    const { q, page = 1, limit } = req.query;
    
    // ✅ BUILD LOCATION QUERY
    let locationQuery = {};
    if (req.subAdmin && req.subAdmin.locationAccess) {
      const { locationAccess } = req.subAdmin;
      if (locationAccess.countries && locationAccess.countries.length > 0) {
        locationQuery.country = { $in: locationAccess.countries };
      }
      if (locationAccess.states && locationAccess.states.length > 0) {
        locationQuery.state = { $in: locationAccess.states };
      }
      if (locationAccess.cities && locationAccess.cities.length > 0) {
        locationQuery.city = { $in: locationAccess.cities };
      }
    }

    let query = { vendor: "Lab", ...locationQuery };
    
    if (q) {
      const regex = new RegExp(q, "i");
      query.$or = [
        { name: { $regex: regex } },
        { email: { $regex: regex } },
        { country: { $regex: regex } },
        { state: { $regex: regex } },
        { city: { $regex: regex } },
        { business: { $regex: regex } },
        { labName: { $regex: regex } }
      ];
    }
    
    const options = {
      sort: { createdAt: -1 },
      skip: (page - 1) * limit,
      limit: parseInt(limit),
    };
    
    const search = await Vendor.find(query, null, options);

    if (!search || search.length === 0) {
      return res.send({
        success: 0,
        message: "No result found",
      });
    }
    
    return res.send({
      success: 1,
      message: "Results fetched successfully",
      details: search,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Get particular vendor - UPDATED WITH PERMISSION CHECK
// Method:Get
// EndPoint:/admin-vendor-all/get-vendor/:id
const getVendor = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ CHECK ADMIN OR SUB-ADMIN AUTHENTICATION
    const admin = req.user && req.user.constructor.modelName === 'Admin' ? req.user : null;
    const subAdmin = req.subAdmin || null;
    
    if (!admin && !subAdmin) {
      return res.send({
        success: 0,
        message: "User is not authenticated",
      });
    }

    // ✅ FOR SUB-ADMIN, CHECK LOCATION PERMISSION
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.send({
        success: 0,
        message: "Failed to fetch vendor",
      });
    }

    if (subAdmin) {
      const { locationAccess } = subAdmin;
      const hasLocationAccess = (
        (!locationAccess.countries || locationAccess.countries.length === 0 || locationAccess.countries.includes(vendor.country)) &&
        (!locationAccess.states || locationAccess.states.length === 0 || locationAccess.states.includes(vendor.state)) &&
        (!locationAccess.cities || locationAccess.cities.length === 0 || locationAccess.cities.includes(vendor.city))
      );
      
      if (!hasLocationAccess) {
        return res.send({
          success: 0,
          message: "Access denied to this vendor",
        });
      }
    }

    return res.send({
      success: 1,
      message: "Fetched successfully",
      details: vendor,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Search Vendor test - NO CHANGES NEEDED
// Method:Get
// EndPoint:/admin-vendor-all/search-test
const searchVendorTest = async (req, res) => {
  try {
    const { q } = req.query;
    let query = {};
    if (q) {
      const regex = new RegExp(q, "i");
      query = {
        $or: [
          { testCategory: { $regex: regex } },
          { testName: { $regex: regex } },
          { testType: { $regex: regex } },
          { sampleRequired: { $regex: regex } },
          { description: { $regex: regex } },
          { amount: { $regex: regex } },
        ],
      };
    }
    const search = await Addtest.find(query);

    if (!search) {
      return res.send({
        success: 0,
        message: "No result found",
      });
    }
    return res.send({
      success: 1,
      message: "Results fetched successfully",
      details: search,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Update vendor status - UPDATED WITH PERMISSION CHECK
// Method:Put
// endpoint: admin-vendor-all/active/:id
const status = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ CHECK EDIT PERMISSION FOR SUB-ADMIN
    if (req.subAdmin && !req.subAdmin.permissions?.vendors?.edit) {
      return res.send({
        success: 0,
        message: "No permission to edit vendors",
      });
    }

    let user = await Vendor.findById(id) || await Users.findById(id);
    if (!user) {
      return res.send({
        success: 0,
        message: "No user found",
      });
    }

    // ✅ FOR SUB-ADMIN, CHECK LOCATION PERMISSION FOR VENDORS
    if (req.subAdmin && user.constructor.modelName === 'vandor') {
      const { locationAccess } = req.subAdmin;
      const hasLocationAccess = (
        (!locationAccess.countries || locationAccess.countries.length === 0 || locationAccess.countries.includes(user.country)) &&
        (!locationAccess.states || locationAccess.states.length === 0 || locationAccess.states.includes(user.state)) &&
        (!locationAccess.cities || locationAccess.cities.length === 0 || locationAccess.cities.includes(user.city))
      );
      
      if (!hasLocationAccess) {
        return res.send({
          success: 0,
          message: "Access denied to this vendor",
        });
      }
    }

    user.isActive = !user.isActive;
    await user.save();

    return res.send({
      success: 1,
      message: `${user.isActive ? "Enabled" : "Disabled"} successfully`,
      details: { id: user._id, isActive: user.isActive },
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Search Vendor-lab for 12 months - UPDATED WITH LOCATION FILTER
// Method: get
// endpoint: admin-vendor-all/getlabstats
const getlabstats = async (req, res) => {
  try {
    const currentDate = new Date();
    
    // ✅ BUILD LOCATION QUERY FOR SUB-ADMIN
    let locationQuery = {};
    if (req.subAdmin && req.subAdmin.locationAccess) {
      const { locationAccess } = req.subAdmin;
      if (locationAccess.countries && locationAccess.countries.length > 0) {
        locationQuery.country = { $in: locationAccess.countries };
      }
      if (locationAccess.states && locationAccess.states.length > 0) {
        locationQuery.state = { $in: locationAccess.states };
      }
      if (locationAccess.cities && locationAccess.cities.length > 0) {
        locationQuery.city = { $in: locationAccess.cities };
      }
    }

    // ✅ OVERRIDE WITH GLOBAL FILTERS FROM QUERY PARAMETERS
    const { country, state, city } = req.query;
    if (country && country.trim() !== '') {
      locationQuery.country = country.trim();
    }
    if (state && state.trim() !== '') {
      locationQuery.state = state.trim();
    }
    if (city && city.trim() !== '') {
      locationQuery.city = city.trim();
    }

    console.log("🔬 Fetching lab stats with filters:", locationQuery);

    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      };
    }).reverse();

    // Aggregate lab statistics with location filter
    const labstats = await Vendor.aggregate([
      {
        $match: { 
          vendor: "Lab",
          ...locationQuery // ✅ Apply location filters
        },
      },
      {
        $addFields: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: { year: "$year", month: "$month" },
          count: { $sum: 1 },
          vendors: { $push: "$$ROOT" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    const stats = months.map(({ year, month }) => {
      const stat = labstats.find(
        (item) => item._id.year === year && item._id.month === month
      );
      return {
        year,
        month,
        count: stat ? stat.count : 0,
        vendors: stat ? stat.vendors : [],
      };
    });

    // ✅ Calculate total labs with filters
    const totalLabs = await Vendor.countDocuments({ 
      vendor: "Lab", 
      ...locationQuery 
    });

    console.log(`✅ Lab stats fetched: ${totalLabs} total labs with filters`);

    return res.send({
      success: 1,
      message: locationQuery.country ? 
        `Monthly lab registration stats for ${locationQuery.country}${locationQuery.state ? `, ${locationQuery.state}` : ''}${locationQuery.city ? `, ${locationQuery.city}` : ''}` :
        "Monthly lab registration stats",
      data: stats,
      totalLabs: totalLabs,
      appliedFilters: locationQuery
    });
  } catch (error) {
    console.error("❌ Error in getlabstats:", error);
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Get all inactive vendors labs - UPDATED WITH LOCATION FILTER
// methods : get
// endpoint : admin-vendor-all/inActivlabs
const inActivlabs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { country, state, city } = req.query;
    const skip = (page - 1) * limit;

    // ✅ BUILD LOCATION QUERY
    let locationQuery = {};
    if (req.subAdmin && req.subAdmin.locationAccess) {
      const { locationAccess } = req.subAdmin;
      if (locationAccess.countries && locationAccess.countries.length > 0) {
        locationQuery.country = { $in: locationAccess.countries };
      }
      if (locationAccess.states && locationAccess.states.length > 0) {
        locationQuery.state = { $in: locationAccess.states };
      }
      if (locationAccess.cities && locationAccess.cities.length > 0) {
        locationQuery.city = { $in: locationAccess.cities };
      }
    }
    
    // ✅ OVERRIDE WITH QUERY PARAMETERS
    if (country) locationQuery.country = country;
    if (state) locationQuery.state = state;
    if (city) locationQuery.city = city;

    const getAll = await Vendor.aggregate([
      { 
        $match: { 
          vendor: "Lab", 
          isActive: false,
          ...locationQuery
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const totalLength = await Vendor.countDocuments({
      vendor: "Lab",
      isActive: false,
      ...locationQuery
    });

    const pages = Math.ceil(totalLength / limit);

    return res.send({
      success: 1,
      message: "All inactive labs fetched successfully",
      pages,
      details: getAll,
    });
  } catch (error) {
    console.error("Error in inActivlabs:", error.message);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = {
  getAllVendorsLists,
  searchVendor,
  getVendor,
  searchVendorTest,
  status,
  getlabstats,
  inActivlabs
};