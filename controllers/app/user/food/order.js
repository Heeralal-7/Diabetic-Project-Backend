const FoodOrder = require("../../../../modal/foodOrder");
const Available = require("../../../../modal/availability")
const moment = require("moment");
const Cart = require("../../../../modal/addfoodcart");
const Food = require("../../../../modal/addFood");
const deliveryCharges = require("../../../../modal/foodDeliveryCharges");
const UserMemberShip = require("../../../../modal/UsermemberShip"); // ✅ IMPORTANT: Add this
const mongoose = require("mongoose");

//Order food 
//Method: Post
//Endpoint: /food-Order/order

//Order food 
//Method: Post
//Endpoint: /food-Order/order

const bookOrder = async (req, res) => {
  try {
    const {
      // --- Basic Order Details ---
      foodId,
      vendorId,
      cutlery,
      address,
      date,
      foodTime,
      foodSlot,
      week,
      rapid,
      price,
      orderType,
      
      // --- Payment Details ---
      paymentStatus,
      paymentMethod,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      
      // --- Membership Details ---
      membershipApplied = false,
      membershipRemainingDeliveries = 0,
      membershipWasApplied = false,
      membershipDiscount = 0,
      
      // --- Config/Metadata ---
      distanceInfo = {} 
    } = req.body;

    // ===================================================
    // 1. ROBUST EXTRACTION OF DELIVERY CHARGES
    // ===================================================
    // Problem Fix: Check both req.body AND distanceInfo object
    
    // 1. Base Delivery
    const finalBaseDelivery = parseFloat(req.body.baseDeliveryCharge) || 
                              parseFloat(distanceInfo.baseDelivery) || 
                              parseFloat(distanceInfo.baseDeliveryCharge) || 
                              0;

    // 2. Extra Distance Charge
    const finalDistanceCharge = parseFloat(req.body.extraDistanceCharges) || 
                                parseFloat(distanceInfo.extraCharges) || 
                                parseFloat(distanceInfo.distanceCharge) || 
                                0;

    // 3. Rapid Delivery Fee
    const finalRapidCharge = parseFloat(req.body.rapidDeliveryFee) || 
                             parseFloat(distanceInfo.rapidDeliveryFee) || 
                             parseFloat(distanceInfo.rapidDeliveryCharge) || 
                             0;

    // 4. Tax Amount
    const finalTaxAmount = parseFloat(req.body.taxAmount) || 
                           parseFloat(distanceInfo.taxAmount) || 
                           0;

    // 5. Total Delivery Charge (Sum of above or direct value)
    let finalTotalDelivery = parseFloat(req.body.deliveryCharge) || 
                             parseFloat(distanceInfo.totalDelivery) || 
                             parseFloat(distanceInfo.totalDeliveryCharge) || 
                             0;

    // Fallback: If total is 0 but components exist, sum them up
    if (finalTotalDelivery === 0) {
        finalTotalDelivery = finalBaseDelivery + finalDistanceCharge + finalRapidCharge + finalTaxAmount;
    }

    // ===================================================
    // 2. VALIDATIONS
    // ===================================================

    if (!Array.isArray(foodId) || foodId.length === 0) {
      return res.status(400).send({ success: 0, message: "foodId must be a non-empty array" });
    }

    if (!Array.isArray(address) || address.length === 0) {
      return res.status(400).send({ success: 0, message: "Address must be a non-empty array" });
    }

    const userObjId = req.user?._id;
    if (!userObjId) {
      return res.status(401).send({ success: 0, message: "Valid User ID is required" });
    }

    if (!mongoose.isValidObjectId(vendorId)) {
      return res.status(400).send({ success: 0, message: "Valid vendorId is required" });
    }
    const vendorObjId = new mongoose.Types.ObjectId(vendorId);

    const foodObjIds = foodId
      .filter(id => mongoose.isValidObjectId(id))
      .map(id => new mongoose.Types.ObjectId(id));

    if (foodObjIds.length === 0) {
      return res.status(400).send({ success: 0, message: "No valid foodId found" });
    }

    // ===================================================
    // 3. FETCH CART ITEMS
    // ===================================================
    
    const cartItems = await Cart
      .find({ _id: { $in: foodObjIds }, userId: userObjId })
      .populate("FoodItem");

    if (!cartItems || cartItems.length === 0) {
      return res.status(404).send({ success: 0, message: "Cart items not found or already ordered" });
    }

    // ===================================================
    // 4. MEMBERSHIP LOGIC
    // ===================================================
    
    let membershipUpdateResult = null;
    let currentMembership = null;
    
    if (membershipWasApplied) {
      try {
        currentMembership = await UserMemberShip.findOne({
          userId: userObjId,
          isActive: true,
          endDate: { $gt: new Date() }
        });

        if (currentMembership && currentMembership.foodDeliveriesUsed < currentMembership.foodDeliveryLimit) {
            currentMembership.foodDeliveriesUsed += 1;
            
            if (!currentMembership.deliveryUsageHistory) currentMembership.deliveryUsageHistory = [];
            currentMembership.deliveryUsageHistory.push({
              date: new Date(),
              type: 'food',
              orderType: 'food_order',
              paymentMethod: paymentMethod
            });

            await currentMembership.save();
            membershipUpdateResult = { success: true, message: "Membership updated" };
        }
      } catch (memError) {
        console.error("Membership update error:", memError);
      }
    }

    // ===================================================
    // 5. PREPARE ITEMS (With Discounted Price)
    // ===================================================

    const items = cartItems.map(item => {
      const originalPrice = parseFloat(item.FoodItem?.amount || 0);
      const discountPercent = parseFloat(item.FoodItem?.discountPercentage || 0);
      
      let finalDiscountedPrice = originalPrice;
      if (discountPercent > 0) {
        const discountAmount = (originalPrice * discountPercent) / 100;
        finalDiscountedPrice = originalPrice - discountAmount;
      }

      return {
        FoodItem:   item.FoodItem ? item.FoodItem._id : null,
        quantity:   item.quantity,
        extraItems: item.extraItems,
        Amount:     item.Amount, 
        discountedPrice: parseFloat(finalDiscountedPrice.toFixed(2)),
        finalprice: item.finalprice,
        cutlery,
        address,
        date,
        foodTime,
        foodSlot,
        week,
        type:     item.type,
        request:  item.request,
      };
    });

    // ===================================================
    // 6. PREPARE PAYMENT DATA
    // ===================================================

    let finalPaymentId = null;
    let finalGateway = null;
    let finalTransactionId = null;
    let finalStatus = "0"; 

    if (paymentMethod === 'razorpay') {
        finalPaymentId = razorpayPaymentId; 
        finalGateway = 'razorpay';
        finalTransactionId = razorpayOrderId;
        if(paymentStatus === 'completed') finalStatus = "1"; 
    } else if (paymentMethod === 'cod') {
        finalPaymentId = `COD-${Date.now()}`;
        finalGateway = 'cod';
    }

    // ===================================================
    // 7. CONSTRUCT DELIVERY CHARGES OBJECT
    // ===================================================

    const deliveryChargesObj = {
        baseDeliveryCharge: finalBaseDelivery,
        distanceCharge: finalDistanceCharge,
        rapidDeliveryCharge: finalRapidCharge,
        taxAmount: finalTaxAmount,
        totalDeliveryCharge: finalTotalDelivery,
        
        // Metadata
        distance: parseFloat(distanceInfo.distance) || 0,
        freeDeliveryRadius: parseFloat(distanceInfo.freeDeliveryRadius) || 10,
        perKmCharge: parseFloat(distanceInfo.perKmCharge) || 5,
        taxPercentage: parseFloat(distanceInfo.taxPercentage) || 0,
        freeDeliveryThreshold: parseFloat(distanceInfo.freeDeliveryThreshold) || 300,
        isFreeDelivery: distanceInfo.freeDeliveryEligible || false
    };

    // ===================================================
    // 8. CREATE ORDER
    // ===================================================

    const orderData = {
      items,
      vendorId:  vendorObjId,
      userId:    userObjId,
      rapid,
      price,
      type:      finalStatus,
      orderType,
      
      // Payment
      paymentId: finalPaymentId, 
      paymentMethod: paymentMethod,
      paymentGateway: finalGateway,
      transactionId: finalTransactionId,
      paymentDetails: {
         razorpayPaymentId,
         razorpayOrderId,
         razorpaySignature,
         status: paymentStatus
      },

      // ✅ Delivery Charges
      deliveryCharges: deliveryChargesObj,

      // Membership
      membershipInfo: {
        applied: membershipApplied,
        wasApplied: membershipWasApplied,
        remainingAfterOrder: membershipRemainingDeliveries,
        discountAmount: membershipDiscount,
        membershipUpdateSuccess: membershipUpdateResult?.success
      },
      
      // Legacy support
      distanceInfo: {
        distance: distanceInfo.distance,
        distanceText: distanceInfo.distanceText,
        duration: distanceInfo.duration
      }
    };

    const order = await FoodOrder.create(orderData);

    // ===================================================
    // 9. CLEANUP CART
    // ===================================================
    
    for (const cartId of foodObjIds) {
      await Cart.deleteOne({ _id: cartId, userId: userObjId });
    }

    return res.status(200).send({
      success: 1,
      message: "Order placed successfully",
      order: order,
      paymentId: finalPaymentId
    });

  } catch (error) {
    console.error("Error in bookOrder:", error);
    return res.status(500).send({ success: 0, message: error.message });
  }
};

