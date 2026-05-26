const Vendor = require("../../../../modal/vandor");
const Food = require("../../../../modal/addFood");
const FoodCategory = require("../../../../modal/foodCategory");
const Meal = require("../../../../modal/MealTime");

// ✅ GET ALL FOOD VENDORS
const getFoodVendors = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    
    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ✅ CHECK FOOD VENDOR VIEW PERMISSION
    if (!subAdmin.permissions?.vendors?.food?.view) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view food vendors",
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

    // ✅ BUILD SEARCH QUERY FOR FOOD VENDORS
    let searchQuery = { 
      ...locationQuery, 
      vendor: "Food" 
    };
    
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { business: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    // ✅ STATUS FILTER
    if (status === "active") {
      searchQuery.isActive = true;
    } else if (status === "inactive") {
      searchQuery.isActive = false;
    }

    // ✅ LOCATION FILTERS
    if (country) searchQuery.country = country;
    if (state) searchQuery.state = state;
    if (city) searchQuery.city = city;

    // ✅ SORTING
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    // ✅ PAGINATION
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // ✅ GET FOOD VENDORS WITH PAGINATION
    const foodVendors = await Vendor.find(searchQuery)
      .select('name business email phone vendor isActive country state city address createdAt location')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // ✅ GET FOOD ITEMS COUNT FOR EACH VENDOR
    const vendorsWithFoodCount = await Promise.all(
      foodVendors.map(async (vendor) => {
        const foodItemsCount = await Food.countDocuments({ vendorId: vendor._id });
        return {
          ...vendor,
          foodItemsCount
        };
      })
    );

    // ✅ GET TOTAL COUNTS FOR FOOD VENDORS
    const totalFoodVendors = await Vendor.countDocuments(searchQuery);
    const activeFoodVendors = await Vendor.countDocuments({ ...searchQuery, isActive: true });
    const inactiveFoodVendors = await Vendor.countDocuments({ ...searchQuery, isActive: false });

    return res.send({
      success: 1,
      message: "Food vendors fetched successfully",
      data: {
        vendors: vendorsWithFoodCount,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalFoodVendors / limitNum),
          totalFoodVendors,
          hasNext: pageNum < Math.ceil(totalFoodVendors / limitNum),
          hasPrev: pageNum > 1
        },
        stats: {
          total: totalFoodVendors,
          active: activeFoodVendors,
          inactive: inactiveFoodVendors
        },
        permissions: {
          view: subAdmin.permissions.vendors.food?.view || false,
          create: subAdmin.permissions.vendors.food?.create || false,
          edit: subAdmin.permissions.vendors.food?.edit || false,
          delete: subAdmin.permissions.vendors.food?.delete || false
        }
      }
    });

  } catch (error) {
    console.error('Get food vendors error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ GET SINGLE FOOD VENDOR DETAILS
const getFoodVendorById = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    const { id } = req.params;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ✅ CHECK FOOD VENDOR VIEW PERMISSION
    if (!subAdmin.permissions?.vendors?.food?.view) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view food vendors",
      });
    }

    const foodVendor = await Vendor.findById(id)
      .select('-password -token -phnOtp -emailOtp -confirmpass');

    if (!foodVendor) {
      return res.status(404).send({
        success: 0,
        message: "Food vendor not found",
      });
    }

    // ✅ CHECK IF IT'S ACTUALLY A FOOD VENDOR
    if (foodVendor.vendor !== "Food") {
      return res.status(404).send({
        success: 0,
        message: "This vendor is not a food vendor",
      });
    }

    // ✅ CHECK LOCATION ACCESS
    if (subAdmin.locationAccess) {
      const { locationAccess } = subAdmin;
      if (locationAccess.countries && locationAccess.countries.length > 0 && 
          !locationAccess.countries.includes(foodVendor.country)) {
        return res.status(403).send({
          success: 0,
          message: "No permission to access this food vendor",
        });
      }
    }

    // ✅ GET FOOD ITEMS FOR THIS VENDOR
    const foodItems = await Food.find({ vendorId: id })
      .select('foodName foodCategory amount status createdAt')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const foodItemsCount = await Food.countDocuments({ vendorId: id });

    const vendorData = foodVendor.toObject();
    vendorData.foodItems = foodItems;
    vendorData.foodItemsCount = foodItemsCount;

    return res.send({
      success: 1,
      message: "Food vendor details fetched successfully",
      data: vendorData
    });

  } catch (error) {
    console.error('Get food vendor by ID error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ GET FOOD VENDORS STATISTICS
const getFoodVendorsStats = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ✅ CHECK FOOD VENDOR VIEW PERMISSION
    if (!subAdmin.permissions?.vendors?.food?.view) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view food vendors",
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

    const foodQuery = { ...locationQuery, vendor: "Food" };

    // ✅ GET STATISTICS
    const totalFoodVendors = await Vendor.countDocuments(foodQuery);
    const activeFoodVendors = await Vendor.countDocuments({ ...foodQuery, isActive: true });
    const inactiveFoodVendors = await Vendor.countDocuments({ ...foodQuery, isActive: false });

    // ✅ RECENT FOOD VENDORS (LAST 7 DAYS)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentFoodVendors = await Vendor.countDocuments({ 
      ...foodQuery, 
      createdAt: { $gte: sevenDaysAgo } 
    });

    // ✅ TOTAL FOOD ITEMS COUNT
    const foodVendors = await Vendor.find(foodQuery).select('_id');
    const vendorIds = foodVendors.map(vendor => vendor._id);
    const totalFoodItems = await Food.countDocuments({ vendorId: { $in: vendorIds } });

    return res.send({
      success: 1,
      message: "Food vendors statistics fetched successfully",
      data: {
        stats: {
          totalVendors: totalFoodVendors,
          activeVendors: activeFoodVendors,
          inactiveVendors: inactiveFoodVendors,
          recentVendors: recentFoodVendors,
          totalFoodItems: totalFoodItems
        },
        permissions: {
          view: subAdmin.permissions.vendors.food?.view || false,
          create: subAdmin.permissions.vendors.food?.create || false,
          edit: subAdmin.permissions.vendors.food?.edit || false,
          delete: subAdmin.permissions.vendors.food?.delete || false
        }
      }
    });

  } catch (error) {
    console.error('Get food vendors stats error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ CREATE FOOD CATEGORY
const createCategory = async(req,res)=>{
  try {
      const subAdmin = req.subAdmin;
      
      if (!subAdmin) {
          return res.status(401).send({
              success: 0,
              message: "Sub-admin not authenticated",
          });
      }

      // ✅ CHECK FOOD VENDOR CREATE PERMISSION
      if (!subAdmin.permissions?.vendors?.food?.create) {
          return res.status(403).send({
              success: 0,
              message: "No permission to create food categories",
          });
      }

      const {name, category,calorie} = req.body

      const foodImage = req.file && `/admin/vendor/foodImage/${req.file.filename}`

      const data = await FoodCategory.create({
          name,
          category,
          foodImage,
          calorie
      })

      return res.send({
          success:1,
          message:'Category created successfully',
          data: {
              id: data._id,
              name: data.name,
              category: data.category,
              foodImage: data.foodImage,
              calorie: data.calorie
          }
      })
  } catch (error) {
      return res.send({
          success:0,
          message:error.message
      }) 
  }
}

// ✅ GET FOOD VENDORS LISTS
const getFoodVendorsLists = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    
    if (!subAdmin) {
        return res.status(401).send({
            success: 0,
            message: "Sub-admin not authenticated",
        });
    }

    // ✅ CHECK FOOD VENDOR VIEW PERMISSION
    if (!subAdmin.permissions?.vendors?.food?.view) {
        return res.status(403).send({
            success: 0,
            message: "No permission to view food vendors",
        });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

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

    // Filter conditions
    const matchQuery = { 
      vendor: "Food", 
      isActive: true,
      ...locationQuery 
    };

    const getAll = await Vendor.aggregate([
      {
        $match: matchQuery,
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

    // Correct total count based on filters
    const totalLength = await Vendor.countDocuments(matchQuery);
    const pages = Math.ceil(totalLength / limit);

    return res.send({
      success: 1,
      message: "All vendor fetched successfully",
      pages,
      totalLength,
      details: getAll,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ GET INACTIVE FOOD VENDORS
const inactivefood = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    
    if (!subAdmin) {
        return res.status(401).send({
            success: 0,
            message: "Sub-admin not authenticated",
        });
    }

    // ✅ CHECK FOOD VENDOR VIEW PERMISSION
    if (!subAdmin.permissions?.vendors?.food?.view) {
        return res.status(403).send({
            success: 0,
            message: "No permission to view food vendors",
        });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { country, state, city, search } = req.query;
    const skip = (page - 1) * limit;

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
    
    // ✅ OVERRIDE WITH QUERY PARAMETERS
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
          { business: { $regex: regex } }
        ]
      };
    }

    // Use aggregation pipeline to filter and paginate
    const getAll = await Vendor.aggregate([
      { 
        $match: { 
          vendor: "Food", 
          isActive: false,
          ...locationQuery,
          ...searchQuery
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    // Count total inactive food vendors for pagination
    const totalLength = await Vendor.countDocuments({
      vendor: "Food",
      isActive: false,
      ...locationQuery,
      ...searchQuery
    });

    const pages = Math.ceil(totalLength / limit);

    return res.send({
      success: 1,
      message: "Inactive food vendors fetched successfully",
      data: {
        vendors: getAll,
        pagination: {
          currentPage: page,
          totalPages: pages,
          totalVendors: totalLength,
          limit: limit
        }
      }
    });
  } catch (error) {
    console.error("Error in inactivefood:", error.message);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ GET FOOD VENDORS STATUS (12 MONTHS DATA)
const getfoodstatus = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    
    if (!subAdmin) {
        return res.status(401).send({
            success: 0,
            message: "Sub-admin not authenticated",
        });
    }

    // ✅ CHECK FOOD VENDOR VIEW PERMISSION
    if (!subAdmin.permissions?.vendors?.food?.view) {
        return res.status(403).send({
            success: 0,
            message: "No permission to view food vendors",
        });
    }

    const currentDate = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      };
    }).reverse();

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

    // Aggregate food vendor statistics
    const foodStats = await Vendor.aggregate([
      {
        $match: { 
          vendor: "Food",
          ...locationQuery 
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

    // Map food stats to the last 12 months, filling in missing months with 0 counts
    const stats = months.map(({ year, month }) => {
      const stat = foodStats.find(
        (item) => item._id.year === year && item._id.month === month
      );
      return {
        year,
        month,
        count: stat ? stat.count : 0,
        vendors: stat ? stat.vendors : [],
      };
    });

    return res.send({
      success: 1,
      data: stats,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ ADD MEAL
const addMeal = async(req, res) => {
  try {
    const subAdmin = req.subAdmin;
    
    if (!subAdmin) {
        return res.status(401).send({
            success: 0,
            message: "Sub-admin not authenticated",
        });
    }

    // ✅ CHECK FOOD VENDOR CREATE PERMISSION
    if (!subAdmin.permissions?.vendors?.food?.create) {
        return res.status(403).send({
            success: 0,
            message: "No permission to create meals",
        });
    }

    const {name} = req.body;
    if(!name) {
      return res.send({
        success:0,
        message:"Please enter the meal name"
      })
    }
    const data = await Meal.create({
      name,
      MealImage: req.file && `/admin/MealImage/${req.file.filename}`,
    })
    return res.send({
      success:1,
      message:"Meal created successfully",
      data: {
        id: data._id,
        name: data.name,
        MealImage: data.MealImage
      }
    })
  } catch (error) {
    return res.send({
      success:0,
      message:error.message
    })
  }
};

// ✅ GET MEALS
const getMeal = async(req,res) => {
  try {
    const subAdmin = req.subAdmin;
    
    if (!subAdmin) {
        return res.status(401).send({
            success: 0,
            message: "Sub-admin not authenticated",
        });
    }

    // ✅ CHECK FOOD VENDOR VIEW PERMISSION
    if (!subAdmin.permissions?.vendors?.food?.view) {
        return res.status(403).send({
            success: 0,
            message: "No permission to view meals",
        });
    }

    const data = await Meal.find({});
    if(!data) {
      return res.send({
        success:0,
        message:"no data found"
      })
    }
    return res.send({
      success:1,
      message:"data found",
      details:data
    })
  
  } catch (error) {
    return res.send({
      success:0,
      message:error.message
    })
  }
}

// ✅ GET CATEGORIES
const getCategory = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    
    if (!subAdmin) {
        return res.status(401).send({
            success: 0,
            message: "Sub-admin not authenticated",
        });
    }

    // ✅ CHECK FOOD VENDOR VIEW PERMISSION
    if (!subAdmin.permissions?.vendors?.food?.view) {
        return res.status(403).send({
            success: 0,
            message: "No permission to view categories",
        });
    }

    const { page = 1, limit = 10, search = "" } = req.query;
    const skip = (page - 1) * limit;

    // ✅ BUILD SEARCH QUERY
    let searchQuery = {};
    if (search) {
        const regex = new RegExp(search, "i");
        searchQuery = {
            $or: [
                { name: { $regex: regex } },
                { category: { $regex: regex } }
            ]
        };
    }

    // Fetch categories from the database with pagination
    const data = await FoodCategory.find(searchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const totalCategories = await FoodCategory.countDocuments(searchQuery);

    // If no data is found, return a clear message
    if (!data || data.length === 0) {
        return res.send({
            success: 0,
            message: "No categories found",
        });
    }

    // Create a map to filter unique categories by 'name'
    const uniqueCategories = [];
    const categoryMap = new Map();

    data.forEach((category) => {
        // If the category name has not been seen before, add it to the list
        if (!categoryMap.has(category.name)) {
            categoryMap.set(category.name, true);
            uniqueCategories.push({
                _id: category._id,
                name: category.name,
                foodImage: category.foodImage,
                category: category.category,
                calorie: category.calorie,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt,
            });
        }
    });

    return res.send({
        success: 1,
        message: "Categories fetched successfully",
        data: {
            categories: uniqueCategories,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCategories / limit),
                totalCategories,
                limit: parseInt(limit)
            }
        }
    });

  } catch (error) {
      return res.send({
          success: 0,
          message: error.message,
      });
  }
};

// ✅ UPDATE FOOD VENDOR STATUS
const updateFoodVendorStatus = async (req, res) => {
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

    // ✅ CHECK FOOD VENDOR EDIT PERMISSION
    if (!subAdmin.permissions?.vendors?.food?.edit) {
      return res.status(403).send({
        success: 0,
        message: "No permission to edit food vendors",
      });
    }

    // ✅ FIRST GET VENDOR TO CHECK PERMISSIONS
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.send({
        success: 0,
        message: "Food vendor not found",
      });
    }

    // ✅ CHECK IF VENDOR IS FOOD TYPE
    if (vendor.vendor !== "Food") {
      return res.send({
        success: 0,
        message: "Vendor is not a food vendor",
      });
    }

    // ✅ CHECK LOCATION ACCESS
    if (subAdmin.locationAccess) {
      const { locationAccess } = subAdmin;
      if (locationAccess.countries && locationAccess.countries.length > 0 && 
          !locationAccess.countries.includes(vendor.country)) {
        return res.status(403).send({
          success: 0,
          message: "No permission to access this food vendor",
        });
      }
    }

    // ✅ UPDATE VENDOR STATUS
    const updatedVendor = await Vendor.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select("-password -confirmpass -token -phnOtp -emailOtp");

    return res.send({
      success: 1,
      message: `Food vendor ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedVendor
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = {
  getFoodVendors,
  getFoodVendorById,
  getFoodVendorsStats,
  createCategory,
  getFoodVendorsLists,
  inactivefood,
  getfoodstatus,
  addMeal,
  getMeal,
  getCategory,
  updateFoodVendorStatus
};