// routes/admin.js mein yeh routes add karein

const CancellationSettings = require('../../../modal/CancellationSettings');
const express = require('express');
const router = express.Router();
const FoodOrder = require('../../../modal/foodOrder');
const OrderPharmacy = require('../../../modal/OrderPharmacy'); 
const Appointment = require('../../../modal/Appointment');
const { adminMiddleware } = require('../../../middleware/auth');

// ✅ 1. Get cancellation settings
// End point: /admin-cancel-charge/cancellation-settings
router.get('/cancellation-settings', adminMiddleware, async (req, res) => {
  try {
    let settings = await CancellationSettings.findOne();
    
    if (!settings) {
      // Create default settings if not exists
      settings = await CancellationSettings.create({});
    }
    
    res.json({
      success: true,
      message: "Cancellation settings fetched",
      data: settings
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// ✅ 2. Update cancellation settings
router.put('/cancellation-settings', adminMiddleware, async (req, res) => {
  try {
    const { food, pharmacy, lab, doctor } = req.body;

    const settings = await CancellationSettings.findOneAndUpdate(
      {},
      { 
        food,
        pharmacy,
        lab,
        doctor,
        updatedAt: new Date()
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Cancellation settings updated",
      data: settings
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// ✅ 3. Calculate cancellation charge for an order
router.post('/calculate-cancellation-charge', adminMiddleware, async (req, res) => {
  try {
    const { orderId, orderType } = req.body;
    
    if (!orderId || !orderType) {
      return res.status(400).json({
        success: false,
        message: "Order ID and type are required"
      });
    }

    // Get order
    let order;
    switch (orderType) {
      case 'food':
        order = await FoodOrder.findById(orderId);
        break;
      case 'pharmacy':
        order = await OrderPharmacy.findById(orderId);
        break;
      case 'lab':
      case 'doctor':
        order = await Appointment.findById(orderId);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid order type"
        });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check if already cancelled
    if (order.cancellationStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled"
      });
    }

    // Get cancellation settings
    const settings = await CancellationSettings.findOne();
    const serviceSettings = settings[orderType];
    
    if (!serviceSettings?.enabled) {
      return res.json({
        success: true,
        message: "No cancellation charge",
        data: {
          chargeApplicable: false,
          cancellationCharge: 0,
          refundAmount: getOrderPrice(order, orderType),
          reason: "Cancellation charges disabled for this service"
        }
      });
    }

    // Get order amount and status
    const orderAmount = getOrderPrice(order, orderType);
    const currentStatus = order.status || order.orderStatus || '0';
    
    // Check if order is pending (status 0)
    if (currentStatus === '0' || currentStatus === 0 || currentStatus === 'pending') {
      return res.json({
        success: true,
        message: "No charge for pending orders",
        data: {
          chargeApplicable: false,
          cancellationCharge: 0,
          refundAmount: orderAmount,
          reason: "Order is still pending"
        }
      });
    }

    // Check if order status is 1 or above
    const applyAfterStatus = serviceSettings.applyAfterStatus || '1';
    if (parseInt(currentStatus) < parseInt(applyAfterStatus)) {
      return res.json({
        success: true,
        message: "No charge for early cancellation",
        data: {
          chargeApplicable: false,
          cancellationCharge: 0,
          refundAmount: orderAmount,
          reason: `Order status (${currentStatus}) is below threshold`
        }
      });
    }

    // Calculate charge
    let cancellationCharge = 0;
    
    if (serviceSettings.chargeType === 'percentage') {
      cancellationCharge = (orderAmount * serviceSettings.percentage) / 100;
    } else if (serviceSettings.chargeType === 'fixed') {
      cancellationCharge = serviceSettings.fixedAmount;
    }
    
    // Ensure charge doesn't exceed order amount
    if (cancellationCharge > orderAmount) {
      cancellationCharge = orderAmount;
    }
    
    const refundAmount = orderAmount - cancellationCharge;

    res.json({
      success: true,
      message: "Cancellation charge calculated",
      data: {
        chargeApplicable: true,
        orderAmount,
        cancellationCharge,
        refundAmount,
        chargeType: serviceSettings.chargeType,
        percentage: serviceSettings.percentage,
        fixedAmount: serviceSettings.fixedAmount,
        orderStatus: currentStatus
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// ✅ 4. Cancel order (Admin)
router.post('/cancel-order', adminMiddleware, async (req, res) => {
  try {
    const { orderId, orderType, cancellationReason } = req.body;
    
    if (!orderId || !orderType) {
      return res.status(400).json({
        success: false,
        message: "Order ID and type are required"
      });
    }

    // Get order
    let order;
    let orderModel;
    switch (orderType) {
      case 'food':
        order = await FoodOrder.findById(orderId);
        orderModel = FoodOrder;
        break;
      case 'pharmacy':
        order = await OrderPharmacy.findById(orderId);
        orderModel = OrderPharmacy;
        break;
      case 'lab':
      case 'doctor':
        order = await Appointment.findById(orderId);
        orderModel = Appointment;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid order type"
        });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check if already cancelled
    if (order.cancellationStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled"
      });
    }

    // Calculate cancellation charge
    const settings = await CancellationSettings.findOne();
    const serviceSettings = settings[orderType];
    
    const orderAmount = getOrderPrice(order, orderType);
    const currentStatus = order.status || order.orderStatus || '0';
    
    let cancellationCharge = 0;
    
    // Only apply charge if order status is 1 or above AND service is enabled
    if (serviceSettings?.enabled && parseInt(currentStatus) >= parseInt(serviceSettings.applyAfterStatus || '1')) {
      if (serviceSettings.chargeType === 'percentage') {
        cancellationCharge = (orderAmount * serviceSettings.percentage) / 100;
      } else if (serviceSettings.chargeType === 'fixed') {
        cancellationCharge = serviceSettings.fixedAmount;
      }
      
      // Ensure charge doesn't exceed order amount
      if (cancellationCharge > orderAmount) {
        cancellationCharge = orderAmount;
      }
    }
    
    const refundAmount = orderAmount - cancellationCharge;

    // Update order
    order.cancellationStatus = 'cancelled';
    order.cancellationCharge = cancellationCharge;
    order.cancellationReason = cancellationReason || 'Cancelled by admin';
    order.cancelledAt = new Date();
    order.refundAmount = refundAmount;
    
    // Update order status to cancelled
    if (orderType === 'pharmacy') {
      order.orderStatus = 'cancelled';
    } else {
      order.status = '3'; // Status 3 for cancelled
    }
    
    await order.save();

    res.json({
      success: true,
      message: "Order cancelled successfully",
      data: {
        orderId,
        orderType,
        orderAmount,
        cancellationCharge,
        refundAmount,
        orderStatus: currentStatus,
        cancelledAt: order.cancelledAt
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// ✅ 5. Get cancelled orders
router.get('/cancelled-orders', adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, orderType } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = { cancellationStatus: 'cancelled' };
    
    // Get cancelled orders
    let orders = [];
    let total = 0;
    
    if (!orderType || orderType === 'food') {
      const foodOrders = await FoodOrder.find(query)
        .populate('userId', 'name phone')
        .populate('vendorId', 'name shopName')
        .sort({ cancelledAt: -1 })
        .skip(skip)
        .limit(limitNum);
      
      orders = [...orders, ...foodOrders.map(o => ({ ...o.toObject(), orderType: 'food' }))];
      total += await FoodOrder.countDocuments(query);
    }
    
    if (!orderType || orderType === 'pharmacy') {
      const pharmacyOrders = await OrderPharmacy.find(query)
        .populate('userId', 'name phone')
        .populate('items.vendorId', 'name shopName')
        .sort({ cancelledAt: -1 })
        .skip(skip)
        .limit(limitNum);
      
      orders = [...orders, ...pharmacyOrders.map(o => ({ ...o.toObject(), orderType: 'pharmacy' }))];
      total += await OrderPharmacy.countDocuments(query);
    }
    
    if (!orderType || orderType === 'doctor' || orderType === 'lab') {
      const appointmentQuery = { ...query };
      if (orderType === 'doctor') {
        appointmentQuery.serviceType = { $regex: /doctor/i };
      } else if (orderType === 'lab') {
        appointmentQuery.$or = [
          { serviceType: 'lab' },
          { serviceType: 'Lab Test' }
        ];
      }
      
      const appointments = await Appointment.find(appointmentQuery)
        .populate('userId', 'name phone')
        .populate('doctorId', 'name')
        .populate('vendorId', 'name labName')
        .sort({ cancelledAt: -1 })
        .skip(skip)
        .limit(limitNum);
      
      orders = [...orders, ...appointments.map(o => ({ 
        ...o.toObject(), 
        orderType: orderType === 'lab' ? 'lab' : 'doctor' 
      }))];
      total += await Appointment.countDocuments(appointmentQuery);
    }

    // Sort all orders by cancelled date
    orders.sort((a, b) => new Date(b.cancelledAt) - new Date(a.cancelledAt))
          .slice(0, limitNum);

    // Calculate summary
    const totalCharges = orders.reduce((sum, order) => sum + (order.cancellationCharge || 0), 0);
    const totalRefunds = orders.reduce((sum, order) => sum + (order.refundAmount || 0), 0);

    res.json({
      success: true,
      message: "Cancelled orders fetched",
      data: orders,
      summary: {
        totalCancelled: total,
        totalCharges,
        totalRefunds
      },
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        total
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});
module.exports = router;