//food time Avaibility
//Method:Post
//Endpoint:  /food-Order/avail
// Endpoint: /food-Order/avail
// Endpoint: /food-Order/avail
// Endpoint: /food-Order/avail
const available = async (req, res) => {
  try {
    const { startDate, vendorId } = req.body;

    if (!startDate || !vendorId) {
      return res.status(400).send({
        success: 0,
        message: "startDate and vendorId are required.",
      });
    }

    // 1. Validate Input Date
    const targetDate = moment(startDate, "DD/MM/YYYY");
    if (!targetDate.isValid()) {
      return res.status(400).send({
        success: 0,
        message: "Invalid date format. Use DD/MM/YYYY.",
      });
    }

    // 2. Fetch all slots for this vendor
    const availability = await Available.find({
      vendorId: vendorId
    });

    if (availability.length === 0) {
      return res.send({
        success: 1,
        message: "No availability found for this vendor.",
        data: { date: startDate, morning: [], afternoon: [], evening: [] },
      });
    }

    const response = {
      date: startDate,
      morning: [],
      afternoon: [],
      evening: [],
    };

    // 3. Process each availability record
    availability.forEach((slot) => {
      // Database Dates Check (String format "DD/MM/YYYY")
      const dbStartDate = moment(slot.startDate, "DD/MM/YYYY");
      const dbEndDate = moment(slot.endDate, "DD/MM/YYYY");

      // Check if requested date is within range
      if (targetDate.isBetween(dbStartDate, dbEndDate, 'day', '[]')) {
        
        // ✅ Direct Object Structure (No splitting logic)
        // Frontend expects an object with startTime and endTime keys
        const slotObject = {
          startTime: slot.startTime,
          endTime: slot.endTime
        };

        // Push to relevant array based on 'day' field
        const dayLower = slot.day ? slot.day.toLowerCase() : "";

        if (dayLower === "morning") {
          response.morning.push(slotObject);
        } else if (dayLower === "afternoon") {
          response.afternoon.push(slotObject);
        } else if (dayLower === "evening") {
          response.evening.push(slotObject);
        }
      }
    });

    return res.send({
      success: 1,
      message: "Availability fetched successfully.",
      data: response,
    });

  } catch (error) {
    console.error("Availability Error:", error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};



//Get order for user
//Method:Get
//Endpoint: /food-Order/getOrder
//Get order for user with distance-based delivery charges
//Method:Get
//Endpoint: /food-Order/getOrder
// Endpoint: /food-Order/getOrder
const getOrder = async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    // Fetch delivery config ONLY for fallback purposes
    const deliveryConfig = await deliveryCharges.findOne().sort({ lastUpdated: -1 });
    
    // Fetch Orders
    const data = await FoodOrder.find({ userId: req.user._id })
      .populate('vendorId')
      .populate({
        path: 'items.FoodItem',
        select: 'price foodName foodImage amount discountPercentage finalprice foodSubCategory',
        model: 'Food'
      })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // Process Orders
    const ordersWithDeliveryCharges = data.map(order => {
      const orderData = order.toObject();
      
      // ✅ FIX: CHECK IF DATABASE ALREADY HAS DELIVERY CHARGES
      if (orderData.deliveryCharges && orderData.deliveryCharges.totalDeliveryCharge > 0) {
        
        // Return saved data directly (This matches your DB dump)
        orderData.finalTotalAmount = parseFloat(orderData.price); // Price usually includes everything
        
        return orderData; 
      }

      // --- FALLBACK LOGIC (Only for old orders without saved charges) ---
      
      let deliveryCharge = 0;
      let taxAmount = 0;
      let totalAmount = parseFloat(orderData.price) || 0; // Assuming price holds the final total
      let distanceCharge = 0;
      
      // Fallback Config (Use defaults if config missing)
      const config = deliveryConfig || {
          baseDeliveryCharge: 50,
          freeDeliveryThreshold: 300,
          rapidDeliveryCharge: 100,
          freeDeliveryRadius: 10,
          perKmCharge: 5,
          taxPercentage: 0
      };

      // 1. Calculate Base Delivery
      // Note: We try to reverse-engineer items total to check threshold
      // But for simplicity in fallback, we assume base charge applies if total < threshold
      // (This is an approximation for old orders)
      if (totalAmount < config.freeDeliveryThreshold) {
        deliveryCharge = config.baseDeliveryCharge;
      }

      // 2. Rapid
      if (orderData.rapid) {
        deliveryCharge += config.rapidDeliveryCharge;
      }

      // 3. Distance
      if (orderData.distanceInfo?.distance && orderData.distanceInfo.distance > config.freeDeliveryRadius) {
        const extraDistance = orderData.distanceInfo.distance - config.freeDeliveryRadius;
        distanceCharge = Math.ceil(extraDistance) * config.perKmCharge;
        deliveryCharge += distanceCharge;
      }

      // 4. Tax
      if (config.taxPercentage > 0) {
        taxAmount = (deliveryCharge * config.taxPercentage) / 100;
      }

      // Construct the object for old orders
      orderData.deliveryCharges = {
        baseDeliveryCharge: config.baseDeliveryCharge,
        freeDeliveryThreshold: config.freeDeliveryThreshold,
        rapidDeliveryCharge: orderData.rapid ? config.rapidDeliveryCharge : 0,
        taxPercentage: config.taxPercentage,
        
        deliveryCharge: deliveryCharge, // Total Delivery
        taxAmount: taxAmount,
        distanceCharge: distanceCharge,
        
        freeDeliveryRadius: config.freeDeliveryRadius,
        perKmCharge: config.perKmCharge,
        totalDeliveryCharge: deliveryCharge + taxAmount,
        isFreeDelivery: totalAmount >= config.freeDeliveryThreshold
      };

      // Ensure final total is set
      orderData.finalTotalAmount = totalAmount;

      return orderData;
    });

    return res.send({
      success: 1,
      message: 'Fetched successfully',
      details: ordersWithDeliveryCharges,
      // Sending current config just for reference, not for calculation
      deliveryConfig: deliveryConfig ? {
        freeDeliveryThreshold: deliveryConfig.freeDeliveryThreshold,
        baseDeliveryCharge: deliveryConfig.baseDeliveryCharge,
        rapidDeliveryCharge: deliveryConfig.rapidDeliveryCharge,
        taxPercentage: deliveryConfig.taxPercentage,
        freeDeliveryRadius: deliveryConfig.freeDeliveryRadius,
        perKmCharge: deliveryConfig.perKmCharge
      } : {}
    });

  } catch (error) {
    console.error("Error in getOrder:", error);
    return res.status(500).send({
      success: 0,
      message: error.message
    });
  }
};
//Get single order by ID
//Method:Get
//Endpoint: /food-Order/get-order/:orderId
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params || req.query;

    if (!orderId) {
      return res.status(400).send({
        success: 0,
        message: "Order ID is required"
      });
    }

    // Validate if orderId is a valid MongoDB ObjectId
    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).send({
        success: 0,
        message: "Invalid Order ID format"
      });
    }

    const order = await FoodOrder.findOne({
      _id: orderId,
      userId: req.user._id // Ensure user can only access their own orders
    })
    .populate('vendorId')
    .populate('items.FoodItem');

    if (!order) {
      return res.status(404).send({
        success: 0,
        message: "Order not found"
      });
    }

    return res.send({
      success: 1,
      message: "Order fetched successfully",
      order: order
    });

  } catch (error) {
    console.error("Error in getOrderById:", error);
    return res.status(500).send({
      success: 0,
      message: error.message
    });
  }
};
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

