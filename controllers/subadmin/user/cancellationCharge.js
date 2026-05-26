const FoodOrder = require("../../../modal/foodOrder");
const OrderPharmacy = require("../../../modal/OrderPharmacy");
const Appointment = require("../../../modal/Appointment");
const CancellationSettings = require("../../../modal/CancellationSettings");

// =============================================
// HELPER FUNCTION FOR CANCELLATION PERMISSION CHECKING
// =============================================
const checkCancellationPermission = (subAdmin, permissionType) => {
  if (!subAdmin) {
    return {
      allowed: false,
      message: "Sub-admin not authenticated"
    };
  }

  // Check for cancellation-specific permissions
  if (subAdmin.permissions?.cancellation?.[permissionType]) {
    return { allowed: true };
  }

  // OR check for general order permissions
  if (subAdmin.permissions?.orders?.[permissionType]) {
    return { allowed: true };
  }

  // OR check for general booking permissions
  if (subAdmin.permissions?.booking?.[permissionType]) {
    return { allowed: true };
  }

  // OR check for general users permissions (since user cancellations)
  if (subAdmin.permissions?.users?.[permissionType]) {
    return { allowed: true };
  }

  return {
    allowed: false,
    message: `No permission to ${permissionType} cancellation requests`
  };
};

// =============================================
// ✅ SUBADMIN - VIEW CANCELLATION REQUESTS
// Endpoint: /subadmin-cancellation/cancellation-requests
// =============================================
const getCancellationRequests = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCancellationPermission(subAdmin, 'view');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to view cancellation requests"
        });
      }
    }

    const { 
      page = 1, 
      limit = 10, 
      orderType, 
      status = 'pending',
      fromDate,
      toDate 
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Date filter
    let dateFilter = {};
    if (fromDate || toDate) {
      dateFilter.createdAt = {};
      if (fromDate) {
        dateFilter.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        dateFilter.createdAt.$lte = new Date(toDate);
      }
    }

    let requests = [];
    let total = 0;
    
    // Get cancellation requests based on type
    if (!orderType || orderType === 'food') {
      const foodQuery = { cancellationStatus: 'cancelled', ...dateFilter };
      const foodRequests = await FoodOrder.find(foodQuery)
        .populate('userId', 'name email phone')
        .populate('vendorId', 'name shopName')
        .sort({ cancelledAt: -1 })
        .skip(skip)
        .limit(limitNum);
      
      requests = [...requests, ...foodRequests.map(o => ({
        ...o.toObject(),
        orderType: 'food',
        requestType: 'user_cancellation'
      }))];
      total += await FoodOrder.countDocuments(foodQuery);
    }
    
    if (!orderType || orderType === 'pharmacy') {
      const pharmacyQuery = { cancellationStatus: 'cancelled', ...dateFilter };
      const pharmacyRequests = await OrderPharmacy.find(pharmacyQuery)
        .populate('userId', 'name email phone')
        .populate('vendorId', 'name shopName')
        .sort({ cancelledAt: -1 })
        .skip(skip)
        .limit(limitNum);
      
      requests = [...requests, ...pharmacyRequests.map(o => ({
        ...o.toObject(),
        orderType: 'pharmacy',
        requestType: 'user_cancellation'
      }))];
      total += await OrderPharmacy.countDocuments(pharmacyQuery);
    }
    
    if (!orderType || orderType === 'doctor' || orderType === 'lab') {
      const appointmentQuery = { cancellationStatus: 'cancelled', ...dateFilter };
      
      if (orderType === 'doctor') {
        appointmentQuery.serviceType = { $regex: /doctor/i };
      } else if (orderType === 'lab') {
        appointmentQuery.serviceType = 'Lab Test';
      }
      
      const appointmentRequests = await Appointment.find(appointmentQuery)
        .populate('userId', 'name email phone')
        .populate('doctorId', 'name')
        .populate('vendorId', 'name labName')
        .sort({ cancelledAt: -1 })
        .skip(skip)
        .limit(limitNum);
      
      requests = [...requests, ...appointmentRequests.map(o => ({
        ...o.toObject(),
        orderType: o.serviceType === 'Lab Test' ? 'lab' : 'doctor',
        requestType: 'user_cancellation'
      }))];
      total += await Appointment.countDocuments(appointmentQuery);
    }

    // Sort all requests by cancelled date
    requests.sort((a, b) => new Date(b.cancelledAt) - new Date(a.cancelledAt))
           .slice(0, limitNum);

    // Calculate summary
    const totalCharges = requests.reduce((sum, order) => sum + (order.cancellationCharge || 0), 0);
    const totalRefunds = requests.reduce((sum, order) => sum + (order.refundAmount || 0), 0);

    res.json({
      success: true,
      message: "Cancellation requests fetched successfully",
      data: requests,
      summary: {
        totalRequests: total,
        totalCharges,
        totalRefunds
      },
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        total
      },
      subAdminInfo: {
        id: subAdmin?._id,
        name: subAdmin?.name,
        permissions: subAdmin?.permissions?.cancellation
      }
    });

  } catch (error) {
    console.error('Get Cancellation Requests Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================
// ✅ SUBADMIN - VIEW CANCELLATION SETTINGS
// Endpoint: /subadmin-cancellation/cancellation-settings
// =============================================
const getCancellationSettings = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCancellationPermission(subAdmin, 'view');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to view cancellation settings"
        });
      }
    }

    const settings = await CancellationSettings.findOne();

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Cancellation settings not found"
      });
    }

    res.json({
      success: true,
      message: "Cancellation settings fetched successfully",
      data: settings,
      subAdminPermissions: subAdmin?.permissions?.cancellation
    });

  } catch (error) {
    console.error('Get Cancellation Settings Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================
// ✅ SUBADMIN - UPDATE CANCELLATION SETTINGS
// Endpoint: /subadmin-cancellation/update-settings
// =============================================
const updateCancellationSettings = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCancellationPermission(subAdmin, 'edit');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to update cancellation settings"
        });
      }
    }

    const updateData = {
      ...req.body,
      updatedBy: subAdmin?._id || req.admin?._id,
      updatedByRole: subAdmin ? 'subadmin' : 'admin',
      updatedAt: new Date()
    };

    let settings = await CancellationSettings.findOne();

    if (!settings) {
      // Create new settings if not exists
      settings = await CancellationSettings.create({
        ...updateData,
        createdBy: subAdmin?._id || req.admin?._id,
        createdByRole: subAdmin ? 'subadmin' : 'admin',
        createdAt: new Date()
      });
    } else {
      // Update existing settings
      settings = await CancellationSettings.findOneAndUpdate(
        {},
        updateData,
        {
          new: true,
          runValidators: true
        }
      );
    }

    if (!settings) {
      return res.status(500).json({
        success: false,
        message: "Failed to update cancellation settings"
      });
    }

    res.json({
      success: true,
      message: "Cancellation settings updated successfully",
      data: {
        id: settings._id,
        updatedBy: updateData.updatedBy,
        updatedByRole: updateData.updatedByRole,
        updatedAt: updateData.updatedAt,
        updatedFields: Object.keys(req.body)
      }
    });

  } catch (error) {
    console.error('Update Cancellation Settings Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================
// ✅ SUBADMIN - CANCEL ORDER (Admin-initiated cancellation)
// Endpoint: /subadmin-cancellation/cancel-order
// =============================================
const adminCancelOrder = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCancellationPermission(subAdmin, 'create');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to cancel orders"
        });
      }
    }

    const { orderId, orderType, cancellationReason, applyCharge = true } = req.body;
    
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
        order = await FoodOrder.findOne({ _id: orderId });
        orderModel = FoodOrder;
        break;
      case 'pharmacy':
        order = await OrderPharmacy.findOne({ _id: orderId });
        orderModel = OrderPharmacy;
        break;
      case 'lab':
      case 'doctor':
        order = await Appointment.findOne({ _id: orderId });
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
    
    // Apply charge if requested and applicable
    if (applyCharge && serviceSettings?.enabled && parseInt(currentStatus) >= parseInt(serviceSettings.applyAfterStatus || '1')) {
      chargeApplicable = true;
      
      if (serviceSettings.chargeType === 'percentage') {
        cancellationCharge = (orderAmount * serviceSettings.percentage) / 100;
      } else if (serviceSettings.chargeType === 'fixed') {
        cancellationCharge = serviceSettings.fixedAmount;
      }
      
      if (cancellationCharge > orderAmount) {
        cancellationCharge = orderAmount;
      }
    }
    
    const refundAmount = orderAmount - cancellationCharge;

    // Update order with admin info
    order.cancellationStatus = 'cancelled';
    order.cancellationCharge = cancellationCharge;
    order.cancellationReason = cancellationReason || `Cancelled by ${subAdmin ? 'subadmin' : 'admin'}`;
    order.cancelledAt = new Date();
    order.cancelledBy = subAdmin?._id || req.admin?._id;
    order.cancelledByRole = subAdmin ? 'subadmin' : 'admin';
    order.refundAmount = refundAmount;
    
    // Update status based on order type
    if (orderType === 'pharmacy') {
      order.orderStatus = 'cancelled';
      order.status = '6';
    } else if (orderType === 'food') {
      order.status = '3';
    } else if (orderType === 'doctor' || orderType === 'lab') {
      order.status = '3';
    }
    
    await order.save();

    res.json({
      success: true,
      message: "Order cancelled successfully by admin",
      data: {
        orderId,
        orderType,
        orderAmount,
        cancellationCharge,
        refundAmount,
        chargeApplicable,
        cancelledBy: {
          id: subAdmin?._id || req.admin?._id,
          role: subAdmin ? 'subadmin' : 'admin',
          name: subAdmin?.name || req.admin?.name
        },
        note: chargeApplicable 
          ? `Cancellation charge of ₹${cancellationCharge} applied`
          : 'No cancellation charge applied'
      }
    });

  } catch (error) {
    console.error('Admin Cancel Order Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================
// ✅ SUBADMIN - GET CANCELLATION ANALYTICS
// Endpoint: /subadmin-cancellation/analytics
// =============================================
const getCancellationAnalytics = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCancellationPermission(subAdmin, 'view');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to view analytics"
        });
      }
    }

    const { period = 'month', startDate, endDate } = req.query;
    
    // Set date range
    let dateRange = {};
    const now = new Date();
    
    if (startDate && endDate) {
      dateRange.startDate = new Date(startDate);
      dateRange.endDate = new Date(endDate);
    } else {
      switch (period) {
        case 'day':
          dateRange.startDate = new Date(now.setHours(0, 0, 0, 0));
          dateRange.endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        case 'week':
          dateRange.startDate = new Date(now.setDate(now.getDate() - 7));
          dateRange.endDate = new Date();
          break;
        case 'month':
          dateRange.startDate = new Date(now.setMonth(now.getMonth() - 1));
          dateRange.endDate = new Date();
          break;
        case 'year':
          dateRange.startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          dateRange.endDate = new Date();
          break;
        default:
          dateRange.startDate = new Date(now.setMonth(now.getMonth() - 1));
          dateRange.endDate = new Date();
      }
    }

    // Get analytics for each order type
    const analytics = {};

    // Food orders analytics
    const foodCancellations = await FoodOrder.aggregate([
      {
        $match: {
          cancellationStatus: 'cancelled',
          cancelledAt: {
            $gte: dateRange.startDate,
            $lte: dateRange.endDate
          }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalCharges: { $sum: '$cancellationCharge' },
          totalRefunds: { $sum: '$refundAmount' },
          averageCharge: { $avg: '$cancellationCharge' }
        }
      }
    ]);

    analytics.food = foodCancellations[0] || {
      count: 0,
      totalCharges: 0,
      totalRefunds: 0,
      averageCharge: 0
    };

    // Pharmacy orders analytics
    const pharmacyCancellations = await OrderPharmacy.aggregate([
      {
        $match: {
          cancellationStatus: 'cancelled',
          cancelledAt: {
            $gte: dateRange.startDate,
            $lte: dateRange.endDate
          }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalCharges: { $sum: '$cancellationCharge' },
          totalRefunds: { $sum: '$refundAmount' },
          averageCharge: { $avg: '$cancellationCharge' }
        }
      }
    ]);

    analytics.pharmacy = pharmacyCancellations[0] || {
      count: 0,
      totalCharges: 0,
      totalRefunds: 0,
      averageCharge: 0
    };

    // Appointment analytics
    const appointmentCancellations = await Appointment.aggregate([
      {
        $match: {
          cancellationStatus: 'cancelled',
          cancelledAt: {
            $gte: dateRange.startDate,
            $lte: dateRange.endDate
          }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalCharges: { $sum: '$cancellationCharge' },
          totalRefunds: { $sum: '$refundAmount' },
          averageCharge: { $avg: '$cancellationCharge' }
        }
      }
    ]);

    analytics.appointment = appointmentCancellations[0] || {
      count: 0,
      totalCharges: 0,
      totalRefunds: 0,
      averageCharge: 0
    };

    // Calculate totals
    analytics.total = {
      count: analytics.food.count + analytics.pharmacy.count + analytics.appointment.count,
      totalCharges: analytics.food.totalCharges + analytics.pharmacy.totalCharges + analytics.appointment.totalCharges,
      totalRefunds: analytics.food.totalRefunds + analytics.pharmacy.totalRefunds + analytics.appointment.totalRefunds,
      averageCharge: analytics.food.averageCharge + analytics.pharmacy.averageCharge + analytics.appointment.averageCharge
    };

    // Get top cancellation reasons
    const topReasons = await FoodOrder.aggregate([
      {
        $match: {
          cancellationStatus: 'cancelled',
          cancellationReason: { $exists: true, $ne: '' },
          cancelledAt: {
            $gte: dateRange.startDate,
            $lte: dateRange.endDate
          }
        }
      },
      {
        $group: {
          _id: '$cancellationReason',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      message: "Cancellation analytics fetched successfully",
      data: {
        analytics,
        topReasons,
        dateRange,
        period
      },
      subAdminInfo: {
        id: subAdmin?._id,
        name: subAdmin?.name
      }
    });

  } catch (error) {
    console.error('Get Cancellation Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================
// HELPER FUNCTION TO GET ORDER PRICE
// =============================================
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

// =============================================
// EXPORT ALL FUNCTIONS
// =============================================
module.exports = {
  getCancellationRequests,
  getCancellationSettings,
  updateCancellationSettings,
  adminCancelOrder,
  getCancellationAnalytics
};