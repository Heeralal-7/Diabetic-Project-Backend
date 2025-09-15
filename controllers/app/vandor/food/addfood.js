const Food = require("../../../../modal/addFood");
const FoodCategories = require("../../../../modal/foodCategory");
const Meal = require("../../../../modal/MealTime");

//Create new food
//Method:Post
//Endpoint:/food/addfood
const createFood = async (req, res) => {
  try {
    let {
      foodName,
      ingredients,
      foodSubCategory,
      foodCategory,
      sugarFree,
      addons,
      amount,
      discountPercentage,
      MealId,
      calorie

    } = req.body;

    // Validate required fields
    if (
      !foodName ||
      !ingredients ||
      !foodCategory ||
      !sugarFree ||
      !amount ||
      !discountPercentage
    ) {
      return res.send({
        success: 0,
        message: "All required fields must be provided",
      });
    }

    // Parse addons if it's a string (from form-data)
    if (typeof addons === "string") {
      try {
        addons = JSON.parse(addons);
      } catch (err) {
        return res.send({
          success: 0,
          message: "Invalid JSON format for addons",
        });
      }
    }

    // Handle uploaded images
    const photoPaths = req.files.map((file) => `/vendor/food/${file.filename}`);

    // Build the new food item
    const newFoodData = {
      foodName,
      ingredients,
      foodCategory,
      foodSubCategory,
      sugarFree,
      addons,
      amount,
      calorie,
      image: photoPaths,
      discountPercentage,
      vendorId: req.user._id,
    };

    // ✅ Add MealId only if it's a valid ObjectId string
    if (MealId && MealId !== "null" && MealId !== "undefined" && MealId.trim() !== "") {
      newFoodData.MealId = MealId;
    }

    // Save to database
    const data = await Food.create(newFoodData);

    return res.send({
      success: 1,
      message: "Created successfully",
      data,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};



//Get all food
//Method:Get
//Endpoint:/food/getfood
//status: 0 for ongoing or onhold and 1 for closed
const getFood = async (req, res) => {
  try {
    const { page = 1, limit = 10, foodCategory } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const query = { vendorId: req.user._id, status: 0 };

    if (foodCategory && foodCategory.trim()) {
      if (foodCategory.toLowerCase() !== "all") {
        query.foodCategory = foodCategory.trim();
      }
    }

    const data = await Food.find(query)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    if (!data || data.length === 0) {
      return res.send({
        success: 1,
        message: "No food available right now",
        details: [],
      });
    }

    return res.send({
      success: 1,
      message: "Fetched successfully",
      details: data,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Change food status
//Method:Patch
//Endpoint:/food/status/id
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    await Food.findByIdAndUpdate(
      id,
      {
        status: 1,
      },
      { new: true }
    );

    return res.send({
      success: 1,
      message: "Removed successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Edit food
//Method:Patch
//Endpoint:/food/edit/id
const editFood = async (req, res) => {
  try {
    const { id } = req.params;
    const { foodName, ingredients, foodCategory, sugarFree, addons, amount,discountPercentage } =
      req.body;

    let photoPaths;

    if (req.files && req.files.length > 0) {
      photoPaths = req.files.map((file) => `/vendor/food/${file.filename}`);
    }

    const foodItem = await Food.findById(id);

    if (!foodItem) {
      return res.status(404).json({
        success: 0,
        message: "Food item not found",
      });
    }

    // Prepare the update data object
    const updateData = {
      foodName,
      ingredients,
      foodCategory,
      sugarFree,
      amount,
      discountPercentage
    };

    if (addons) {
      updateData.addons = addons.map((addon) => ({
        name: addon.name || "",
        price: addon.price || 0,
      }));
    }

    if (photoPaths && photoPaths.length > 0) {
      updateData.image = photoPaths;
    } else {
      updateData.image = foodItem.image;
    }

    const updatedFoodItem = await Food.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedFoodItem) {
      return res.status(500).json({
        success: 0,
        message: "Failed to update food item",
      });
    }

    return res.status(200).json({
      success: 1,
      message: "Edit successfully",
      details: updatedFoodItem,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: 0,
      message: error.message || "An error occurred",
    });
  }
};

//Search food
//Method:Get
//Endpoint:/food/search
const searchFood = async (req, res) => {
  try {
    const { q, vendorId } = req.query;
    let query = {};
    if (q) {
      const regex = new RegExp(q, "i");
      query = {
        $and: [
          { vendorId },
          {
            $or: [
              { foodName: { $regex: regex } },
              { sugarFree: { $regex: regex } },
              { ingredients: { $regex: regex } },
              { addons: { $regex: regex } },
              { amount: { $regex: regex } },
            ],
          },
        ],
      };
    }
    const options = {
      sort: { createdAt: -1 },
    };
    const search = await Food.find(query, null, options);

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

//Get status 1 data
//Method:Get
//Endpoint:food/deleteStatus
const getremoveddata = async (req, res) => {
  try {
    const userId = req.user._id; // if using middleware for authentication

    const data = await Food.find({
      status: 1,
      vendorId: userId,
    });
    return res.send({
      success: 1,
      message: "Feched successfully",
      details: data,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: erro.message,
    });
  }
};

//get food categories
//Method:Get
//Endpoint: /food/getCategory
const getfoodcategory = async (req, res) => {
  try {
    // Fetch all categories from the database
    const data = await FoodCategories.find({});

    // Create a map to filter unique categories by 'name'
    const uniqueCategories = [];
    const categoryMap = new Map();

    data.forEach((category) => {
      if (!categoryMap.has(category.name)) {
        categoryMap.set(category.name, true); // Mark the name as seen
        uniqueCategories.push({
          _id: category._id,
          name: category.name,
          foodImage: category.foodImage,
          category: category.category,
          calorie:category.calorie,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        });
      }
    });

    return res.send({
      success: 1,
      message: "Fetched successfully",
      data: uniqueCategories, // Return only unique categories
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Get subCategory of food
//Method:Get
//Endpoint: food/getSubCategory?name
const getfoodSubcategory = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.send({
        success: 0,
        message: "Name is required",
      });
    }

    const data = await FoodCategories.find({ name });

    return res.send({
      success: 1,
      message: "Fetched successfully",
      details: data,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Get all meals
// Method: Get
// Endpoint: /food/getmeals
const getMeals = async(req,res) => {
  try {
    
    const data = await Meal.find({});
    if(!data || data.length === 0) { //Se ha añadido la comprobación de la longitud para mayor robustez
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

module.exports = {
  createFood,
  getFood,
  updateStatus,
  editFood,
  searchFood,
  getremoveddata,
  getfoodcategory,
  getfoodSubcategory,
  getMeals,
};
