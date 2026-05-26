const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ==========================================
// 1. IMPORT MODELS
// ==========================================
const PayoutRequest = require('../../../modal/PayoutRequest');
const FoodOrder = require('../../../modal/foodOrder');
const OrderPharmacy = require('../../../modal/OrderPharmacy');
const Appointment = require('../../../modal/Appointment');

const Vendor = require('../../../modal/vandor');
const Doctor = require('../../../modal/docter'); 
const Clinic = require('../../../modal/clinic'); 
const CutoffSettings = require('../../../modal/CutoffSettings'); // ✅ Added CutoffSettings

// ==========================================
// 2. IMPORT MIDDLEWARES
// ==========================================
const { VendorMiddleware } = require('../../../middleware/auth'); 
const { doctorMiddleware } = require('../../../middleware/auth'); 
const { ClinicMiddleware } = require('../../../middleware/auth'); 

// ==========================================
// 3. DATE HELPER FUNCTIONS (Shared)
// ==========================================
const getSevenDaysAgoMidnight = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); 
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return sevenDaysAgo;
};

const isToday = (date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

const isThisWeek = (date) => {
  const today = new Date();
  const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
  return date >= firstDay;
};

const isThisMonth = (date) => {
  const today = new Date();
  return date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

const isThisYear = (date) => {
  const today = new Date();
  return date.getFullYear() === today.getFullYear();
};

// ==========================================
// 4. CUTOFF CALCULATION HELPER (Unified Logic)
// ==========================================
async function getCutoffSettings() {
    let settings = await CutoffSettings.findOne();
    if (!settings) {
        return {
            foodCutoff: 5,
            pharmacyCutoff: 5,
            labCutoff: 5,
            doctorCutoff: 5,
            clinicCutoff: 5,
            membershipCutoff: 10
        };
    }
    return settings;
}

const calculatePayout = (price, type, settings, isFreeConsultation = false) => {
    price = parseFloat(price) || 0;
    let cutoffPercentage = 5; // Default

    switch (type) {
        case 'food':
            cutoffPercentage = settings.foodCutoff || 5;
            break;
        case 'pharmacy':
            cutoffPercentage = settings.pharmacyCutoff || 5;
            break;
        case 'lab':
            cutoffPercentage = settings.labCutoff || 5;
            break;
        case 'doctor':
            // ✅ Free Consultation Logic: Use Membership Cutoff
            cutoffPercentage = isFreeConsultation ? (settings.membershipCutoff || 20) : (settings.doctorCutoff || 5);
            break;
        case 'clinic':
            // ✅ Free Consultation Logic: Use Membership Cutoff
            cutoffPercentage = isFreeConsultation ? (settings.membershipCutoff || 20) : (settings.clinicCutoff || 5);
            break;
        default:
            cutoffPercentage = 5;
    }

    const adminEarnings = (price * cutoffPercentage) / 100;
    const vendorPayout = price - adminEarnings;

    return {
        originalAmount: parseFloat(price.toFixed(2)),
        vendorPayout: parseFloat(vendorPayout.toFixed(2)),
        adminEarnings: parseFloat(adminEarnings.toFixed(2)),
        cutoffPercentage: parseFloat(cutoffPercentage)
    };
};

// ############################################################################
// # SECTION A: ORIGINAL VENDOR ROUTES (Food, Lab, Pharmacy) 
// ############################################################################

// #region 1. GET ELIGIBLE PAYOUTS (VENDOR)
router.get('/payout-eligible', VendorMiddleware, async (req, res) => {
  try {
    let authenticatedId = req.vendorId || req.user?._id;
    const { vendorId, type } = req.query; 

    if (!authenticatedId && vendorId) { authenticatedId = vendorId; }
    if (!authenticatedId || !type) {
        return res.status(400).json({ success: false, message: "Vendor ID and Type are required" });
    }

    const eligibilityDate = getSevenDaysAgoMidnight();
    const settings = await getCutoffSettings(); // ✅ Fetch current settings
    let eligibleOrders = [];
    let totalPayoutAmount = 0;

    // --- PHARMACY LOGIC ---
    if (type === 'pharmacy') {
      const orders = await OrderPharmacy.find({
        'items.vendorId': new mongoose.Types.ObjectId(authenticatedId),
        $or: [
            { status: 5 }, { status: '5' },
            { orderStatus: 'Delivered' }, { orderStatus: 'completed' }
        ],
        $or: [ { payoutStatus: 'pending' }, { payoutStatus: { $exists: false } }, { payoutStatus: null } ],
        vendorAcceptedAt: { $lt: eligibilityDate }
      });

      orders.forEach(order => {
         const price = parseFloat(order.grandTotal) || parseFloat(order.subTotal) || 0;
         // ✅ Calculate Dynamic Payout
         const calc = calculatePayout(price, 'pharmacy', settings);
         
         totalPayoutAmount += calc.vendorPayout;
         eligibleOrders.push({
          id: order._id,
          orderId: `PHARM-${order._id.toString().slice(-8).toUpperCase()}`,
          date: order.vendorAcceptedAt || order.createdAt,
          type: 'pharmacy',
          status: order.orderStatus,
          // ✅ Detailed Breakdown
          originalAmount: calc.originalAmount,
          cutoffPercentage: calc.cutoffPercentage,
          adminEarnings: calc.adminEarnings,
          payableAmount: calc.vendorPayout, // For display
          amount: calc.vendorPayout // Kept for backward compatibility
        });
      });
    }

    // --- FOOD LOGIC ---
    else if (type === 'food') {
      const orders = await FoodOrder.find({
        vendorId: new mongoose.Types.ObjectId(authenticatedId),
        status: { $in: ['5', '7', 'completed'] },
        $or: [ { payoutStatus: 'pending' }, { payoutStatus: { $exists: false } } ],
        vendorAcceptedAt: { $lt: eligibilityDate }
      });
      
      orders.forEach(order => {
        const price = parseFloat(order.finalprice || order.price) || 0;
        // ✅ Calculate Dynamic Payout
        const calc = calculatePayout(price, 'food', settings);

        totalPayoutAmount += calc.vendorPayout;
        eligibleOrders.push({
          id: order._id,
          orderId: `FOOD-${order._id.toString().slice(-8).toUpperCase()}`,
          date: order.vendorAcceptedAt || order.createdAt,
          type: 'food',
          // ✅ Detailed Breakdown
          originalAmount: calc.originalAmount,
          cutoffPercentage: calc.cutoffPercentage,
          adminEarnings: calc.adminEarnings,
          payableAmount: calc.vendorPayout,
          amount: calc.vendorPayout
        });
      });
    } 

    // --- LAB LOGIC ---
    else if (type === 'lab') {
      let query = {
        $or: [ { payoutStatus: 'pending' }, { payoutStatus: { $exists: false } }, { payoutStatus: null } ],
        vendorAcceptedAt: { $lt: eligibilityDate, $exists: true },
        status: { $in: ['1', '7', '8', 'completed'] },
        vendorId: new mongoose.Types.ObjectId(authenticatedId)
      };

      const orders = await Appointment.find(query);

      orders.forEach(order => {
         const price = parseFloat(order.price) || 0;
         // ✅ Calculate Dynamic Payout
         const calc = calculatePayout(price, 'lab', settings);

         totalPayoutAmount += calc.vendorPayout;
         eligibleOrders.push({
          id: order._id,
          orderId: `LAB-${order._id.toString().slice(-8).toUpperCase()}`,
          date: order.vendorAcceptedAt,
          type: type,
          status: 'Accepted',
          // ✅ Detailed Breakdown
          originalAmount: calc.originalAmount,
          cutoffPercentage: calc.cutoffPercentage,
          adminEarnings: calc.adminEarnings,
          payableAmount: calc.vendorPayout,
          amount: calc.vendorPayout
        });
      });
    }

    res.json({
      success: true,
      message: "Eligible payouts fetched",
      totalPayableAmount: parseFloat(totalPayoutAmount.toFixed(2)),
      count: eligibleOrders.length,
      orders: eligibleOrders
    });

  } catch (error) {
    console.error("Fetch Eligible Payout Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});
// #endregion

// #region 2. CREATE PAYOUT REQUEST (VENDOR)
router.post('/request-payout', VendorMiddleware, async (req, res) => {
  try {
    let authenticatedId = req.vendorId || req.user?._id;
    const { vendorId, vendorType, orderIds } = req.body; 

    if (!authenticatedId && vendorId) { authenticatedId = vendorId; }

    if (!orderIds || orderIds.length === 0) {
      return res.status(400).json({ success: false, message: "No orders selected" });
    }

    const eligibilityDate = getSevenDaysAgoMidnight();
    const settings = await getCutoffSettings(); // ✅ Fetch settings to FREEZE amount
    
    let foodIds = [], pharmacyIds = [], appointmentIds = [];
    let totalRequestAmount = 0;
    let totalAdminEarnings = 0;

    // --- Process Pharmacy ---
    const pharmOrders = await OrderPharmacy.find({
      _id: { $in: orderIds },
      'items.vendorId': authenticatedId,
      $or: [ { payoutStatus: 'pending' }, { payoutStatus: { $exists: false } } ],
      vendorAcceptedAt: { $lt: eligibilityDate } 
    });
    
    for (const o of pharmOrders) {
      const price = parseFloat(o.grandTotal) || parseFloat(o.subTotal) || 0;
      const calc = calculatePayout(price, 'pharmacy', settings);
      
      pharmacyIds.push(o._id);
      totalRequestAmount += calc.vendorPayout;
      totalAdminEarnings += calc.adminEarnings;
      
      // ✅ Freeze values in DB
      await OrderPharmacy.findByIdAndUpdate(o._id, {
          payoutStatus: 'requested',
          vendorPayout: calc.vendorPayout,
          adminEarnings: calc.adminEarnings,
          cutoffPercentage: calc.cutoffPercentage
      });
    }

    // --- Process Food ---
    const foodOrders = await FoodOrder.find({
      _id: { $in: orderIds },
      vendorId: authenticatedId,
      $or: [ { payoutStatus: 'pending' }, { payoutStatus: { $exists: false } } ],
      vendorAcceptedAt: { $lt: eligibilityDate }
    });

    for (const o of foodOrders) {
      const price = parseFloat(o.finalprice || o.price) || 0;
      const calc = calculatePayout(price, 'food', settings);

      foodIds.push(o._id);
      totalRequestAmount += calc.vendorPayout;
      totalAdminEarnings += calc.adminEarnings;

      // ✅ Freeze values in DB
      await FoodOrder.findByIdAndUpdate(o._id, {
          payoutStatus: 'requested',
          vendorPayout: calc.vendorPayout,
          adminEarnings: calc.adminEarnings,
          cutoffPercentage: calc.cutoffPercentage
      });
    }

    // --- Process Lab Appointments (Vendor side) ---
    if(vendorType === 'lab' || !vendorType) {
        const apptQuery = {
            _id: { $in: orderIds },
            $or: [ { payoutStatus: 'pending' }, { payoutStatus: { $exists: false } } ],
            vendorAcceptedAt: { $lt: eligibilityDate }
        };
        const apptOrders = await Appointment.find(apptQuery);
        
        for (const o of apptOrders) {
          const price = parseFloat(o.price) || 0;
          const calc = calculatePayout(price, 'lab', settings);

          appointmentIds.push(o._id);
          totalRequestAmount += calc.vendorPayout;
          totalAdminEarnings += calc.adminEarnings;

          // ✅ Freeze values in DB
          await Appointment.findByIdAndUpdate(o._id, {
              payoutStatus: 'requested',
              vendorPayout: calc.vendorPayout,
              adminEarnings: calc.adminEarnings,
              cutoffPercentage: calc.cutoffPercentage
          });
        }
    }

    if (foodIds.length === 0 && pharmacyIds.length === 0 && appointmentIds.length === 0) {
      return res.status(400).json({ success: false, message: "No eligible orders found." });
    }

    const newRequest = await PayoutRequest.create({
      vendorId: authenticatedId,
      vendorModel: 'vandor', 
      totalAmount: parseFloat(totalRequestAmount.toFixed(2)),
      adminEarnings: parseFloat(totalAdminEarnings.toFixed(2)),
      totalOrders: foodIds.length + pharmacyIds.length + appointmentIds.length,
      status: 'pending',
      foodOrders: foodIds,
      pharmacyOrders: pharmacyIds,
      appointments: appointmentIds
    });

    // Link ID (Fields already updated in loop, adding Request ID)
    if(foodIds.length > 0) await FoodOrder.updateMany({ _id: { $in: foodIds } }, { payoutRequestId: newRequest._id });
    if(pharmacyIds.length > 0) await OrderPharmacy.updateMany({ _id: { $in: pharmacyIds } }, { payoutRequestId: newRequest._id });
    if(appointmentIds.length > 0) await Appointment.updateMany({ _id: { $in: appointmentIds } }, { payoutRequestId: newRequest._id });

    res.json({
      success: true,
      message: "Payout request submitted",
      data: newRequest
    });

  } catch (error) {
    console.error("Create Payout Request Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});
// #endregion

// #region 3. GET PAYOUT SUMMARY (VENDOR)
router.get('/payout-summary', VendorMiddleware, async (req, res) => {
  try {
    let authenticatedId = req.vendorId || req.user?._id;
    const { vendorId } = req.query;

    if (!authenticatedId && vendorId) authenticatedId = vendorId;
    if (!authenticatedId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const allRequests = await PayoutRequest.find({ vendorId: new mongoose.Types.ObjectId(authenticatedId) });

    let stats = {
      pendingRequestAmount: 0,
      totalPaidAmount: 0,
      paidBreakdown: { today: 0, week: 0, month: 0, year: 0 }
    };

    allRequests.forEach(req => {
      const amount = parseFloat(req.totalAmount) || 0;
      if (req.status === 'pending') {
        stats.pendingRequestAmount += amount;
      } 
      else if (req.status === 'approved') {
        stats.totalPaidAmount += amount;
        const paidDate = new Date(req.updatedAt);
        if (isToday(paidDate)) stats.paidBreakdown.today += amount;
        if (isThisWeek(paidDate)) stats.paidBreakdown.week += amount;
        if (isThisMonth(paidDate)) stats.paidBreakdown.month += amount;
        if (isThisYear(paidDate)) stats.paidBreakdown.year += amount;
      }
    });

    Object.keys(stats.paidBreakdown).forEach(k => stats.paidBreakdown[k] = parseFloat(stats.paidBreakdown[k].toFixed(2)));
    stats.pendingRequestAmount = parseFloat(stats.pendingRequestAmount.toFixed(2));
    stats.totalPaidAmount = parseFloat(stats.totalPaidAmount.toFixed(2));

    res.json({ success: true, data: stats });

  } catch (error) {
    console.error("Payout Summary Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});
// #endregion

// #region 4. GET PAYOUT HISTORY (VENDOR)
router.get('/payout-history', VendorMiddleware, async (req, res) => {
  try {
    let authenticatedId = req.vendorId || req.user?._id;
    const { vendorId } = req.query;

    if (!authenticatedId && vendorId) authenticatedId = vendorId;
    if (!authenticatedId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const history = await PayoutRequest.find({ vendorId: new mongoose.Types.ObjectId(authenticatedId) })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// #endregion

// #region 5. UPDATE BANK DETAILS (VENDOR)
router.put('/update-bank-details', VendorMiddleware, async (req, res) => {
  try {
    let userId = req.vendorId || req.user?._id;
    const { bankDetails } = req.body; 

    if(!userId && req.body.vendorId) userId = req.body.vendorId;
    if (!userId || !bankDetails) return res.status(400).json({ success: false, message: "Missing data" });

    const updateData = {
        "bankDetails.accountHolderName": bankDetails.accountHolderName,
        "bankDetails.accountNumber": bankDetails.accountNumber,
        "bankDetails.ifscCode": bankDetails.ifscCode.toUpperCase(),
        "bankDetails.bankName": bankDetails.bankName,
        "bankDetails.upiId": bankDetails.upiId || ""
    };

    const updatedUser = await Vendor.findByIdAndUpdate(userId, { $set: updateData }, { new: true });

    if (!updatedUser) return res.status(404).json({ success: false, message: "User not found" });

    res.json({
      success: true,
      message: "Bank details updated successfully",
      data: updatedUser.bankDetails
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// #endregion

// #region 6. GET BANK DETAILS (VENDOR)
router.get('/get-bank-details', VendorMiddleware, async (req, res) => {
  try {
    let userId = req.vendorId || req.user?._id;
    const { vendorId } = req.query; 
    if(!userId && vendorId) userId = vendorId;

    const user = await Vendor.findById(userId).select('bankDetails');
    res.json({ success: true, data: user?.bankDetails || {} });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// #endregion


// ############################################################################
// # SECTION B: NEW INDEPENDENT ROUTES (DOCTOR & CLINIC)
// ############################################################################

// --- HELPER: Calculation Logic for Doctor/Clinic ---
const calculateDoctorClinicEligible = async (userId, type) => {
    const eligibilityDate = getSevenDaysAgoMidnight();
    const settings = await getCutoffSettings();
    let eligibleOrders = [];
    let totalPayoutAmount = 0;

    let query = {
        $or: [{ payoutStatus: 'pending' }, { payoutStatus: { $exists: false } }, { payoutStatus: null }],
        vendorAcceptedAt: { $lt: eligibilityDate, $exists: true },
        status: { $in: ['3', 'completed', '7'] } // '7' for Doctor completion
    };

    if (type === 'clinic') {
        query.clinicId = new mongoose.Types.ObjectId(userId);
    } else if (type === 'doctor') {
        query.doctorId = new mongoose.Types.ObjectId(userId);
        query.$or = [{ clinicId: null }, { clinicId: { $exists: false } }];
    }

    const orders = await Appointment.find(query);

    orders.forEach(order => {
        let price = parseFloat(order.price) || 0;
        
        // Check Free Consultation
        const isFree = order.isFreeConsultation || false;

        // ✅ Calculate Dynamic Payout
        const calc = calculatePayout(price, type, settings, isFree);
        
        totalPayoutAmount += calc.vendorPayout;
        eligibleOrders.push({
            id: order._id,
            orderId: `${type.toUpperCase()}-${order._id.toString().slice(-8).toUpperCase()}`,
            
            // ✅ Detailed Breakdown
            originalAmount: calc.originalAmount,
            cutoffPercentage: calc.cutoffPercentage,
            adminEarnings: calc.adminEarnings,
            payableAmount: calc.vendorPayout,
            amount: calc.vendorPayout,
            
            isFreeConsultation: isFree,
            date: order.vendorAcceptedAt,
            type: type,
            status: 'Accepted'
        });
    });

    return {
        totalPayableAmount: parseFloat(totalPayoutAmount.toFixed(2)),
        count: eligibleOrders.length,
        orders: eligibleOrders
    };
};

// --- HELPER: Request Logic for Doctor/Clinic ---
// --- HELPER: Request Logic for Doctor/Clinic ---
// --- HELPER: Request Logic for Doctor/Clinic ---
const processDoctorClinicRequest = async (userId, userModelName, orderIds) => {
    const eligibilityDate = getSevenDaysAgoMidnight();
    const settings = await getCutoffSettings();
    
    // ✅ FIX 1: Ensure orderIds are clean (remove duplicates/nulls)
    if (!Array.isArray(orderIds)) orderIds = [orderIds];
    const cleanIds = orderIds.filter(id => id);

    // ✅ FIX 2: Fetch by ID ONLY first. This avoids query failures due to date/status mismatches.
    const apptOrders = await Appointment.find({
        _id: { $in: cleanIds }
    });
    
    if (!apptOrders || apptOrders.length === 0) {
        throw new Error("Selected orders could not be found in the database.");
    }

    let appointmentIds = [];
    let totalRequestAmount = 0;
    let totalAdminEarnings = 0;
    
    // Determine calculation type
    const calcType = userModelName.toLowerCase().includes('clinic') ? 'clinic' : 'doctor';

    for (const o of apptOrders) {
        // --- VALIDATION IN JAVASCRIPT (More Robust) ---

        // 1. Verify Ownership
        // Convert both to string to ensure matching works regardless of ObjectId type
        if (userModelName === 'Clinic') {
            if (o.clinicId?.toString() !== userId.toString()) continue; 
        } else {
            // For Doctor: Must match doctorId AND (clinicId must be null/undefined)
            if (o.doctorId?.toString() !== userId.toString()) continue;
            // If the appointment is linked to a clinic, the doctor cannot request payout independently
            if (o.clinicId) continue; 
        }

        // 2. Verify Payout Status (Allow null, undefined, or 'pending')
        if (o.payoutStatus && o.payoutStatus !== 'pending') {
             continue; // Skip if already requested or paid
        }

        // 3. Verify Date Eligibility
        // If vendorAcceptedAt is missing, we skip (safety)
        if (!o.vendorAcceptedAt) continue; 
        
        const acceptedDate = new Date(o.vendorAcceptedAt);
        if (acceptedDate >= eligibilityDate) {
            continue; // Skip if order is less than 7 days old
        }

        // --- CALCULATION ---
        let price = parseFloat(o.price) || 0;
        let isFree = o.isFreeConsultation || false;

        // Calculate & Freeze
        const calc = calculatePayout(price, calcType, settings, isFree);
        
        appointmentIds.push(o._id);
        totalRequestAmount += calc.vendorPayout;
        totalAdminEarnings += calc.adminEarnings;

        // Update individual order in DB
        await Appointment.findByIdAndUpdate(o._id, {
            payoutStatus: 'requested',
            vendorPayout: calc.vendorPayout,
            adminEarnings: calc.adminEarnings,
            cutoffPercentage: calc.cutoffPercentage
        });
    }

    // If all orders were filtered out during validation
    if (appointmentIds.length === 0) {
        throw new Error("No eligible orders found. Orders may be too recent (less than 7 days) or already requested.");
    }

    // Create the Payout Request
    const newRequest = await PayoutRequest.create({
        vendorId: userId,
        vendorModel: userModelName,
        totalAmount: parseFloat(totalRequestAmount.toFixed(2)),
        adminEarnings: parseFloat(totalAdminEarnings.toFixed(2)),
        totalOrders: appointmentIds.length,
        status: 'pending',
        appointments: appointmentIds,
        foodOrders: [],
        pharmacyOrders: []
    });

    // Link Request ID to Appointments
    await Appointment.updateMany({ _id: { $in: appointmentIds } }, { payoutRequestId: newRequest._id });
    
    return newRequest;
};

// --- HELPER: Stats Logic for Doctor/Clinic ---
const getDoctorClinicStats = async (userId) => {
    const allRequests = await PayoutRequest.find({ vendorId: new mongoose.Types.ObjectId(userId) });
    let stats = {
        pendingRequestAmount: 0,
        totalPaidAmount: 0,
        paidBreakdown: { today: 0, week: 0, month: 0, year: 0 }
    };

    allRequests.forEach(req => {
        const amount = parseFloat(req.totalAmount) || 0;
        if (req.status === 'pending') {
            stats.pendingRequestAmount += amount;
        } else if (req.status === 'approved') {
            stats.totalPaidAmount += amount;
            const paidDate = new Date(req.updatedAt);
            if (isToday(paidDate)) stats.paidBreakdown.today += amount;
            if (isThisWeek(paidDate)) stats.paidBreakdown.week += amount;
            if (isThisMonth(paidDate)) stats.paidBreakdown.month += amount;
            if (isThisYear(paidDate)) stats.paidBreakdown.year += amount;
        }
    });
    
    // Formatting
    Object.keys(stats.paidBreakdown).forEach(k => stats.paidBreakdown[k] = parseFloat(stats.paidBreakdown[k].toFixed(2)));
    stats.pendingRequestAmount = parseFloat(stats.pendingRequestAmount.toFixed(2));
    stats.totalPaidAmount = parseFloat(stats.totalPaidAmount.toFixed(2));
    return stats;
};

// ==========================================
// 7. DOCTOR ROUTES (Specific)
// ==========================================

const validateIndependentDoctor = async (doctorId) => {
    const doc = await Doctor.findById(doctorId).select('ClinicId');
    if (doc && doc.ClinicId) {
        return false; // Not independent (Clinic Doctor)
    }
    return true; // Independent Doctor
};

router.get('/doctor/payout-eligible', doctorMiddleware, async (req, res) => {
    try {
        const userId = req.doctorId || req.user?._id; 

        const isIndependent = await validateIndependentDoctor(userId);
        if (!isIndependent) {
            return res.status(403).json({ 
                success: false, 
                message: "This section is not available. Your payouts are managed directly by your Clinic." 
            });
        }

        const data = await calculateDoctorClinicEligible(userId, 'doctor');
        res.json({ success: true, message: "Doctor eligible payouts fetched", ...data });

    } catch (error) { 
        res.status(500).json({ success: false, message: error.message }); 
    }
});

router.post('/doctor/request-payout', doctorMiddleware, async (req, res) => {
    try {
        const userId = req.doctorId || req.user?._id;
        
        // 1. Validate Independent Doctor
        const isIndependent = await validateIndependentDoctor(userId);
        if (!isIndependent) {
            return res.status(403).json({ success: false, message: "Request failed. Your payouts are managed by your Clinic." });
        }

        // 2. Validate Body
        if (!req.body.orderIds || req.body.orderIds.length === 0) {
            return res.status(400).json({ success: false, message: "No orders selected." });
        }
        
        // 3. Process Request
        const request = await processDoctorClinicRequest(userId, 'Doctor', req.body.orderIds);
        
        res.json({ success: true, message: "Payout request submitted successfully", data: request });

    } catch (error) { 
        console.error("Doctor Payout Request Error:", error); 
        res.status(500).json({ success: false, message: error.message }); 
    }
});

router.get('/doctor/payout-summary', doctorMiddleware, async (req, res) => {
    try {
        const userId = req.doctorId || req.user?._id;

        const isIndependent = await validateIndependentDoctor(userId);
        if (!isIndependent) {
            return res.json({ 
                success: true, 
                data: {
                    pendingRequestAmount: 0,
                    totalPaidAmount: 0,
                    paidBreakdown: { today: 0, week: 0, month: 0, year: 0 },
                    message: "Managed by Clinic"
                } 
            });
        }

        const data = await getDoctorClinicStats(userId);
        res.json({ success: true, data });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.get('/doctor/payout-history', doctorMiddleware, async (req, res) => {
    try {
        const userId = req.doctorId || req.user?._id;

        const isIndependent = await validateIndependentDoctor(userId);
        if (!isIndependent) return res.json({ success: true, data: [] });

        const history = await PayoutRequest.find({ vendorId: userId }).sort({ createdAt: -1 });
        res.json({ success: true, data: history });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.get('/doctor/get-bank-details', doctorMiddleware, async (req, res) => {
    try {
        const userId = req.doctorId || req.user?._id;

        const isIndependent = await validateIndependentDoctor(userId);
        if (!isIndependent) return res.status(403).json({ success: false, message: "Bank details are managed by your Clinic." });

        const user = await Doctor.findById(userId).select('bankDetails');
        res.json({ success: true, data: user?.bankDetails || {} });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.put('/doctor/update-bank-details', doctorMiddleware, async (req, res) => {
    try {
        const userId = req.doctorId || req.user?._id;

        const isIndependent = await validateIndependentDoctor(userId);
        if (!isIndependent) return res.status(403).json({ success: false, message: "You cannot update bank details. Please contact your Clinic." });

        const { bankDetails } = req.body;
        if (!bankDetails) return res.status(400).json({ success: false, message: "Missing data" });

        const updateData = {
            "bankDetails.accountHolderName": bankDetails.accountHolderName,
            "bankDetails.accountNumber": bankDetails.accountNumber,
            "bankDetails.ifscCode": bankDetails.ifscCode.toUpperCase(),
            "bankDetails.bankName": bankDetails.bankName,
            "bankDetails.upiId": bankDetails.upiId || ""
        };
        const updatedUser = await Doctor.findByIdAndUpdate(userId, { $set: updateData }, { new: true });
        res.json({ success: true, message: "Bank details updated", data: updatedUser.bankDetails });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// ==========================================
// 8. CLINIC ROUTES (Specific)
// ==========================================

router.get('/clinic/payout-eligible', ClinicMiddleware, async (req, res) => {
    try {
        const userId = req.clinicId || req.user?._id;
        const data = await calculateDoctorClinicEligible(userId, 'clinic');
        res.json({ success: true, message: "Clinic eligible payouts fetched", ...data });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.post('/clinic/request-payout', ClinicMiddleware, async (req, res) => {
    try {
        const userId = req.clinicId || req.user?._id;
        if (!req.body.orderIds || req.body.orderIds.length === 0) return res.status(400).json({ success: false, message: "No orders selected" });

        const request = await processDoctorClinicRequest(userId, 'Clinic', req.body.orderIds);
        res.json({ success: true, message: "Request submitted", data: request });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.get('/clinic/payout-summary', ClinicMiddleware, async (req, res) => {
    try {
        const userId = req.clinicId || req.user?._id;
        const data = await getDoctorClinicStats(userId);
        res.json({ success: true, data });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.get('/clinic/payout-history', ClinicMiddleware, async (req, res) => {
    try {
        const userId = req.clinicId || req.user?._id;
        const history = await PayoutRequest.find({ vendorId: userId }).sort({ createdAt: -1 });
        res.json({ success: true, data: history });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.get('/clinic/get-bank-details', ClinicMiddleware, async (req, res) => {
    try {
        const userId = req.clinicId || req.user?._id;
        const user = await Clinic.findById(userId).select('bankDetails');
        res.json({ success: true, data: user?.bankDetails || {} });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.put('/clinic/update-bank-details', ClinicMiddleware, async (req, res) => {
    try {
        const userId = req.clinicId || req.user?._id;
        const { bankDetails } = req.body;
        if (!bankDetails) return res.status(400).json({ success: false, message: "Missing data" });

        const updateData = {
            "bankDetails.accountHolderName": bankDetails.accountHolderName,
            "bankDetails.accountNumber": bankDetails.accountNumber,
            "bankDetails.ifscCode": bankDetails.ifscCode.toUpperCase(),
            "bankDetails.bankName": bankDetails.bankName,
            "bankDetails.upiId": bankDetails.upiId || ""
        };
        const updatedUser = await Clinic.findByIdAndUpdate(userId, { $set: updateData }, { new: true });
        res.json({ success: true, message: "Bank details updated", data: updatedUser.bankDetails });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

module.exports = router;