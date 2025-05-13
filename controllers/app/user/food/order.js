const FoodOrder = require("../../../../modal/foodOrder");
const Available = require("../../../../modal/availability")
const moment = require("moment");
const Cart = require("../../../../modal/addfoodcart");
const Food = require("../../../../modal/addFood");

//Order food for non-subscription user
//Method: Post
//Endpoint: /food-Order/order
//type 0 for non-subscription order type 1 for subscription order
//status: 0 for pending , 1 for accept , 2 for reject

const mongoose = require("mongoose");


const bookOrder = async (req, res) => {
  try {
    const {
      foodId,    // Array of Cart IDs (strings)
      vendorId,
      cutlery,
      address,   // अब उम्मीद है कि यह string array होगा, जैसे ["Line1","Line2",...]
      date,
      foodTime,
      foodSlot,
      week,
      rapid,
      price,
      orderType
    } = req.body;

    // 1) Validate foodId array
    if (!Array.isArray(foodId) || foodId.length === 0) {
      return res.status(401).send({ success: 0, message: "foodId must be a non-empty array" });
    }

    // 2) Validate address array
    if (!Array.isArray(address) || address.length === 0) {
      return res.status(402).send({ success: 0, message: "Address must be a non-empty array of strings" });
    }

    // 3) Extract userId from token
    const userObjId = req.user?._id;
    if (!userObjId) {
      return res.status(403).send({ success: 0, message: "Valid User ID is required" });
    }

    // 4) Validate & convert vendorId
    if (!mongoose.isValidObjectId(vendorId)) {
      return res.status(404).send({ success: 0, message: "Valid vendorId is required" });
    }
    const vendorObjId = new mongoose.Types.ObjectId(vendorId);

    // 5) Convert all incoming foodId strings to ObjectId
    const foodObjIds = foodId
      .filter(id => mongoose.isValidObjectId(id))
      .map(id => new mongoose.Types.ObjectId(id));

    if (foodObjIds.length === 0) {
      return res.status(405).send({ success: 0, message: "No valid foodId found" });
    }

    // 6) Fetch cart items
    const cartItems = await Cart
      .find({ _id: { $in: foodObjIds }, userId: userObjId })
      .populate("FoodItem");

    if (cartItems.length === 0) {
      return res.status(406).send({ success: 0, message: "No cart items found for given foodId" });
    }

    // 7) Prepare embedded items array (address as array)
    const items = cartItems.map(item => ({
      FoodItem:   item.FoodItem._id,
      quantity:   item.quantity,
      extraItems: item.extraItems,
      Amount:     item.Amount,
      finalprice: item.finalprice,
      cutlery,    // from req.body
      address,    // array of strings from req.body
      date,       // from req.body
      foodTime,
      foodSlot,
      week,
      type:     item.type,
      request:  item.request,
    }));

    // 8) Create the order
    const order = await FoodOrder.create({
      items,
      vendorId:  vendorObjId,
      userId:    userObjId,
      rapid,
      price,
      type:      0,
      orderType
    });

    // 9) Delete cart items & reset Food statuses
    for (const cartId of foodObjIds) {
      const cartItem = await Cart.findOne({ _id: cartId, userId: userObjId });
      if (cartItem) {
        await Cart.deleteOne({ _id: cartItem._id });
      }
      await Food.updateOne(
        { _id: cartItem?.FoodItem },
        {
          $set: { cartStatus: 0, quantity: 0 },
          $unset: { "addons.$[elem].cartStatus": "" }
        },
        { arrayFilters: [{ "elem.cartStatus": { $ne: 0 } }] }
      );
    }

    return res.send({ success: 1, message: "Order placed and cart cleaned up", order });

  } catch (error) {
    console.error("Error in bookOrder:", error);
    return res.status(500).send({ success: 0, message: error.message });
  }
};



