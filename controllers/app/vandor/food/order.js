const Order = require("../../../../modal/foodOrder");
const FoodOrder = require("../../../../modal/foodOrder");
const Driver = require("../../../../modal/driver");

//Get ordered food
//Method:Get
//Endpoint: /vendor-order/order?orderType
//status: 0 for pending , 1 for accept , 2 for reject
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

    let data = await FoodOrder.find(filter)
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
//status: 0 for pending , 1 for accept , 2 for reject
const changeOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;
    const data = await Order.findByIdAndUpdate(
      id,
      {
        status,
      },
      { new: true }
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
    .populate({
        path: "foodId",
        populate: {
          path: "FoodItem",
          model: "Food",
        },
      })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    return res.send({
      success: 1,
      message: "Fertched successfully",
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
const orderHistory = async (req, res) => {
  try {
    const { userId } = req.body;

    // Log the received userId
    console.log("Received userId:", userId);

    const orders = await FoodOrder.find({ userId })
      .populate("foodId") // Populate foodId
      .populate("vendorId") // Populate vendorId
      .sort({ createdAt: -1 });

    // Log the fetched orders with populated foodId and vendorId
    console.log("Fetched orders:", orders);

    if (orders.length === 0) {
      return res.status(200).send({
        success: 1,
        message: "No orders found for the given userId",
        orders: [],
      });
    }

    const updatedOrders = orders.map(order => {
      const updatedOrder = order.toObject();
      if (updatedOrder.status === "0") {
        updatedOrder.status = "Pending";
      } else if (updatedOrder.status === "1") {
        updatedOrder.status = "Order Delivered";
      }
      return updatedOrder;
    });

    return res.status(200).send({
      success: 1,
      message: "Order history fetched successfully",
      orders: updatedOrders,
    });
  } catch (error) {
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

//Get accepted orders
// Method: GET
// Endpoint: /vendor-order/accepted-orders
const getAcceptedOrders = async (req, res) => {
  try {
    const vendorId = req.user._id;

    // Fetch only accepted orders (status === "1") that are either:
    // - single item (items array length = 1)
    // - bulk item (at least one item with quantity > 1)
    const acceptedOrders = await FoodOrder.find({
      vendorId: vendorId,
      status: "1", // Make sure this matches exactly how status is stored (string or number)
      $or: [
        { items: { $size: 1 } },
        { "items.quantity": { $gt: 1 } },
      ],
    })
      .populate("userId")
      .populate("items.FoodItem");

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
// Endpoint: /vendor-order/assign-driver/:id
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
    });

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



module.exports = { getFoodOrder, changeOrderStatus, getOrder,orderHistory, getAcceptedOrders,assignDriverToOrder,getOrderWithDriver,getOnlineDrivers };
