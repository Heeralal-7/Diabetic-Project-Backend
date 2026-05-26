const FoodCategory = require("../../../../modal/foodCategory")
const Vendor = require("../../../../modal/vandor");
const Meal = require("../../../../modal/MealTime")

///admin-food/addCategory - UPDATED WITH PERMISSION CHECK
const createCategory = async(req,res)=>{
    try {
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

//end point: /admin-food/FoodVendors - UPDATED WITH LOCATION FILTER
// method: get
// show the food vendor 
const getFoodVendorsLists = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const locationFilters = req.locationFilters || {};

    const skip = (page - 1) * limit;

    console.log("🍕 Fetching food vendors with filters:", locationFilters);

    const matchQuery = { 
      vendor: "Food", 
      isActive: true,
      ...locationFilters 
    };

    const getAll = await Vendor.aggregate([
      { $match: matchQuery },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const totalLength = await Vendor.countDocuments(matchQuery);
    const pages = Math.ceil(totalLength / limit);

    console.log(`✅ Found ${getAll.length} food vendors`);

    return res.send({
      success: 1,
      message: "Food vendors fetched successfully",
      pages,
      totalLength,
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

// endpoint : /admin-food/inactivefood - UPDATED WITH LOCATION FILTER
// methods : get ;
// get all inactive food vendor 
const inactivefood = async (req, res) => {
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

// end point : /admin-food/getfoodstatus - UPDATED WITH LOCATION FILTER
// get 12 months data of food vendor 
const getfoodstatus = async (req, res) => {
  try {
    const currentDate = new Date();
    
    // ✅ BUILD LOCATION FILTERS FROM REQUEST
    const locationFilters = req.locationFilters || {};
    
    console.log("🍕 Fetching food stats with filters:", locationFilters);

    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      };
    }).reverse();

    // ✅ Build match query with vendor type and location filters
    const matchQuery = { 
      vendor: "Food",
      ...locationFilters // ✅ Apply location filters
    };

    console.log("🔍 Final MongoDB query for food stats:", matchQuery);

    // Aggregate food statistics with location filters
    const foodstats = await Vendor.aggregate([
      {
        $match: matchQuery, // ✅ Use the combined query
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
          vendors: { $push: "$$ROOT" }, // Include all vendor details
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);
    
    // ✅ Calculate total food vendors with filters
    const totalFoodVendors = await Vendor.countDocuments(matchQuery);

    // Map food stats to the last 12 months, filling in missing months with 0 counts
    const stats = months.map(({ year, month }) => {
      const stat = foodstats.find(
        (item) => item._id.year === year && item._id.month === month
      );
      return {
        year,
        month,
        count: stat ? stat.count : 0, // Default to 0 if no data exists for the month
        vendors: stat ? stat.vendors : [], // Default to empty array if no vendors
      };
    });

    console.log(`✅ Food stats fetched: ${totalFoodVendors} total food vendors with filters`);

    return res.send({
      success: 1,
      message: locationFilters.country ? 
        `Monthly food vendor registration stats for ${locationFilters.country}${locationFilters.state ? `, ${locationFilters.state}` : ''}${locationFilters.city ? `, ${locationFilters.city}` : ''}` :
        "Monthly food vendor registration stats",
      data: stats,
      totalFoodVendors: totalFoodVendors,
      appliedFilters: locationFilters
    });
  } catch (error) {
    console.error("❌ Error in getfoodstatus:", error);
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// end point : /admin-food/addmeal - UPDATED WITH PERMISSION CHECK
const addMeal = async(req, res) => {
  try {
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

// end point : /admin-food/getmeal - UPDATED WITH PERMISSION CHECK
const getMeal = async(req,res) => {
  try {
    
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

// end point: /admin-food/getcategory - UPDATED WITH PERMISSION CHECK
// method: get
// get all unique food categories
const getCategory = async (req, res) => {
    try {
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

// ✅ GET FOOD VENDOR BY ID - NEW FUNCTION
const getFoodVendorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vendor = await Vendor.findById(id)
      .select("-password -confirmpass -token -phnOtp -emailOtp");

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

    // ✅ FOR SUB-ADMIN, CHECK LOCATION PERMISSION
    if (req.subAdmin) {
      const { locationAccess } = req.subAdmin;
      const hasLocationAccess = (
        (!locationAccess.countries || locationAccess.countries.length === 0 || locationAccess.countries.includes(vendor.country)) &&
        (!locationAccess.states || locationAccess.states.length === 0 || locationAccess.states.includes(vendor.state)) &&
        (!locationAccess.cities || locationAccess.cities.length === 0 || locationAccess.cities.includes(vendor.city))
      );
      
      if (!hasLocationAccess) {
        return res.status(403).send({
          success: 0,
          message: "Access denied to this food vendor"
        });
      }
    }

    return res.send({
      success: 1,
      message: "Food vendor details fetched successfully",
      data: vendor
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ UPDATE FOOD VENDOR STATUS - NEW FUNCTION
const updateFoodVendorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

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

    // ✅ FOR SUB-ADMIN, CHECK LOCATION PERMISSION
    if (req.subAdmin) {
      const { locationAccess } = req.subAdmin;
      const hasLocationAccess = (
        (!locationAccess.countries || locationAccess.countries.length === 0 || locationAccess.countries.includes(vendor.country)) &&
        (!locationAccess.states || locationAccess.states.length === 0 || locationAccess.states.includes(vendor.state)) &&
        (!locationAccess.cities || locationAccess.cities.length === 0 || locationAccess.cities.includes(vendor.city))
      );
      
      if (!hasLocationAccess) {
        return res.status(403).send({
          success: 0,
          message: "Access denied to this food vendor"
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
  createCategory,
  getFoodVendorsLists,
  inactivefood,
  getfoodstatus,
  addMeal,
  getMeal,
  getCategory,
  getFoodVendorById,
  updateFoodVendorStatus
};