// get bulk orders
// Method: GET
// Endpoint: /food-Order/getordertype
// This endpoint retrieves all bulk orders (orders with at least one item having quantity > 1)

const getordertype = async (req, res) => {
  try {
    // Find all orders with status "0"
    const orders = await FoodOrder.find({
      status: "0"
    })
      .populate("userId")
      .populate("items.FoodItem");

    // Filter orders where either:
    // 1. There are multiple items (even if each has quantity 1), OR
    // 2. Any single item has quantity > 1
    const bulkOrders = orders.filter(order => 
      order.items.length > 1 || 
      order.items.some(item => item.quantity > 1)
    );

    return res.send({
      success: 1,
      message: "Fetched successfully",
      details: bulkOrders,
      totalCount: bulkOrders.length,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// food order history for driver
// Method: GET
// Endpoint: /food-Order/orderHistorydriver
const orderHistorydriver = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all orders that are either delivered (5) or rejected (6)
    const orders = await FoodOrder.find({
      userId,
      status: { $in: ["5", "6"] }, // 5 = Delivered, 6 = Rejected
    })
    .populate("userId") // Full user details
    .populate("vendorId") // Full vendor details
    .populate("driverId") // ✅ Add driver details (self)
    .populate("items.FoodItem") // food items
      .populate("driverId", "name phoneNumber")          // driver info
      .sort({ updatedAt: -1 });                           // latest first

    // Format the response with more details
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      orderId: order.orderId, // if you have an order ID field
      status: order.status,
      statusText: order.status === "5" ? "Delivered" : "Rejected",
      totalAmount: order.totalAmount,
      deliveryAddress: order.deliveryAddress,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      rejectionReason: order.rejectionReason || null,
      user: order.userId,
      vendor: order.vendorId,
      driver: order.driverId,
      items: order.items.map(item => ({
        foodItem: item.FoodItem,
        quantity: item.quantity,
        price: item.price,
      })),
    }));

    return res.send({
      success: 1,
      message: "Order history fetched successfully",
      count: orders.length,
      details: formattedOrders,
    });

  } catch (error) {
    console.error("Order history error:", error);
    return res.status(500).send({
      success: 0,
      message: "Failed to fetch order history",
      error: error.message,
    });
  }
};

module.exports = { bookOrder, available, getOrder, getOrderById,getdiscountorder ,deleteCartItem,getordertype,orderHistorydriver };