const Order = require("../../../../modal/foodOrder");
const FoodOrder = require("../../../../modal/foodOrder");
const Driver = require("../../../../modal/driver");
const Vendor = require("../../../../modal/vandor");

//Get ordered food
//Method:Get
//Endpoint: /vendor-order/order
//status: 0 for pending , 1 for accept , 2 for assignd to driver , 5 for delivered ,6 for returned by driver
// orderType: "Single" for single item orders, "Bulk" for bulk orders
const getFoodOrder = async (req, res) => {
  try {
    const { orderType } = req.query;

    const filter = { 
      vendorId: req.user._id, 
      status: "0", 
      items: { $size: 1 }
    };

    if (orderType) {
      filter.orderType = orderType;
    }

    let data = await FoodOrder.find(filter).sort({ createdAt: -1 })
      .populate("userId")
      .populate("items.FoodItem");

    // Filter out orders with quantity > 1
    data = data.filter(order => order.items[0].quantity === 1);

    const totalOrders = data.length;

    return res.send({
      success: 1,
      message: "Fetched successfully",
      details: data,
      totalCount: totalOrders,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};


//Change user order status
//Method:Patch
//Endpoint: vendor-order/status/id/?status
//status: 0 for pending , 1 for accept , 2 for assignd to driver , 5 for delivered ,6 for returned by driver
const changeOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.query;

    // Update object prepare karein
    let updateData = {
      status,
      rejectionReason
    };

    // Agar status "1" (Accept) hai, to current time set karein
    if (status === "1") {
      updateData.vendorAcceptedAt = new Date();
    }

    const data = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true } // Return updated document
    );

    return res.send({
      success: 1,
      message: "Changed successfully",
      details: data,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Get food
//Method:Get
//Endpoint: /vendor-order/get-order?status
const getOrder = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const data = await Order.find({ status })
    .sort({ createdAt: -1 })
      .populate("userId")
      .populate("items.FoodItem")
      .populate("vendorId", "name phoneNumber") // Populate vendor details
      .populate("driverId", "name phoneNumber") // Populate driver details if exists
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

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


//get order history
//method:get
//end point :/ vendor-order/orderHistory
// Get vendor order history
// Method: GET
// Endpoint: /vendor-order/orderHistory
const orderHistory = async (req, res) => {
  try {
    // Get vendorId from the authenticated user (from token)
    // First check if we have user info from auth middleware
    const vendorId = req.user?._id || req.vendor?._id;
    
    if (!vendorId) {
      return res.status(400).send({
        success: 0,
        message: "Vendor ID is required. Please ensure you're authenticated."
      });
    }

    // console.log("Fetching orders for vendorId:", vendorId);

    const orders = await FoodOrder.find({ vendorId })
    .sort({ createdAt: -1 })
      .populate("items.FoodItem") // Populate foodId if needed
      // .populate("items.FoodItem")
      .populate("vendorId") // Populate vendorId
      .populate("userId") // Populate user details
      .populate("driverId") // Populate driver details if exists
      .sort({ createdAt: -1 });

    console.log(`Found ${orders.length} orders for vendor ${vendorId}`);

    if (orders.length === 0) {
      return res.status(200).send({
        success: 1,
        message: "No orders found for this vendor",
        orders: [],
      });
    }

    const updatedOrders = orders.map(order => {
      const updatedOrder = order.toObject();
      
      // Convert status codes to readable text
      const statusMap = {
        "0": "Pending",
        "1": "Accepted",
        "2": "Driver Assigned",
        "5": "Delivered",
        "6": "Rejected",
        "Order Delivered": "Delivered" // Fix typo in original status
      };

      updatedOrder.status = statusMap[updatedOrder.status] || "Pending";
      
      // Format price to 2 decimal places
      if (updatedOrder.price) {
        updatedOrder.price = parseFloat(updatedOrder.price).toFixed(2);
      }
      
      return updatedOrder;
    });

    return res.status(200).send({
      success: 1,
      message: "Order history fetched successfully",
      orders: updatedOrders,
    });
  } catch (error) {
    console.error("Error in orderHistory:", error);
    return res.status(500).send({
      success: 0,
      message: error.message || "Internal server error",
    });
  }
};

//Get accepted orders
// Method: GET
// Endpoint: /vendor-order/accepted-orders
const getAcceptedOrders = async (req, res) => {
  try {
    const vendorId = req.user._id;

    // Single-item orders
    const singleItemOrders = await FoodOrder.find({
      vendorId: vendorId,
      status: "1",
      items: { $size: 1 },
    })
    .sort({ createdAt: -1 })
      .populate("userId")
      .populate("items.FoodItem");

    // Bulk orders
    const bulkOrders = await FoodOrder.find({
      vendorId: vendorId,
      status: "1",
      items: { $elemMatch: { quantity: { $gt: 1 } } },
    })
      .populate("userId")
      .populate("items.FoodItem");

    const acceptedOrders = [...singleItemOrders, ...bulkOrders];

    return res.send({
      success: 1,
      message: "Accepted orders (single & bulk) fetched successfully",
      details: acceptedOrders,
      totalCount: acceptedOrders.length,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};



// Assign driver to order
// Method: POST
// Endpoint: /vendor-order/assign-driver
const assignDriverToOrder = async (req, res) => {
  try {
    const { orderId, driverId } = req.body;

    if (!orderId || !driverId) {
      return res.send({
        success: 0,
        message: "Order ID and Driver ID are required",
      });
    }

    // check order exists and is accepted
    const order = await FoodOrder.findOne({ _id: orderId, status: "1" });

    if (!order) {
      return res.send({
        success: 0,
        message: "Accepted order not found",
      });
    }

    // check driver is online
    const driver = await Driver.findOne({ _id: driverId, isOnline: true });

    if (!driver) {
      return res.send({
        success: 0,
        message: "Driver not found or not online",
      });
    }

    // Assign driver to order
    order.driverId = driverId;
    order.status = "2"; // assigned to driver 
    await order.save();

    // Mark driver as busy
    driver.isBusy = true;
    await driver.save();

    return res.send({
      success: 1,
      message: "Driver assigned successfully to the order",
      details: order,
    });

  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Get order with driver details
// Method: GET
// Endpoint: /vendor-order/order-with-driver/:orderId
const getOrderWithDriver = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await FoodOrder.findById(orderId)
    .sort({ createdAt: -1 })
      .populate("items.FoodItem")
      .populate("userId")
      .populate("driverId"); // ✅ include driver details

    if (!order) {
      return res.send({
        success: 0,
        message: "Order not found",
      });
    }

    return res.send({
      success: 1,
      message: "Order with driver fetched successfully",
      details: order,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};


// Get online drivers
// Method: GET
// Endpoint: /vendor-order/online-drivers
const getOnlineDrivers = async (req, res) => {
  try {
    const onlineDrivers = await Driver.find({
      vendorId: req.user._id,
      isOnline: true, // ✅ only online drivers
    })
    .sort({ createdAt: -1 });

    if (!onlineDrivers || onlineDrivers.length === 0) {
      return res.send({
        success: 0,
        message: "No online driver found",
        details: [],
      });
    }

    // Add status: "Available" or "Busy"
    const modifiedDrivers = onlineDrivers.map(driver => ({
      ...driver.toObject(),
      status: driver.isBusy ? "Busy" : "Available",
    }));

    return res.send({
      success: 1,
      message: "Online drivers fetched successfully",
      details: modifiedDrivers,
    });

  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};
//  /vendor-order/orderHistorydriver
const orderHistorydriver = async (req, res) => {
  try {
    const vendorId = req.user._id;

    // Get all orders that are either delivered (5) or rejected (6)
    const orders = await Order.find({
      vendorId,
      status: { $in: ["5", "6"] }, // 5 = Delivered, 6 = Rejected
    })
    .sort({ createdAt: -1 })
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

module.exports = { getFoodOrder, changeOrderStatus, getOrder,orderHistory, getAcceptedOrders,assignDriverToOrder,getOrderWithDriver,getOnlineDrivers,orderHistorydriver };
