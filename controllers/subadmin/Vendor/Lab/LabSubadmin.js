const Vendor = require("../../../../modal/vandor");
const Addtest = require("../../../../modal/addTest");
const Users = require("../../../../modal/user");

// ✅ GET ALL LAB VENDORS (Consolidated)
const getLabVendors = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    
    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ✅ CHECK LAB VENDOR VIEW PERMISSION
    if (!subAdmin.permissions?.vendors?.lab?.view) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view lab vendors",
      });
    }

    const { 
      page = 1, 
      limit = 10, 
      search = "",
      status = "",
      country = "",
      state = "",
      city = "",
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    // ✅ BUILD LOCATION QUERY FOR SUB-ADMIN
    let locationQuery = {};
    if (subAdmin.locationAccess) {
      const { locationAccess } = subAdmin;
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

    // ✅ BUILD SEARCH QUERY FOR LAB VENDORS
    let searchQuery = { 
      ...locationQuery, 
      vendor: "Lab" 
    };
    
    if (search) {
      const regex = new RegExp(search, "i");
      searchQuery.$or = [
        { name: { $regex: regex } },
        { business: { $regex: regex } },
        { email: { $regex: regex } },
        { phone: { $regex: regex } },
        { labName: { $regex: regex } },
        { country: { $regex: regex } },
        { state: { $regex: regex } },
        { city: { $regex: regex } }
      ];
    }

    // ✅ STATUS FILTER
    if (status === "active") {
      searchQuery.isActive = true;
    } else if (status === "inactive") {
      searchQuery.isActive = false;
    }
    // If no status filter, show all (both active and inactive)

    // ✅ SORTING
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    // ✅ PAGINATION
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // ✅ GET LAB VENDORS WITH PAGINATION
    const labVendors = await Vendor.find(searchQuery)
      .select('name business email phone vendor isActive country state city address labName createdAt location')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // ✅ GET TOTAL COUNTS FOR LAB VENDORS
    const totalLabs = await Vendor.countDocuments(searchQuery);
    const activeLabs = await Vendor.countDocuments({ ...searchQuery, isActive: true });
    const inactiveLabs = await Vendor.countDocuments({ ...searchQuery, isActive: false });

    return res.send({
      success: 1,
      message: "Lab vendors fetched successfully",
      data: {
        vendors: labVendors,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalLabs / limitNum),
          totalLabs,
          hasNext: pageNum < Math.ceil(totalLabs / limitNum),
          hasPrev: pageNum > 1
        },
        stats: {
          total: totalLabs,
          active: activeLabs,
          inactive: inactiveLabs
        },
        permissions: {
          view: subAdmin.permissions.vendors.lab?.view || false,
          create: subAdmin.permissions.vendors.lab?.create || false,
          edit: subAdmin.permissions.vendors.lab?.edit || false,
          delete: subAdmin.permissions.vendors.lab?.delete || false
        }
      }
    });

  } catch (error) {
    console.error('Get lab vendors error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ GET SINGLE LAB VENDOR DETAILS
const getLabVendorById = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    const { id } = req.params;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ✅ CHECK LAB VENDOR VIEW PERMISSION
    if (!subAdmin.permissions?.vendors?.lab?.view) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view lab vendors",
      });
    }

    const labVendor = await Vendor.findById(id)
      .select('-password -token -phnOtp -emailOtp -confirmpass');

    if (!labVendor) {
      return res.status(404).send({
        success: 0,
        message: "Lab vendor not found",
      });
    }

    // ✅ CHECK IF IT'S ACTUALLY A LAB VENDOR
    if (labVendor.vendor !== "Lab") {
      return res.status(404).send({
        success: 0,
        message: "This vendor is not a lab",
      });
    }

    // ✅ CHECK LOCATION ACCESS
    if (subAdmin.locationAccess) {
      const { locationAccess } = subAdmin;
      if (locationAccess.countries && locationAccess.countries.length > 0 && 
          !locationAccess.countries.includes(labVendor.country)) {
        return res.status(403).send({
          success: 0,
          message: "No permission to access this lab vendor",
        });
      }
      if (locationAccess.states && locationAccess.states.length > 0 && 
          !locationAccess.states.includes(labVendor.state)) {
        return res.status(403).send({
          success: 0,
          message: "No permission to access this lab vendor",
        });
      }
      if (locationAccess.cities && locationAccess.cities.length > 0 && 
          !locationAccess.cities.includes(labVendor.city)) {
        return res.status(403).send({
          success: 0,
          message: "No permission to access this lab vendor",
        });
      }
    }

    return res.send({
      success: 1,
      message: "Lab vendor details fetched successfully",
      data: labVendor
    });

  } catch (error) {
    console.error('Get lab vendor by ID error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ GET LAB VENDORS STATISTICS
const getLabVendorsStats = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ✅ CHECK LAB VENDOR VIEW PERMISSION
    if (!subAdmin.permissions?.vendors?.lab?.view) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view lab vendors",
      });
    }

    // ✅ BUILD LOCATION QUERY FOR SUB-ADMIN
    let locationQuery = {};
    if (subAdmin.locationAccess) {
      const { locationAccess } = subAdmin;
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

    const labQuery = { ...locationQuery, vendor: "Lab" };

    // ✅ GET STATISTICS
    const totalLabs = await Vendor.countDocuments(labQuery);
    const activeLabs = await Vendor.countDocuments({ ...labQuery, isActive: true });
    const inactiveLabs = await Vendor.countDocuments({ ...labQuery, isActive: false });

    // ✅ RECENT LABS (LAST 7 DAYS)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentLabs = await Vendor.countDocuments({ 
      ...labQuery, 
      createdAt: { $gte: sevenDaysAgo } 
    });

    // ✅ LOCATION WISE STATS
    const countries = await Vendor.distinct('country', labQuery);
    const states = await Vendor.distinct('state', labQuery);
    const cities = await Vendor.distinct('city', labQuery);

    // ✅ 12 MONTHS STATISTICS
    const currentDate = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      };
    }).reverse();

    const labstats = await Vendor.aggregate([
      {
        $match: labQuery,
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
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    const monthlyStats = months.map(({ year, month }) => {
      const stat = labstats.find(
        (item) => item._id.year === year && item._id.month === month
      );
      return {
        year,
        month,
        count: stat ? stat.count : 0,
      };
    });

    return res.send({
      success: 1,
      message: "Lab vendors statistics fetched successfully",
      data: {
        stats: {
          total: totalLabs,
          active: activeLabs,
          inactive: inactiveLabs,
          recent: recentLabs
        },
        locations: {
          countries: countries.length,
          states: states.length,
          cities: cities.length
        },
        monthlyStats: monthlyStats,
        permissions: {
          view: subAdmin.permissions.vendors.lab?.view || false,
          create: subAdmin.permissions.vendors.lab?.create || false,
          edit: subAdmin.permissions.vendors.lab?.edit || false,
          delete: subAdmin.permissions.vendors.lab?.delete || false
        }
      }
    });

  } catch (error) {
    console.error('Get lab vendors stats error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ SEARCH VENDOR TESTS
const searchVendorTest = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    const { q } = req.query;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ✅ CHECK LAB VENDOR VIEW PERMISSION
    if (!subAdmin.permissions?.vendors?.lab?.view) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view lab vendors",
      });
    }

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

    if (!search || search.length === 0) {
      return res.send({
        success: 0,
        message: "No result found",
      });
    }

    return res.send({
      success: 1,
      message: "Results fetched successfully",
      data: search,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ UPDATE VENDOR STATUS
const updateVendorStatus = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    const { id } = req.params;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ✅ CHECK LAB VENDOR EDIT PERMISSION
    if (!subAdmin.permissions?.vendors?.lab?.edit) {
      return res.status(403).send({
        success: 0,
        message: "No permission to edit lab vendors",
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
    if (user.constructor.modelName === 'vandor') {
      const { locationAccess } = subAdmin;
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
      data: { id: user._id, isActive: user.isActive },
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ GET INACTIVE LABS
const getInactiveLabs = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    
    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ✅ CHECK LAB VENDOR VIEW PERMISSION
    if (!subAdmin.permissions?.vendors?.lab?.view) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view lab vendors",
      });
    }

    const { 
      page = 1, 
      limit = 10, 
      country = "", 
      state = "", 
      city = "" 
    } = req.query;

    // ✅ BUILD LOCATION QUERY FOR SUB-ADMIN
    let locationQuery = {};
    if (subAdmin.locationAccess) {
      const { locationAccess } = subAdmin;
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

    const finalQuery = {
      vendor: "Lab",
      isActive: false,
      ...locationQuery
    };

    // ✅ PAGINATION
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const inactiveLabs = await Vendor.find(finalQuery)
      .select('name business email phone vendor isActive country state city address labName createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const totalInactiveLabs = await Vendor.countDocuments(finalQuery);

    return res.send({
      success: 1,
      message: "Inactive labs fetched successfully",
      data: {
        vendors: inactiveLabs,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalInactiveLabs / limitNum),
          totalInactiveLabs,
          hasNext: pageNum < Math.ceil(totalInactiveLabs / limitNum),
          hasPrev: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error("Error in getInactiveLabs:", error.message);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = {
  getLabVendors,           // Consolidated getAllVendorsLists
  getLabVendorById,        // Consolidated getVendor
  getLabVendorsStats,      // Consolidated getlabstats + enhanced stats
  searchVendorTest,        // From original
  updateVendorStatus,      // Consolidated status
  getInactiveLabs          // Consolidated inActivlabs
};