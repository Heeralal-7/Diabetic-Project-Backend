const Users = require("../../../modal/user");
const SubAdmin = require("../../../modal/subAdmin");

// ✅ GET ALL USERS (With pagination, search, and filters) - SUB-ADMIN SUPPORT
const getallUsers = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    
    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // Check permission
    if (!subAdmin.permissions?.users?.view) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view users",
      });
    }

    const { 
      page = 1, 
      limit = 10, 
      search = "", 
      country, 
      state, 
      city,
      status = "",
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

    // ✅ BUILD SEARCH QUERY
    let searchQuery = { ...locationQuery };
    
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { number: { $regex: search, $options: "i" } }
      ];
    }

    // ✅ STATUS FILTER
    if (status === "active") {
      searchQuery.isActive = true;
    } else if (status === "inactive") {
      searchQuery.isActive = false;
    }

    // ✅ SORTING
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    // ✅ PAGINATION
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // ✅ GET USERS WITH PAGINATION
    const users = await Users.find(searchQuery)
      .select('name email number isActive country state city createdAt lastLogin')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // ✅ GET TOTAL COUNT
    const totalUsers = await Users.countDocuments(searchQuery);
    const activeUsers = await Users.countDocuments({ ...searchQuery, isActive: true });
    const inactiveUsers = await Users.countDocuments({ ...searchQuery, isActive: false });

    return res.send({
      success: 1,
      message: "All users fetched successfully",
      data: {
        users,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalUsers / limitNum),
          totalUsers,
          hasNext: pageNum < Math.ceil(totalUsers / limitNum),
          hasPrev: pageNum > 1
        },
        stats: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers
        }
      }
    });
  } catch (error) {
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ FETCH ACTIVE USERS - SUB-ADMIN SUPPORT
const activeUser = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    
    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    if (!subAdmin.permissions?.users?.view) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view users",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { country, state, city, search } = req.query;
    const skip = (page - 1) * limit;

    // ✅ BUILD LOCATION QUERY
    let locationQuery = { isActive: true };
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
      {
        $project: {
          password: 0,
          token: 0,
          otp: 0,
          otpExpires: 0
        }
      }
    ]);

    const totalLength = await Users.countDocuments({
      ...locationQuery,
      ...searchQuery
    });
    
    const pages = Math.ceil(totalLength / limit);
    
    return res.send({
      success: 1,
      message: "Active users fetched successfully",
      data: {
        users: getAll,
        pagination: {
          currentPage: page,
          totalPages: pages,
          totalUsers: totalLength,
          limit: limit
        }
      }
    });
  } catch (error) {
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ FETCH INACTIVE USERS - SUB-ADMIN SUPPORT
const inActiveUser = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    
    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    if (!subAdmin.permissions?.users?.view) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view users",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { country, state, city, search } = req.query;
    const skip = (page - 1) * limit;

    // ✅ BUILD LOCATION QUERY
    let locationQuery = { isActive: false };
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
      {
        $project: {
          password: 0,
          token: 0,
          otp: 0,
          otpExpires: 0
        }
      }
    ]);

    const totalLength = await Users.countDocuments({
      ...locationQuery,
      ...searchQuery
    });
    
    const pages = Math.ceil(totalLength / limit);
    
    return res.send({
      success: 1,
      message: "Inactive users fetched successfully",
      data: {
        users: getAll,
        pagination: {
          currentPage: page,
          totalPages: pages,
          totalUsers: totalLength,
          limit: limit
        }
      }
    });
  } catch (error) {
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ FIRST 5 USER LOGIN - SUB-ADMIN SUPPORT
const firstuser = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    
    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    if (!subAdmin.permissions?.users?.view) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view users",
      });
    }

    // ✅ BUILD LOCATION QUERY
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

    const users = await Users.find(locationQuery, { 
      name: 1, 
      email: 1, 
      number: 1, 
      createdAt: 1,
      country: 1,
      state: 1,
      city: 1 
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const updatedUsers = users.map(user => ({
      name: user.name,
      email: user.email,
      number: user.number,
      country: user.country,
      state: user.state,
      city: user.city,
      registeredDate: user.createdAt || null,
    }));

    return res.send({
      success: 1,
      message: "Last 5 users who registered",
      data: updatedUsers,
    });
  } catch (error) {
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ LAST 12 MONTHS USER REGISTRATION STATS - SUB-ADMIN SUPPORT
const allusersdata = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    
    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    if (!subAdmin.permissions?.users?.view) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view users",
      });
    }

    const currentDate = new Date();

    // ✅ BUILD LOCATION QUERY
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

    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        monthName: date.toLocaleString('default', { month: 'short' })
      };
    }).reverse();

    // Aggregate user data with location filter
    const userStats = await Users.aggregate([
      {
        $match: locationQuery
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

    const stats = months.map(({ year, month, monthName }) => {
      const stat = userStats.find(
        (d) => d._id.year === year && d._id.month === month
      );
      return {
        year,
        month: monthName,
        count: stat ? stat.count : 0,
      };
    });

    return res.send({
      success: 1,
      message: "Last 12 months user registration stats",
      data: stats,
    });
  } catch (error) {
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ GET SINGLE USER DETAILS - SUB-ADMIN SUPPORT
const getUserById = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    const { id } = req.params;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    if (!subAdmin.permissions?.users?.view) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view users",
      });
    }

    const user = await Users.findById(id)
      .select('-password -token -otp -otpExpires');

    if (!user) {
      return res.status(404).send({
        success: 0,
        message: "User not found",
      });
    }

    // ✅ CHECK LOCATION ACCESS
    if (subAdmin.locationAccess) {
      const { locationAccess } = subAdmin;
      if (locationAccess.countries && locationAccess.countries.length > 0 && 
          !locationAccess.countries.includes(user.country)) {
        return res.status(403).send({
          success: 0,
          message: "No permission to access this user",
        });
      }
      if (locationAccess.states && locationAccess.states.length > 0 && 
          !locationAccess.states.includes(user.state)) {
        return res.status(403).send({
          success: 0,
          message: "No permission to access this user",
        });
      }
      if (locationAccess.cities && locationAccess.cities.length > 0 && 
          !locationAccess.cities.includes(user.city)) {
        return res.status(403).send({
          success: 0,
          message: "No permission to access this user",
        });
      }
    }

    return res.send({
      success: 1,
      message: "User details fetched successfully",
      data: user
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ UPDATE USER STATUS - SUB-ADMIN SUPPORT
const updateUserStatus = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    const { id } = req.params;
    const { isActive } = req.body;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    if (!subAdmin.permissions?.users?.edit) {
      return res.status(403).send({
        success: 0,
        message: "No permission to edit users",
      });
    }

    const user = await Users.findById(id);
    if (!user) {
      return res.status(404).send({
        success: 0,
        message: "User not found",
      });
    }

    // ✅ CHECK LOCATION ACCESS
    if (subAdmin.locationAccess) {
      const { locationAccess } = subAdmin;
      if (locationAccess.countries && locationAccess.countries.length > 0 && 
          !locationAccess.countries.includes(user.country)) {
        return res.status(403).send({
          success: 0,
          message: "No permission to update this user",
        });
      }
    }

    user.isActive = isActive;
    await user.save();

    return res.send({
      success: 1,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Update user status error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ DELETE USER - SUB-ADMIN SUPPORT
const deleteUser = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    const { id } = req.params;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    if (!subAdmin.permissions?.users?.delete) {
      return res.status(403).send({
        success: 0,
        message: "No permission to delete users",
      });
    }

    const user = await Users.findById(id);
    if (!user) {
      return res.status(404).send({
        success: 0,
        message: "User not found",
      });
    }

    // ✅ CHECK LOCATION ACCESS
    if (subAdmin.locationAccess) {
      const { locationAccess } = subAdmin;
      if (locationAccess.countries && locationAccess.countries.length > 0 && 
          !locationAccess.countries.includes(user.country)) {
        return res.status(403).send({
          success: 0,
          message: "No permission to delete this user",
        });
      }
    }

    await Users.findByIdAndDelete(id);

    return res.send({
      success: 1,
      message: "User deleted successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).send({
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
  allusersdata,
  getUserById,
  updateUserStatus,
  deleteUser
};