//food time Avaibility
//Method:Post
//Endpoint:  /food-Order/avail
const available = async (req, res) => {
  try {
    const { startDate, vendorId } = req.body;

    if (!startDate || !vendorId) {
      return res.status(400).send({
        success: 0,
        message: "startDate and vendorId are required.",
      });
    }


    const formattedStartDate = moment(startDate, "DD/MM/YYYY");

    if (!formattedStartDate.isValid()) {
      return res.status(400).send({
        success: 0,
        message: "Invalid date format. Use DD/MM/YYYY.",
      });
    }

    const availability = await Available.find({
      vendorId: vendorId,
      startDate: { $lte: formattedStartDate.format("DD/MM/YYYY") },
      endDate: { $gte: formattedStartDate.format("DD/MM/YYYY") },
    });

    if (availability.length === 0) {
      return res.send({
        success: 1,
        message: "No availability found for the provided date.",
        data: {},
      });
    }

    const response = {
      date: formattedStartDate.format("DD/MM/YYYY"),
      morning: [],
      afternoon: [],
      evening: [],
    };

    availability.forEach((slot) => {
      if (slot.day.toLowerCase() === "morning") {
        response.morning.push({
          startTime: slot.startTime,
          endTime: slot.endTime,
        });
      } else if (slot.day.toLowerCase() === "afternoon") {
        response.afternoon.push({
          startTime: slot.startTime,
          endTime: slot.endTime,
        });
      } else if (slot.day.toLowerCase() === "evening") {
        response.evening.push({
          startTime: slot.startTime,
          endTime: slot.endTime,
        });
      }
    });

    return res.send({
      success: 1,
      message: "Availability fetched successfully.",
      data: response,
    });
  } catch (error) {
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

//Get order for user
//Method:Get
//Endpoint: /food-Order/getOrder
const getOrder = async(req,res)=>{
  try {
    const { page = 1, limit = 5 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 5);
    const data = await FoodOrder.find({userId:req.user._id}).populate('vendorId') .populate({
      path: 'foodId', 
      populate: {
        path: 'FoodItem', 
        model: 'Food' 
      }
    })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

    return res.send({
      success:1,
      message:'Fetched successfully',
      details:data
    })
  } catch (error) {
    return res.send({
      success:0,
      message:error.message
    })
  }
}
//food-Order/getdiscountorder
const getdiscountorder = async (req, res) => {
  try {
    const data = await Food.aggregate([
      // 1) पहले discountPercentage से '%' हटा दें (if present)
      {
        $addFields: {
          discountNum: {
            $toInt: {
              $trim: {
                input: "$discountPercentage",
                chars: "%"
              }
            }
          }
        }
      },
      // 2) फिर 25 या उससे ऊपर वाले ही मैच करें
      {
        $match: {
          discountNum: { $gte: 25 }
        }
      },
      // 3) अगर चाहें तो असली डिस्काउंट स्ट्रिंग भी रिटेन करें, या उसे हटा दें
      {
        $project: {
          discountNum: 0 // (optional) ये फील्ड रिटर्न नहीं करना है
        }
      }
    ]);

    return res.send({
      success: 1,
      message: "Fetched all items with ≥25% discount",
      details: data
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message
    });
  }
};
// food-Order/deleteCartItem
const deleteCartItem = async (req, res) => {
  try {
    const { id } = req.body; // FoodItem ID

    // Find the cart item by user and food item
    const cartItem = await Cart.findOne({ FoodItem: id, userId: req.user._id });

    if (!cartItem) {
      return res.send({ success: 0, message: "Cart item not found." });
    }

    // Delete the cart item
    await Cart.deleteOne({ _id: cartItem._id });

    // Reset the food item's cartStatus and quantity
    const foodItem = await Food.findById(id);
    if (foodItem) {
      foodItem.cartStatus = 0;
      foodItem.quantity = 0;
      await foodItem.save();
    }

    return res.send({
      success: 1,
      message: "Cart item deleted successfully.",
    });

  } catch (error) {
    return res.send({ success: 0, message: error.message });
  }
};

//   /food-Order/getordertype
const getordertype = async (req, res) => {
  try {
    // Find orders where at least one item has quantity > 1, and status is "0"
    const bulkOrders = await FoodOrder.find({
      status: "0",
      "items.quantity": { $gt: 1 },
    })
      .populate("userId")
      .populate("items.FoodItem");

    // Filter out any orders that do not meet the bulk order criteria (single-item orders)
    const bulkOnlyOrders = bulkOrders.filter(order => 
      order.items.some(item => item.quantity > 1)
    );

    return res.send({
      success: 1,
      message: "Fetched successfully",
      details: bulkOnlyOrders,
      totalCount: bulkOnlyOrders.length,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};












module.exports = { bookOrder, available, getOrder,getdiscountorder ,deleteCartItem,getordertype };
