const Food = require("../../../../modal/addFood");
const Cart = require("../../../../modal/addfoodcart");
const mongoose = require("mongoose");
const meal = require("../../../../modal/MealTime")
//Get particular craving food
//Method:Get
//Endpoint:/craving/foodName?food
const getParticularFood = async (req, res) => {
  try {
    const { food } = req.query;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const data = await Food.find({
      foodName: food,
      status: "0",
      $expr: {
        $lt: [
          {
            $toInt: {
              $trim: {
                input: "$discountPercentage",
                chars: "%"  // removes trailing '%', if any
              }
            }
          },
          25
        ]
      }
    })
    .populate('vendorId', 'name') 
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    if (!data || data.length === 0) {
      return res.send({
        success: 0,
        message: "No items found",
      });
    }
     const itemsWithVendorName = data.map(item => {
      const itemObject = item.toObject(); // Mongoose डॉक्यूमेंट को प्लेन JavaScript ऑब्जेक्ट में बदलें
      if (itemObject.vendorId && typeof itemObject.vendorId === 'object') {
        itemObject.vendorName = itemObject.vendorId.name; // वेंडर का नाम जोड़ें
        itemObject.vendorId = itemObject.vendorId._id; // vendorId को सिर्फ उसकी ID पर वापस सेट करें
      }
      return itemObject;
    });


    return res.send({
      success: 1,
      message: "Fetched successfully",
      details: itemsWithVendorName,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};


//Get veg or non-veg
//Method:Get
//Endpoint:craving/sort?food
const filter = async (req, res) => {
  try {
    const { food } = req.query;

    const data = await Food.find({ foodCategory: food });

    if (!data) {
      return res.send({
        success: 0,
        message: "No data found",
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

//add to cart the item
// Method: post
// Endpoint: /craving/cartfood/:id
//type : 0 for normal user and 1 for subscription
const addToCart = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, vendorId, request } = req.body;


    if (!req.user || !req.user._id) {
      return res.send({
        success: 0,
        message: "User authentication failed. Please login again."
      });
    }

    const qty = parseInt(quantity);
    if (isNaN(qty)) {
      return res.send({ success: 0, message: "Invalid quantity value." });
    }

    const foodItem = await Food.findById(id);
    if (!foodItem) {
      return res.send({ success: 0, message: "Food item not found." });
    }

    let cartItem = await Cart.findOne({ FoodItem: id, userId: req.user._id });
    const currentQty = cartItem ? cartItem.quantity : 0;

    if (qty === 0) {
      return res.send({
        success: 1,
        message: "Quantity 0 passed, cart unchanged.",
        data: cartItem,
      });
    }

    if (qty < 0) {
      if (!cartItem) {
        return res.send({ success: 0, message: "No existing cart item to reduce." });
      }

      const newQty = currentQty + qty;
      if (newQty <= 0) {
        cartItem.quantity = 0;
        cartItem.cartStatus = 0;
        await cartItem.save();

        foodItem.quantity = 0;
        foodItem.cartStatus = 0;
        await foodItem.save();

        return res.send({ success: 1, message: "Item removed from cart.", data: cartItem });
      }

      cartItem.quantity = newQty;
      const basePrice = Number(foodItem.amount);
      cartItem.finalprice = basePrice * newQty;
      await cartItem.save();

      foodItem.quantity = newQty;
      foodItem.cartStatus = 1;
      await foodItem.save();

      return res.send({ success: 1, message: "Cart quantity reduced.", data: cartItem });
    }

    const updatedQty = currentQty + qty;
    const basePrice = Number(foodItem.amount);

    const updatedCart = await Cart.findOneAndUpdate(
      { FoodItem: id, userId: req.user._id },
      {
        $set: {
          vendorId,
          request,
          cartStatus: 1,
          type: 0,
        },
        $setOnInsert: {
          extraItems: [],
        },
        $inc: {
          quantity: qty,
        },
      },
      { new: true, upsert: true }
    );

    updatedCart.finalprice = basePrice * updatedQty;
    await updatedCart.save();

    foodItem.cartStatus = 1;
    foodItem.quantity = updatedQty;
    await foodItem.save();

    return res.send({
      success: 1,
      message: "Cart quantity updated.",
      data: updatedCart,
    });

  } catch (error) {
    return res.send({ success: 0, message: error.message });
  }
};

// craving/addExtraItems
const addExtraItems = async (req, res) => {
  try {
    const { foodItemId } = req.params;
    const { extraItems, request } = req.body;
    const userId = req.user._id;

    console.log("🛒 Add Extra Items by FoodItem ID API hit");
    console.log("foodItemId:", foodItemId, "userId (from token):", userId);

    if (!extraItems || !Array.isArray(extraItems)) {
      return res.status(400).json({ success: 0, message: "extraItems must be an array." });
    }

    const cart = await Cart.findOne({ FoodItem: foodItemId, userId });

    if (!cart) {
      return res.status(404).json({ success: 0, message: "Cart item not found for this foodItem and user." });
    }

    const updatedExtraItems = extraItems.map(item => ({
      ...item,
      extrastatus: 1,
    }));

    cart.extraItems = updatedExtraItems;

    if (request) {
      cart.request = request;
    }

    await cart.save();

    const food = await Food.findById(foodItemId);
    if (food) {
      const selectedNames = extraItems.map(item => item.name);
      food.addons.forEach(addon => {
        addon.cartStatus = selectedNames.includes(addon.name) ? 1 : 0;
      });
      await food.save();
    }

    const extraItemIds = updatedExtraItems.map(item => item._id?.toString()).filter(Boolean);

    return res.status(200).json({
      success: 1,
      message: "Extra items updated using FoodItem ID and user token",
      cart,
      extraItemIds
    });

  } catch (error) {
    console.error("Add extra items error:", error);
    return res.status(500).json({
      success: 0,
      message: "Something went wrong",
      error: error.message,
    });
  }
};


 
// Get food cart data
// Method: GET
// Endpoint: /craving/getcart

const getCartData = async (req, res) => {
  try {

    if (!req.user || !req.user._id) {
      return res.send({
        success: 0,
        message: "User authentication failed. Please login again."
      });
    }

    // Populate FoodItem + vendorId (name + latitude + longitude + location)
    const data = await Cart.find({ userId: req.user._id })
      .populate({
        path: "FoodItem",
        populate: {
          path: "vendorId",
          select: "name latitude longitude location"
        }
      });

    let totalFoodPrice = 0;
    let totalAddonsPrice = 0;

    const cartIds = [];
    const processedCartDetails = [];

    data.forEach((item) => {
      if (!item.FoodItem) {
        console.warn(`⚠️ Missing FoodItem for cart ID: ${item._id}`);
        return;
      }

      cartIds.push(item._id);

      const foodPrice = parseFloat(item.FoodItem.amount) || 0;
      const discountPercentage = parseFloat(item.FoodItem.discountPercentage) || 0;
      const discountedPrice =
        foodPrice - (foodPrice * discountPercentage) / 100;

      const quantity = parseInt(item.quantity) || 1;
      totalFoodPrice += discountedPrice * quantity;

      let extraItemsPrice = 0;
      if (item.extraItems && Array.isArray(item.extraItems)) {
        extraItemsPrice = item.extraItems.reduce((total, extraItem) => {
          return total + (extraItem.price || 0);
        }, 0);
      }

      totalAddonsPrice += extraItemsPrice * quantity;

      const itemObject = item.toObject();

      if (
        itemObject.FoodItem &&
        itemObject.FoodItem.vendorId &&
        typeof itemObject.FoodItem.vendorId === "object"
      ) {
        const vendor = itemObject.FoodItem.vendorId;

        itemObject.FoodItem.vendorName = vendor.name || "";
        itemObject.FoodItem.vendorLatitude = vendor.latitude || "";
        itemObject.FoodItem.vendorLongitude = vendor.longitude || "";
        itemObject.FoodItem.vendorCoordinates =
          vendor.location?.coordinates || [];

        itemObject.FoodItem.vendorId = vendor._id;
      }

      processedCartDetails.push(itemObject);
    });

    const totalPrice = totalFoodPrice + totalAddonsPrice;

    return res.send({
      success: 1,
      message: "Fetched successfully",
      cartIds,
      details: processedCartDetails,
      totalFoodPrice: totalFoodPrice.toFixed(2),
      totalAddonsPrice: totalAddonsPrice.toFixed(2),
      totalPrice: totalPrice.toFixed(2),
      cart: data.length
    });

  } catch (error) {
    return res.send({
      success: 0,
      message: error.message
    });
  }
};





//Remove cart item
//Method: Patch
//Endpoint: /craving/remove
const removeCart = async (req, res) => {
  try {
    const { foodItemId } = req.body;
    const userId = req.user.id;

    console.log("Received FoodItem ID:", foodItemId);
    console.log("User ID from token:", userId);

    if (!mongoose.Types.ObjectId.isValid(foodItemId)) {
      return res.status(400).json({
        success: 0,
        message: "Invalid FoodItem ID format",
      });
    }

    // ✅ Find the cart item
    const cartItem = await Cart.findOne({ FoodItem: foodItemId, userId });

    if (!cartItem) {
      return res.status(404).json({
        success: 0,
        message: "Cart item not found",
      });
    }

    // ✅ Find the corresponding food item
    const foodItem = await Food.findById(foodItemId);
    if (!foodItem) {
      return res.status(404).json({
        success: 0,
        message: "Food item not found",
      });
    }

    if (cartItem.quantity > 1) {
      // ✅ Decrease quantity by 1 in Cart and Food
      cartItem.quantity -= 1;
      foodItem.quantity -= 1;

      await cartItem.save();
      await foodItem.save();

      return res.status(200).json({
        success: 1,
        message: "Quantity decreased by 1",
        updatedQuantity: cartItem.quantity,
      });
    }

    // ✅ If quantity is 1 or less, remove cart item and reset food item
    await Cart.findByIdAndDelete(cartItem._id);

    foodItem.cartStatus = 0;
    foodItem.quantity = 0;
    await foodItem.save();

    return res.status(200).json({
      success: 1,
      message: "Cart item removed and food updated",
    });
  } catch (error) {
    console.error("Error removing cart item:", error);
    return res.status(500).json({
      success: 0,
      message: error.message || "An error occurred",
    });
  }
};


//get foodcart item
//Method: Get
//Endpoint: /craving/foodItem
const getCartItem = async (req, res) => {
  try {
    const data = await Cart.find({ userId: req.user._id }).populate("FoodItem");

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

//check food available or not
//Method:Get
//Endpoint: /craving/check
const checkData = async (req, res) => {
  try {
    const userId = req.user._id;
    const { vendorId } = req.body; // Get vendorId from the request body

    // Find cart item(s) for the user
    const cartItems = await Cart.find({
      userId: userId,
    });

    if (cartItems.length > 0) {
      // Check if the cart already contains items from the same vendor
      const existingVendorIds = cartItems.map((item) =>
        item.vendorId.toString()
      );

      if (existingVendorIds.includes(vendorId.toString())) {
        // If the vendorId is the same, show a success message
        return res.send({
          success: 1,
          message: "Item added to your cart successfully.",
        });
      } else {
        // If a different vendorId is found, ask the user to remove old items
        return res.send({
          success: 0,
          message:
            "You have items from a different vendor in your cart. Do you want to remove the old items before adding new ones?",
        });
      }
    } else {
      // If the cart is empty, simply allow adding the item
      return res.send({
        success: 1,
        message: "Item added to your cart successfully.",
      });
    }
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message || "An error occurred while checking the cart.",
    });
  }
};


const replaceItem = async (req, res) => {
  try {
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};


//craving/getMeal  // filter status = 0 only, (status 1 for remove food by vendor)
// Method: GET
// Endpoint: /craving/getMeal
const getMeal = async (req, res) => {
  try {
    const id = req.body.id || req.query.id; // body ya query dono me se id le lo
 
    // Find all food items with this MealId
    const data = await Food.find({ MealId: id }).populate('vendorId', 'name');

    const filteredData = data.filter(item => item.status === "0");
    const itemsWithVendorName = filteredData.map(item => {
      const itemObject = item.toObject(); // Mongoose डॉक्यूमेंट को प्लेन JavaScript ऑब्जेक्ट में बदलें
      if (itemObject.vendorId && typeof itemObject.vendorId === 'object') {
        itemObject.vendorName = itemObject.vendorId.name; // वेंडर का नाम जोड़ें
        itemObject.vendorId = itemObject.vendorId._id; // vendorId को सिर्फ उसकी ID पर वापस सेट करें
      }
      return itemObject;
    });
 
    return res.send({
      success: 1,
      message: "Items fetched successfully",
      items: itemsWithVendorName
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message
    });
  }
};
 
 

// Update cart item quantity (((( for only website ))))
// Method: PUT
// Endpoint: /craving/updateQuantity
const updateQuantity = async (req, res) => {
  try {
    const { foodItemId, quantity } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(foodItemId)) {
      return res.status(400).json({ success: 0, message: "Invalid FoodItem ID" });
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ success: 0, message: "Quantity must be a positive number" });
    }

    // Find cart item
    const cartItem = await Cart.findOne({ FoodItem: foodItemId, userId });
    if (!cartItem) {
      return res.status(404).json({ success: 0, message: "Cart item not found" });
    }

    // Find food item
    const foodItem = await Food.findById(foodItemId);
    if (!foodItem) {
      return res.status(404).json({ success: 0, message: "Food item not found" });
    }

    // Update quantities
    cartItem.quantity = qty;
    foodItem.quantity = qty;

    // Calculate final price
    const basePrice = Number(foodItem.amount);
    cartItem.finalprice = basePrice * qty;

    // Save changes
    await cartItem.save();
    await foodItem.save();

    return res.status(200).json({
      success: 1,
      message: "Quantity updated successfully",
      data: {
        cartItem,
        foodItem
      }
    });

  } catch (error) {
    console.error("Update quantity error:", error);
    return res.status(500).json({
      success: 0,
      message: error.message || "Failed to update quantity"
    });
  }
};





module.exports = {
  getParticularFood,
  filter,
  addToCart,
  getCartItem,
  checkData,
  replaceItem,
  removeCart,
  getCartData,
  addExtraItems,
  getMeal,
  updateQuantity // for only website
};
