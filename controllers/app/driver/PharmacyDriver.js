const Order = require('../../../modal/OrderPharmacy'); // Assuming you have an Order model
const Driver = require('../../../modal/driver'); // Assuming you have a Driver model
 
// Get orders assigned to driver
// Method: GET
// Endpoint: /driver-pharmacy/assigned-orders
// Get orders assigned to driver
// Method: GET
// Endpoint: /driver-pharmacy/assigned-orders
const getAssignedOrders = async (req, res) => {
  try {
    // Verify driver exists and is authenticated
    const driver = await Driver.findById(req.user._id);
    if (!driver) {
      return res.send({
        success: 0,
        message: "Driver not authenticated",
      });
    }
 
    // Find all orders assigned to this driver with status "2" (assigned)
    const orders = await Order.find({
      driverAssignedId: req.user._id,
      status: 2 // Only show orders with status exactly 2
    })
    .populate("userId") // user details
    .populate("items.productId", "name brand") // pharmacy product details
    .populate("driverAssignedId", "name phone") // driver details
    .sort({ createdAt: -1 }); // newest first
 
    if (orders.length === 0) {
      return res.send({
        success: 1,
        message: "No orders assigned to you currently",
        details: []
      });
    }
 
    return res.send({
      success: 1,
      message: "Assigned orders fetched successfully",
      details: orders
    });
 
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};
 
// Method: PATCH
// Endpoint: /driver-pharmacy/driver-assign-reject/:orderId
const driverAssignReject = async (req, res) => {
    try {
      const { orderId } = req.params;
  
      const driver = await Driver.findById(req.user._id);
      if (!driver) {
        return res.status(401).send({ success: 0, message: "Driver not authenticated" });
      }
  
      const order = await Order.findOne({ _id: orderId, driverAssignedId: req.user._id });
      if (!order) {
        return res.status(404).send({ success: 0, message: "Order not found or not assigned to you" });
      }
  
      order.status = 1;
      order.driverAssignedId = null;
      await order.save();
  
      driver.isBusy = false;
      await driver.save();
  
      return res.status(200).send({ success: 1, message: "Order rejected successfully", details: order });
    } catch (error) {
      return res.status(500).send({ success: 0, message: error.message });
    }
  };
  
 
// Update order status (for driver to mark as picked or delivered)
// Method: PATCH
// Endpoint: /driver-pharmacy/start-order/:orderId
const startOrder = async (req, res) => {
    try {
      const { orderId } = req.params;
      const driver = await Driver.findById(req.user._id);
      if (!driver) return res.status(401).send({ success: 0, message: "Driver not authenticated" });
  
      const order = await Order.findOne({ _id: orderId, driverAssignedId: req.user._id });
      if (!order) return res.status(404).send({ success: 0, message: "Order not found or not assigned to you" });
  
      order.status = 3;
      await order.save();
  
      return res.status(200).send({ success: 1, message: "Order started", details: order });
    } catch (error) {
      return res.status(500).send({ success: 0, message: error.message });
    }
  };
  
 
// Get all orders assigned to driver
// Method: PATCH
// Endpoint: /driver-pharmacy/arrived-order/:orderId
const arrivedOrder = async (req, res) => {
    try {
      const { orderId } = req.query;
      const order = await Order.findOne({ _id: orderId, driverAssignedId: req.user._id });
      if (!order) return res.status(404).send({ success: 0, message: "Order not found or not assigned to you" });
  
      order.status = 4;
      await order.save();
  
      return res.status(200).send({ success: 1, message: "Driver marked as arrived", details: order });
    } catch (error) {
      return res.status(500).send({ success: 0, message: error.message });
    }
  };
  
 
// Get all orders assigned to driver
// Method: GET
// Endpoint: /driver-pharmacy/order-delivered/:orderId
const markAsDelivered = async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await Order.findOne({ _id: orderId, driverAssignedId: req.user._id });
      if (!order) return res.status(404).send({ success: 0, message: "Order not found" });
  
      order.status = 5;
      order.deliveryOtp = undefined;
      await order.save();
  
      const driver = await Driver.findById(req.user._id);
      if (driver) {
        driver.isBusy = false;
        await driver.save();
      }
  
      return res.status(200).send({ success: 1, message: "Order marked as delivered", details: order });
    } catch (error) {
      return res.status(500).send({ success: 0, message: error.message });
    }
  };
  
 
// Get all orders assigned to driver
// Method: PATCH
// Endpoint: /driver-pharmacy/reject-order/:orderId
const rejectOrder = async (req, res) => {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;
  
      if (!reason) return res.status(400).send({ success: 0, message: "Rejection reason is required" });
  
      const order = await Order.findOne({ _id: orderId, driverAssignedId: req.user._id });
      if (!order) return res.status(404).send({ success: 0, message: "Order not found or not assigned to you" });
  
      order.status = 6;
      order.rejectionReason = reason;
      await order.save();
  
      const driver = await Driver.findById(req.user._id);
      if (driver) {
        driver.isBusy = false;
        await driver.save();
      }
  
      return res.status(200).send({ success: 1, message: "Order marked as rejected/returned", details: order });
    } catch (error) {
      return res.status(500).send({ success: 0, message: error.message });
    }
  };
 
 
 
 
// Get order history for driver
// Method: GET
// Endpoint: /driver-pharmacy/order-history
 
const orderHistory = async (req, res) => {
    try {
      const driverId = req.user._id;
  
      const orders = await Order.find({
        driverAssignedId: driverId,
        status: { $in: [5, 6] },
      })
        .populate("userId", "name phone email")
        .populate("items.productId", "name brand description")
        .populate("driverAssignedId", "name phone vehicleNumber")
        .sort({ updatedAt: -1 });
  
      const formattedOrders = orders.map(order => ({
        _id: order._id,
        orderId: order.orderId,
        status: order.status,
        statusText: order.status === 5 ? "Delivered" : "Rejected",
        totalAmount: order.totalAmount,
        deliveryAddress: order.deliveryAddress,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        rejectionReason: order.rejectionReason || null,
        user: order.userId,
        driver: order.driverAssignedId,
        items: order.items.map(item => ({
          product: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      }));
  
      return res.status(200).send({
        success: 1,
        message: "Order history fetched successfully",
        count: formattedOrders.length,
        details: formattedOrders
      });
    } catch (error) {
      return res.status(500).send({ success: 0, message: error.message });
    }
  };
  
 
module.exports = {
    getAssignedOrders,
    driverAssignReject,
    startOrder,
    arrivedOrder,
    markAsDelivered,
    rejectOrder,
    orderHistory
};
 
 