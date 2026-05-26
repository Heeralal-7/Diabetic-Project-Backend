const Users = require("../../../modal/user");
const SubAdmin = require("../../../modal/subAdmin");

//Admin get all users - UPDATED WITH SUB-ADMIN SUPPORT
const getallUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", country, state, city } = req.query;

    console.log("👥 Backend: Fetching users with filters:", { country, state, city, page, limit });

    // Build location query
    const locationQuery = {};
    if (country && country.trim() !== '') locationQuery.country = country.trim();
    if (state && state.trim() !== '') locationQuery.state = state.trim();
    if (city && city.trim() !== '') locationQuery.city = city.trim();

    // Build search query
    let searchQuery = {};
    if (search) {
      const regex = new RegExp(search, "i");
      searchQuery = {
        $or: [
          { name: { $regex: regex } },
          { email: { $regex: regex } },
          { number: { $regex: regex } }
        ]
      };
    }

    const skip = (page - 1) * limit;

    console.log("🔍 Final MongoDB query:", { ...locationQuery, ...searchQuery });

    const getAll = await Users.find({ ...locationQuery, ...searchQuery })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-password -token");

    const totalUsers = await Users.countDocuments({ ...locationQuery, ...searchQuery });
    const totalPages = Math.ceil(totalUsers / limit);

    console.log(`✅ Backend: Found ${getAll.length} users out of ${totalUsers} total`);

    return res.send({
      success: 1,
      message: getAll.length > 0 ? "Users fetched successfully" : "No users found for the selected filters",
      data: {
        users: getAll,
        pagination: {
          currentPage: parseInt(page),
          totalPages: totalPages,
          totalUsers,
          limit: parseInt(limit)
        }
      },
      appliedFilters: locationQuery
    });
  } catch (error) {
    console.error("❌ Backend Error in getallUsers:", error);
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//fetch active user - UPDATED WITH SUB-ADMIN SUPPORT
const activeUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { country, state, city, search } = req.query;
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
    
    if (country) locationQuery.country = country;
    if (state) locationQuery.state = state;
    if (city) locationQuery.city = city;

    // ✅ BUILD SEARCH QUERY
    let searchQuery = {};
    if (search) {
      const regex = new RegExp(search, "i");
      searchQuery = {
        $or: [
          { name: { $regex: regex } },
          { email: { $regex: regex } },
          { number: { $regex: regex } }
        ]
      };
    }

    const getAll = await Users.aggregate([
      {
        $match: {
          isActive: true,
          ...locationQuery,
          ...searchQuery
        }
      }, 
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);

    const totalLength = await Users.countDocuments({
      isActive: true,
      ...locationQuery,
      ...searchQuery
    });
    
    const pages = Math.ceil(totalLength / limit);
    
    return res.send({
      success: 1,
      message: "Active users fetched successfully",
      pages,
      details: getAll,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//fetch inactive user - UPDATED WITH SUB-ADMIN SUPPORT
const inActiveUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { country, state, city, search } = req.query;
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
    
    if (country) locationQuery.country = country;
    if (state) locationQuery.state = state;
    if (city) locationQuery.city = city;

    // ✅ BUILD SEARCH QUERY
    let searchQuery = {};
    if (search) {
      const regex = new RegExp(search, "i");
      searchQuery = {
        $or: [
          { name: { $regex: regex } },
          { email: { $regex: regex } },
          { number: { $regex: regex } }
        ]
      };
    }

    const getAll = await Users.aggregate([
      {
        $match: {
          isActive: false,
          ...locationQuery,
          ...searchQuery
        }
      }, 
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);

    const totalLength = await Users.countDocuments({
      isActive: false,
      ...locationQuery,
      ...searchQuery
    });
    
    const pages = Math.ceil(totalLength / limit);
    
    return res.send({
      success: 1,
      message: "Inactive users fetched successfully",
      pages,
      details: getAll,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// first 5 user login - UPDATED WITH LOCATION FILTER
const firstuser = async (req, res) => {
  try {
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

    const users = await Users.find(locationQuery, { name: 1, email: 1, number: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const updatedUsers = users.map(user => ({
      name: user.name,
      email: user.email,
      number: user.number,
      registeredDate: user.createdAt || null,
    }));

    return res.send({
      success: 1,
      message: "Last 5 users who registered",
      details: updatedUsers,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Last 12 months user registration stats - UPDATED WITH LOCATION FILTER
const allusersdata = async (req, res) => {
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

    console.log("👥 Fetching user stats with filters:", locationQuery);

    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      };
    }).reverse();

    // Aggregate user data with location filter
    const userStats = await Users.aggregate([
      {
        $match: locationQuery // ✅ Apply location filters
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

    const stats = months.map(({ year, month }) => {
      const stat = userStats.find(
        (d) => d._id.year === year && d._id.month === month
      );
      return {
        year,
        month,
        count: stat ? stat.count : 0,
      };
    });

    // ✅ Calculate total users with filters
    const totalUsers = await Users.countDocuments(locationQuery);

    console.log(`✅ User stats fetched: ${totalUsers} total users with filters`);

    return res.send({
      success: 1,
      message: locationQuery.country ? 
        `Monthly user registration stats for ${locationQuery.country}${locationQuery.state ? `, ${locationQuery.state}` : ''}${locationQuery.city ? `, ${locationQuery.city}` : ''}` :
        "Monthly user registration stats",
      details: stats,
      totalUsers: totalUsers,
      appliedFilters: locationQuery
    });
  } catch (error) {
    console.error("❌ Error in allusersdata:", error);
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = { 
  getallUsers, 
  activeUser, 
  inActiveUser, 
  firstuser, 
  allusersdata 
};