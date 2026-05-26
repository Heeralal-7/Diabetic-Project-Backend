// routes/userCancellation.js
const express = require('express');
const router = express.Router();
const FoodOrder = require('../../../modal/foodOrder');
const OrderPharmacy = require('../../../modal/OrderPharmacy'); 
const Appointment = require('../../../modal/Appointment');
const CancellationSettings = require('../../../modal/CancellationSettings');
const { middlewere } = require('../../../middleware/auth');

// ✅ User requests cancellation
// 
// End point: /user-cancel-charge/cancel-order
router.post('/cancel-order', middlewere, async (req, res) => {
  try {
    const { orderId, orderType, cancellationReason } = req.body;
    const userId = req.user._id;
    
    if (!orderId || !orderType) {
      return res.status(400).json({
        success: false,
        message: "Order ID and type are required"
      });
    }

    // Get order with user check
    let order;
    let orderModel;
    switch (orderType) {
      case 'food':
        order = await FoodOrder.findOne({ _id: orderId, userId });
        orderModel = FoodOrder;
        break;
      case 'pharmacy':
        order = await OrderPharmacy.findOne({ _id: orderId, userId });
        orderModel = OrderPharmacy;
        break;
      case 'lab':
      case 'doctor':
        order = await Appointment.findOne({ _id: orderId, userId });
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

    // Get cancellation settings
    const settings = await CancellationSettings.findOne();
    const serviceSettings = settings[orderType];
    
    const orderAmount = getOrderPrice(order, orderType);
    const currentStatus = order.status || order.orderStatus || '0';
    
    let cancellationCharge = 0;
    let chargeApplicable = false;
    
    // Apply charge only if:
    // 1. Service is enabled
    // 2. Order status is 1 or above
    if (serviceSettings?.enabled && parseInt(currentStatus) >= parseInt(serviceSettings.applyAfterStatus || '1')) {
      chargeApplicable = true;
      
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
    order.cancellationReason = cancellationReason || 'Cancelled by user';
    order.cancelledAt = new Date();
    order.refundAmount = refundAmount;
    
    // Update status based on order type
     if (orderType === 'pharmacy') {
      order.orderStatus = 'cancelled';
      order.status = 9; // Pharmacy Status
    } else if (orderType === 'food') {
      order.status = '8'; // Food Status
    } else if (orderType === 'doctor' || orderType === 'lab') {
      // Kyunki Schema same hai, hum 'serviceType' check karenge
      // Agar serviceType 'Lab Test' hai toh 5, warna Doctor hai toh 4
      if (order.serviceType === 'Lab Test') {
         order.status = '10'; // Lab Status
      } else {
         order.status = '4'; // Doctor Status
      }
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
        chargeApplicable,
        note: chargeApplicable 
          ? `Cancellation charge of ₹${cancellationCharge} applied`
          : 'No cancellation charge applied'
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// ✅ Check cancellation charge before cancelling
// End point: /user-cancel-charge/check-cancellation-charge
router.post('/check-cancellation-charge', middlewere, async (req, res) => {
  try {
    const { orderId, orderType } = req.body;
    const userId = req.user._id;
    
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
        order = await FoodOrder.findOne({ _id: orderId, userId });
        break;
      case 'pharmacy':
        order = await OrderPharmacy.findOne({ _id: orderId, userId });
        break;
      case 'lab':
      case 'doctor':
        order = await Appointment.findOne({ _id: orderId, userId });
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
    
    const orderAmount = getOrderPrice(order, orderType);
    const currentStatus = order.status || order.orderStatus || '0';
    
    let cancellationCharge = 0;
    let chargeApplicable = false;
    let message = "";
    
    if (!serviceSettings?.enabled) {
      message = "Cancellation charges are disabled for this service";
    } else if (currentStatus === '0' || currentStatus === 0 || currentStatus === 'pending') {
      message = "No charge for pending orders";
    } else if (parseInt(currentStatus) >= parseInt(serviceSettings.applyAfterStatus || '1')) {
      chargeApplicable = true;
      
      if (serviceSettings.chargeType === 'percentage') {
        cancellationCharge = (orderAmount * serviceSettings.percentage) / 100;
        message = `${serviceSettings.percentage}% charge will be applied`;
      } else {
        cancellationCharge = serviceSettings.fixedAmount;
        message = `Fixed charge of ₹${serviceSettings.fixedAmount} will be applied`;
      }
      
      if (cancellationCharge > orderAmount) {
        cancellationCharge = orderAmount;
      }
    } else {
      message = "No cancellation charge will be applied";
    }
    
    const refundAmount = orderAmount - cancellationCharge;

    res.json({
      success: true,
      message: "Cancellation charge calculated",
      data: {
        orderId,
        orderType,
        orderAmount,
        currentStatus,
        cancellationCharge,
        refundAmount,
        chargeApplicable,
        message,
        serviceSettings: {
          enabled: serviceSettings?.enabled,
          chargeType: serviceSettings?.chargeType,
          percentage: serviceSettings?.percentage,
          fixedAmount: serviceSettings?.fixedAmount,
          applyAfterStatus: serviceSettings?.applyAfterStatus
        }
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// ✅ Get user's cancelled orders
// End point: /user-cancel-charge/my-cancelled-orders
router.get('/my-cancelled-orders', middlewere, async (req, res) => {
  try {
    const { page = 1, limit = 10, orderType } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const userId = req.user._id;

    let orders = [];
    let total = 0;
    
    // Get cancelled orders based on type
    if (!orderType || orderType === 'food') {
      const foodOrders = await FoodOrder.find({ 
        userId, 
        cancellationStatus: 'cancelled' 
      })
      .populate('vendorId', 'name shopName')
      .sort({ cancelledAt: -1 })
      .skip(skip)
      .limit(limitNum);
      
      orders = [...orders, ...foodOrders.map(o => ({ 
        ...o.toObject(), 
        orderType: 'food' 
      }))];
      total += await FoodOrder.countDocuments({ 
        userId, 
        cancellationStatus: 'cancelled' 
      });
    }
    
    if (!orderType || orderType === 'pharmacy') {
      const pharmacyOrders = await OrderPharmacy.find({ 
        userId, 
        cancellationStatus: 'cancelled' 
      })
      .populate('vendorId', 'name shopName')
      .sort({ cancelledAt: -1 })
      .skip(skip)
      .limit(limitNum);
      
      orders = [...orders, ...pharmacyOrders.map(o => ({ 
        ...o.toObject(), 
        orderType: 'pharmacy' 
      }))];
      total += await OrderPharmacy.countDocuments({ 
        userId, 
        cancellationStatus: 'cancelled' 
      });
    }
    
    if (!orderType || orderType === 'doctor' || orderType === 'lab') {
      const appointmentQuery = { 
        userId, 
        cancellationStatus: 'cancelled' 
      };
      
      if (orderType === 'doctor') {
        appointmentQuery.serviceType = { $regex: /doctor/i };
      } else if (orderType === 'lab') {
        appointmentQuery.serviceType = 'Lab Test';
      }
      
      const appointments = await Appointment.find(appointmentQuery)
        .populate('doctorId', 'name')
        .populate('vendorId', 'name labName')
        .sort({ cancelledAt: -1 })
        .skip(skip)
        .limit(limitNum);
      
      orders = [...orders, ...appointments.map(o => ({ 
        ...o.toObject(), 
        orderType: o.serviceType === 'Lab Test' ? 'lab' : 'doctor' 
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

// Helper function to get order price
function getOrderPrice(order, orderType) {
  switch (orderType) {
    case 'food':
      return parseFloat(order.price || 0);
    case 'pharmacy':
      return parseFloat(order.grandTotal || 0);
    case 'lab':
    case 'doctor':
      return parseFloat(order.price || 0);
    default:
      return 0;
  }
}

// ✅ Submit refund beneficiary details
// End point: /user-cancel-charge/submit-refund-details
router.post('/submit-refund-details', async (req, res) => {
  try {
    const { orderId, orderType, mode, bankDetails } = req.body;
    
    // mode: 'bank' or 'upi'
    // bankDetails: { accountNumber, ifsc, accountHolderName, bankName } OR { upiId }

    let OrderModel;
    switch (orderType) {
      case 'food': OrderModel = FoodOrder; break;
      case 'pharmacy': OrderModel = OrderPharmacy; break;
      case 'lab': OrderModel = Appointment; break;
      case 'doctor': OrderModel = Appointment; break;
      default: return res.status(400).json({ success: false, message: "Invalid Type" });
    }

    const order = await OrderModel.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Validate Status
    if (order.cancellationStatus !== 'cancelled') {
      return res.status(400).json({ success: false, message: "Order must be cancelled first" });
    }
    if (order.refundStatus === 'completed') {
      return res.status(400).json({ success: false, message: "Refund already processed" });
    }

    // Save Details
    order.refundBeneficiaryDetails = {
        mode: mode,
        ...bankDetails
    };

    await order.save();

    res.json({ success: true, message: "Refund details saved successfully. Admin will process it shortly." });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;