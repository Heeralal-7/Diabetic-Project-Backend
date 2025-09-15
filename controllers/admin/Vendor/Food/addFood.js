const FoodCategory = require("../../../../modal/foodCategory")
const Vendor = require("../../../../modal/vandor");
const Meal =  require("../../../../modal/MealTime")


///admin-food/addCategory
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
            message:'Created successfully'
        })
    } catch (error) {
        return res.send({
            success:0,
            message:error.message
        }) 
    }
}

//end point: /admin-food/FoodVendors
// method: get
// show the food vendor 
const getFoodVendorsLists = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
  
      const skip = (page - 1) * limit;
  
      // Filter conditions
      const matchQuery = { vendor: "Food", isActive: true };
  
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
// endpoint : /admin-food/inactivefood
// methods : get ;
// get all inactive food vendor 
  const inactivefood = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1; // Default to page 1
      const limit = parseInt(req.query.limit) || 10; // Default limit to 10
      const skip = (page - 1) * limit; // Calculate the number of documents to skip
  
      // Use aggregation pipeline to filter and paginate
      const getAll = await Vendor.aggregate([
        { $match: { vendor: "Food", isActive: false } }, // Filter for inactive labs
        { $sort: { createdAt: -1 } }, // Sort by newest first
        { $skip: skip }, // Skip documents for pagination
        { $limit: limit }, // Limit the number of documents per page
      ]);
  
      // Count total inactive labs for pagination
      const totalLength = await Vendor.countDocuments({
        vendor: "Food",
        isActive: false,
      });
  
      const pages = Math.ceil(totalLength / limit); // Calculate total pages
  
      return res.send({
        success: 1,
        message: "All inactive labs fetched successfully",
        pages,
        details: getAll, // Return the fetched labs
      });
    } catch (error) {
      console.error("Error in inActivlabs:", error.message);
      return res.status(500).send({
        success: 0,
        message: error.message, // Return error message for debugging
      });
    }
  };
  


  // end point : /admin-food/getfoodstatus
  // get 12 months data of food vendor 
const getfoodstatus = async (req, res) => {
  try {
    const currentDate = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      };
    }).reverse();

    // Aggregate lab statistics
    const labstats = await Vendor.aggregate([
      {
        $match: { vendor: "Food" }, // Use "vendor" to match the field in your database
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
    

    // Map lab stats to the last 12 months, filling in missing months with 0 counts
    const stats = months.map(({ year, month }) => {
      const stat = labstats.find(
        (item) => item._id.year === year && item._id.month === month
      );
      return {
        year,
        month,
        count: stat ? stat.count : 0, // Default to 0 if no data exists for the month
        vendors: stat ? stat.vendors : [], // Default to empty array if no vendors
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
 // end point : /admin-food/addmeal
const addMeal = async(req, res) => {
  try {
    const {name} = req.body;
    if(!name) {
      return res.send({
        success:0,
        message:"please enter the name"
      })
    }
    const data = await Meal.create({
      name,
      MealImage: req.file && `/admin/MealImage/${req.file.filename}`,
    })
    return res.send({
      success:1,
      message:"created",
      deatils:data
    })
  } catch (error) {
    return res.send({
      success:0,
      message:error.message
    })
  }
};

 // end point : /admin-food/getmeal
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





module.exports = {createCategory,getFoodVendorsLists,inactivefood,getfoodstatus, addMeal , getMeal}