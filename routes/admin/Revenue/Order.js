// routes/admin.js
const express = require('express');
const router = express.Router();
const FoodOrder = require('../../../modal/foodOrder');
const OrderPharmacy = require('../../../modal/OrderPharmacy'); 
const Appointment = require('../../../modal/Appointment');
const CutoffSettings = require('../../../modal/CutoffSettings');
const Clinic = require('../../../modal/clinic'); // ✅ Clinic model add kiya
const MembershipPurchase = require('../../../modal/membershipPurchase'); // ✅ Membership Purchase model add kiya
const UserMemberShip = require('../../../modal/UsermemberShip');
const MemberShip = require('../../../modal/MemberShip');

const mongoose = require('mongoose');
const {adminMiddleware} = require('../../../middleware/auth');

// Initialize cutoff settings
const initializeCutoffSettings = async () => {
  const settings = await CutoffSettings.findOne();
  if (!settings) {
    await CutoffSettings.create({
      foodCutoff: 5,
      pharmacyCutoff: 5,
      labCutoff: 5,
      doctorCutoff: 5,
            clinicCutoff: 5,  // ✅ CLINIC CUTOFF ADD KIYA
                  membershipCutoff: 10  // ✅ MEMBERSHIP CUTOFF ADD KIYA


    });
  }
};

// initializeCutoffSettings();

// Get all cutoff settings
router.get('/cutoff-settings',adminMiddleware, async (req, res) => {
  try {
    const settings = await CutoffSettings.findOne();
    
    res.json({
      success: true,
      message: "Cutoff settings fetched successfully",
      data: settings || await initializeCutoffSettings()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});



router.put('/cutoff-settings', async (req, res) => {
  try {
    const { foodCutoff, pharmacyCutoff, labCutoff, doctorCutoff, clinicCutoff, membershipCutoff } = req.body;

    // Validate percentages - MEMBERSHIP ADD KIYA
    const percentages = { foodCutoff, pharmacyCutoff, labCutoff, doctorCutoff, clinicCutoff, membershipCutoff };
    for (const [key, value] of Object.entries(percentages)) {
      if (value < 0 || value > 100) {
        return res.status(400).json({
          success: false,
          message: `${key} must be between 0 and 100`
        });
      }
    }

    const settings = await CutoffSettings.findOneAndUpdate(
      {},
      { 
        foodCutoff, 
        pharmacyCutoff, 
        labCutoff, 
        doctorCutoff,
        clinicCutoff,
        membershipCutoff,  // ✅ MEMBERSHIP CUTOFF ADD KIYA
        updatedBy: req.user?._id 
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Cutoff settings updated successfully",
      data: settings
    });
    
  } catch (error) {
    console.error("Cutoff settings update error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get all orders combined with type identification and cutoff calculations
// Get all orders combined with type identification and cutoff calculations - UPDATED WITH CLINIC CUTOFF
// Get all orders combined - UPDATED WITH NEW LOGIC
// Get all orders combined - UPDATED WITH FREE CONSULTATION LOGIC
// Get all orders combined - FIXED VERSION
router.get('/all-orders', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const cutoffSettings = await CutoffSettings.findOne();
    
    // ✅ FIX: Get all orders with PROPER ERROR HANDLING
    const results = await Promise.allSettled([
      // Food orders
      FoodOrder.find().populate('userId', 'name email phone').populate('vendorId', 'name email phone shopName').populate('items.FoodItem').sort({ createdAt: -1 }).catch(err => {
        console.error("Error fetching food orders:", err);
        return [];
      }),
      
      // Pharmacy orders
      OrderPharmacy.find().populate('userId', 'name email phone').populate({ path: 'items.vendorId', select: 'name email phone shopName' }).populate('items.productId').populate('items.medicineId').sort({ createdAt: -1 }).catch(err => {
        console.error("Error fetching pharmacy orders:", err);
        return [];
      }),
      
      // Lab orders
      Appointment.find({ 
        $or: [
          { serviceType: 'lab' },
          { serviceType: 'Lab Test' },
          { serviceType: 'Walkin Collection' },
          { serviceType: 'Home Collection' },
          { method: { $in: ['Test', 'Package'] } }
        ]
      }).populate('userId', 'name email phone').populate('vendorId', 'name email phone labName').populate('driverId', 'name phoneNumber').populate('testId', 'testName price').populate('packageId', 'packageName price').populate('AddMemberId').sort({ createdAt: -1 }).catch(err => {
        console.error("Error fetching lab orders:", err);
        return [];
      }),
      
      // ✅ FIX: Independent Doctor orders with PROPER AGGREGATION
      Appointment.aggregate([
        { 
          $match: { 
            doctorId: { $exists: true, $ne: null },
            vendorId: { $in: [null, undefined] },
            $or: [
              { clinicId: null },
              { clinicId: { $exists: false } }
            ]
          } 
        },
        {
          $lookup: {
            from: "doctors",
            localField: "doctorId",
            foreignField: "_id",
            as: "doctorDetails"
          }
        },
        { $unwind: { path: "$doctorDetails", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "patients",
            localField: "patientId",
            foreignField: "_id",
            as: "patientDetails"
          }
        },
        {
          $unwind: {
            path: "$patientDetails",
            preserveNullAndEmptyArrays: true
          }
        },
        { $sort: { createdAt: -1 } }
      ]).catch(err => {
        console.error("Error fetching independent doctor orders:", err);
        return [];
      }),
      
      // ✅ FIX: Clinic orders
      Appointment.find({
        clinicId: { $exists: true, $ne: null }
      })
        .populate('userId', 'name email phone')
        .populate('doctorId', 'name email phone')
        .populate('clinicId', 'name clinicName email phoneNumber')
        .populate('vendorId', 'name email phone labName')
        .populate('driverId', 'name phoneNumber')
        .populate('testId', 'testName price')
        .populate('packageId', 'packageName price')
        .populate('AddMemberId')
        .sort({ createdAt: -1 }).catch(err => {
          console.error("Error fetching clinic orders:", err);
          return [];
        }),
      
      // ✅ FIX: Membership purchases
      MembershipPurchase.find({ paymentStatus: 'completed' })
        .populate('userId', 'name email phone')
        .populate('membershipId', 'planName description')
        .sort({ createdAt: -1 }).catch(err => {
          console.error("Error fetching membership purchases:", err);
          return [];
        })
    ]);

    // ✅ FIX: Extract results with proper handling
    const [
      foodOrders,
      pharmacyOrders,
      labOrders,
      independentDoctorOrders,
      clinicOrders,
      membershipPurchases
    ] = results.map(result => 
      result.status === 'fulfilled' ? result.value : []
    );

    console.log("All Orders Count:");
    console.log(`- Food Orders: ${foodOrders.length}`);
    console.log(`- Pharmacy Orders: ${pharmacyOrders.length}`);
    console.log(`- Lab Orders: ${labOrders.length}`);
    console.log(`- Independent Doctor Orders: ${independentDoctorOrders ? independentDoctorOrders.length : 0}`);
    console.log(`- Clinic Orders: ${clinicOrders.length}`);
    console.log(`- Membership Purchases: ${membershipPurchases.length}`);

    // ✅ FIX: Combine all orders with type-specific cutoff calculations
    const allOrders = [
      // Food orders
      ...(Array.isArray(foodOrders) ? foodOrders.map(order => {
        const cutoffPercentage = cutoffSettings?.foodCutoff || 5;
        const price = getOrderPrice(order, 'food');
        const { cutoffAmount, vendorPayout } = calculateCutoff(price, cutoffPercentage);
        
        return { 
          ...order.toObject(), 
          orderType: 'food',
          id: order._id,
          displayId: `FOOD-${order._id.toString().slice(-8)}`,
          cutoffPercentage,
          cutoffAmount,
          vendorPayout,
          originalPrice: price
        };
      }) : []),
      
      // Pharmacy orders
      ...(Array.isArray(pharmacyOrders) ? pharmacyOrders.map(order => {
        const cutoffPercentage = cutoffSettings?.pharmacyCutoff || 5;
        const price = getOrderPrice(order, 'pharmacy');
        const { cutoffAmount, vendorPayout } = calculateCutoff(price, cutoffPercentage);
        
        return { 
          ...order.toObject(), 
          orderType: 'pharmacy',
          id: order._id,
          displayId: `PHARM-${order._id.toString().slice(-8)}`,
          cutoffPercentage,
          cutoffAmount,
          vendorPayout,
          originalPrice: price
        };
      }) : []),
      
      // Lab orders
      ...(Array.isArray(labOrders) ? labOrders.map(order => {
        const cutoffPercentage = cutoffSettings?.labCutoff || 5;
        const price = getOrderPrice(order, 'lab');
        const { cutoffAmount, vendorPayout } = calculateCutoff(price, cutoffPercentage);
        
        return { 
          ...order.toObject(), 
          orderType: 'lab',
          id: order._id,
          displayId: `LAB-${order._id.toString().slice(-8)}`,
          cutoffPercentage,
          cutoffAmount,
          vendorPayout,
          originalPrice: price
        };
      }) : []),
      
      // ✅ FIX: Independent Doctor orders with CHECK
      ...(Array.isArray(independentDoctorOrders) ? independentDoctorOrders.map(order => {
        const isFreeConsultation = order.isFreeConsultation || false;
        
        // 🚨 CRITICAL: Check if this is FREE consultation
        let cutoffPercentage;
        let cutoffType = 'doctor';
        
        if (isFreeConsultation) {
          // 🚨 FREE consultation = Use MEMBERSHIP CUTOFF
          cutoffPercentage = cutoffSettings?.membershipCutoff || 20;
          cutoffType = 'membership';
        } else {
          // 🚨 PAID consultation = Use DOCTOR CUTOFF
          cutoffPercentage = cutoffSettings?.doctorCutoff || 5;
          cutoffType = 'doctor';
        }
        
        const price = getOrderPrice(order, 'doctor');
        const { cutoffAmount, vendorPayout } = calculateCutoff(price, cutoffPercentage, isFreeConsultation, 'doctor');
        
        return { 
          ...order, 
          orderType: 'doctor',
          id: order._id,
          displayId: `DOC-${order._id.toString().slice(-8)}`,
          cutoffPercentage,
          cutoffType,
          cutoffAmount,
          vendorPayout,
          originalPrice: price,
          isFreeConsultation: isFreeConsultation,
          usedMembershipCutoff: isFreeConsultation,
          membershipCutoffApplied: isFreeConsultation ? cutoffSettings?.membershipCutoff || 20 : null,
          doctorDetails: order.doctorDetails,
          patientDetails: order.patientDetails
        };
      }) : []),

      // ✅ FIX: Clinic orders
      ...(Array.isArray(clinicOrders) ? clinicOrders.map(order => {
        const cutoffPercentage = cutoffSettings?.clinicCutoff || 5;
        const price = getOrderPrice(order, 'clinic');
        const { cutoffAmount, vendorPayout } = calculateCutoff(price, cutoffPercentage);
        
        return { 
          ...order.toObject(), 
          orderType: 'clinic',
          id: order._id,
          displayId: `CLINIC-${order._id.toString().slice(-8)}`,
          cutoffPercentage,
          cutoffAmount,
          vendorPayout,
          originalPrice: price,
          clinicDetails: order.clinicId,
          doctorDetails: order.doctorId
        };
      }) : []),

      // ✅ FIX: Membership purchases
      ...(Array.isArray(membershipPurchases) ? membershipPurchases.map(purchase => {
        const cutoffPercentage = cutoffSettings?.membershipCutoff || 10;
        const price = getOrderPrice(purchase, 'membership');
        const { cutoffAmount, vendorPayout } = calculateCutoff(price, cutoffPercentage);
        
        return {
          ...purchase.toObject(),
          orderType: 'membership',
          id: purchase._id,
          displayId: `MEM-${purchase._id.toString().slice(-8)}`,
          cutoffPercentage,
          cutoffAmount,
          vendorPayout,
          originalPrice: price,
          planDetails: purchase.membershipId,
          isMembershipPurchase: true
        };
      }) : [])
    ].sort((a, b) => new Date(b.createdAt || b.appointment?.createdAt) - new Date(a.createdAt || a.appointment?.createdAt));

    // ✅ FIX: Calculate totals
    let totalRevenue = 0;
    let totalAdminEarnings = 0;
    let totalOrdersCount = allOrders.length;

    allOrders.forEach(order => {
      totalRevenue += order.originalPrice || 0;
      totalAdminEarnings += order.cutoffAmount || 0;
    });

    // Apply pagination
    const paginatedOrders = allOrders.slice(skip, skip + limitNum);
    const totalPages = Math.ceil(totalOrdersCount / limitNum);

    // ✅ FIX: Summary with checks
    const summary = {
      food: Array.isArray(foodOrders) ? foodOrders.length : 0,
      pharmacy: Array.isArray(pharmacyOrders) ? pharmacyOrders.length : 0,
      lab: Array.isArray(labOrders) ? labOrders.length : 0,
      doctor: Array.isArray(independentDoctorOrders) ? independentDoctorOrders.length : 0,
      clinic: Array.isArray(clinicOrders) ? clinicOrders.length : 0,
      membership: Array.isArray(membershipPurchases) ? membershipPurchases.length : 0,
      total: totalOrdersCount
    };

    res.json({
      success: true,
      message: "All orders fetched successfully",
      count: paginatedOrders.length,
      totalOrders: totalOrdersCount,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalAdminEarnings: parseFloat(totalAdminEarnings.toFixed(2)),
      pagination: {
        currentPage: pageNum,
        totalPages: totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
        limit: limitNum
      },
      data: paginatedOrders,
      cutoffSettings: cutoffSettings || {
        foodCutoff: 5,
        pharmacyCutoff: 5,
        labCutoff: 5,
        doctorCutoff: 5,
        clinicCutoff: 5,
        membershipCutoff: 10
      },
      summary: summary,
      debug: {
        ordersByType: summary,
        freeConsultationsCount: Array.isArray(independentDoctorOrders) ? 
          independentDoctorOrders.filter(order => order.isFreeConsultation).length : 0
      }
    });
    
  } catch (error) {
    console.error("All orders error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});
// Get clinic orders with cutoff calculations
// Get clinic orders with cutoff calculations - UPDATED WITH CLINIC CUTOFF
// Get clinic orders - UPDATED WITH PROPER FILTERING
// ✅ UPDATED: Get clinic orders with FREE CONSULTATION LOGIC
// ✅ FIXED: Clinic orders with FREE consultation logic
router.get('/clinic-orders', adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const cutoffSettings = await CutoffSettings.findOne();
    const clinicCutoff = cutoffSettings?.clinicCutoff || 5;
    const membershipCutoff = cutoffSettings?.membershipCutoff || 20;

    // ✅ FIX: Clinic appointments = appointments jisme clinicId HAI
    const pipeline = [
      {
        $match: {
          clinicId: { $exists: true, $ne: null }
        }
      },
      {
        $addFields: {
          // Convert clinicId to string for checking
          clinicIdString: { $toString: "$clinicId" },
          // Check if it's a valid ObjectId string
          isValidObjectId: {
            $regexMatch: {
              input: { $toString: "$clinicId" },
              regex: /^[0-9a-fA-F]{24}$/
            }
          }
        }
      },
      {
        $match: {
          clinicIdString: { $ne: "" },
          isValidObjectId: true
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNum }
    ];

    const countPipeline = [
      {
        $match: {
          clinicId: { $exists: true, $ne: null }
        }
      },
      {
        $addFields: {
          clinicIdString: { $toString: "$clinicId" },
          isValidObjectId: {
            $regexMatch: {
              input: { $toString: "$clinicId" },
              regex: /^[0-9a-fA-F]{24}$/
            }
          }
        }
      },
      {
        $match: {
          clinicIdString: { $ne: "" },
          isValidObjectId: true
        }
      },
      { $count: "total" }
    ];

    console.log(`Fetching clinic appointments with FREE consultation logic...`);

    // Execute both pipelines
    const [appointments, countResult] = await Promise.all([
      Appointment.aggregate(pipeline),
      Appointment.aggregate(countPipeline)
    ]);

    const totalOrders = countResult[0]?.total || 0;
    console.log(`Found ${totalOrders} clinic appointments`);

    if (totalOrders === 0) {
      return res.json({
        success: true,
        message: "No clinic orders found",
        count: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalAdminEarnings: 0,
        pagination: {
          currentPage: pageNum,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
          limit: limitNum
        },
        data: [],
        cutoffPercentage: clinicCutoff
      });
    }

    // Get appointment IDs for population
    const appointmentIds = appointments.map(apt => apt._id);

    // Fetch populated appointments
    const populatedAppointments = await Appointment.find({ _id: { $in: appointmentIds } })
      .populate('userId', 'name email phone')
      .populate('doctorId', 'name email phone qualification specialist')
      .populate('clinicId', 'name clinicName email phoneNumber address')
      .populate('patientId', 'name phone dob gender')
      .populate('userMembershipId', 'planName consultationLimit consultationsUsed')
      .sort({ createdAt: -1 });

    console.log(`Populated clinic appointments: ${populatedAppointments.length}`);

    // ✅ FIX: Get user memberships for all users to check free consultations
    const userIds = [...new Set(populatedAppointments.map(apt => apt.userId?._id).filter(id => id))];
    const userMemberships = await UserMemberShip.find({
      userId: { $in: userIds },
      isActive: true,
      endDate: { $gt: new Date() }
    });

    // Create membership map for quick lookup
    const membershipMap = {};
    userMemberships.forEach(membership => {
      if (!membershipMap[membership.userId]) {
        membershipMap[membership.userId] = [];
      }
      membershipMap[membership.userId].push(membership);
    });

    const ordersWithCutoff = populatedAppointments.map(appointment => {
      // Price extract karo
      let price = 0;
      if (appointment.price) {
        const priceStr = appointment.price.toString();
        const numericPrice = priceStr.replace(/[₹,]/g, '');
        price = parseFloat(numericPrice) || 0;
      }
      
      // ✅ NEW: Check if this is a FREE consultation
      let isFreeConsultation = false;
      let freeConsultationType = 'none';
      let membershipUsed = null;
      
      // Method 1: Check appointment flag
      if (appointment.isFreeConsultation === true) {
        isFreeConsultation = true;
        freeConsultationType = 'appointment_flag';
      }
      
      // Method 2: Check if user has active membership
      const userId = appointment.userId?._id?.toString();
      if (userId && membershipMap[userId]) {
        const activeMemberships = membershipMap[userId];
        
        // Check each active membership
        for (const membership of activeMemberships) {
          // Check if membership has consultations remaining
          const consultationsUsed = membership.consultationsUsed || 0;
          const consultationLimit = membership.consultationLimit || 0;
          const consultationsRemaining = consultationLimit - consultationsUsed;
          
          if (consultationsRemaining > 0) {
            // Check if this appointment is linked to this membership
            if (appointment.userMembershipId && 
                appointment.userMembershipId._id.toString() === membership._id.toString()) {
              isFreeConsultation = true;
              freeConsultationType = 'membership_linked';
              membershipUsed = membership;
              break;
            }
          }
        }
      }
      
      // ✅ NEW: Determine which cutoff to use
      let cutoffPercentage;
      let cutoffType = 'clinic';
      
      if (isFreeConsultation) {
        // 🚨 FREE consultation = Use MEMBERSHIP CUTOFF
        cutoffPercentage = membershipCutoff;
        cutoffType = 'membership';
      } else {
        // 🚨 PAID consultation = Use CLINIC CUTOFF
        cutoffPercentage = clinicCutoff;
        cutoffType = 'clinic';
      }
      
      const { cutoffAmount, vendorPayout } = calculateCutoff(price, cutoffPercentage);
      
      // Clinic details
      let clinicDetails = {};
      if (appointment.clinicId && typeof appointment.clinicId === 'object') {
        clinicDetails = {
          _id: appointment.clinicId._id,
          name: appointment.clinicId.name || appointment.clinicId.clinicName,
          email: appointment.clinicId.email,
          phone: appointment.clinicId.phoneNumber,
          address: appointment.clinicId.address,
          clinicName: appointment.clinicId.clinicName
        };
      }
      
      // Doctor details
      let doctorDetails = {};
      if (appointment.doctorId && typeof appointment.doctorId === 'object') {
        doctorDetails = {
          _id: appointment.doctorId._id,
          name: appointment.doctorId.name,
          email: appointment.doctorId.email,
          phone: appointment.doctorId.phone,
          qualification: appointment.doctorId.qualification,
          specialist: appointment.doctorId.specialist
        };
      }

      // Patient details
      let patientDetails = {};
      if (appointment.patientId && typeof appointment.patientId === 'object') {
        patientDetails = {
          _id: appointment.patientId._id,
          name: appointment.patientId.name,
          phone: appointment.patientId.phone,
          dob: appointment.patientId.dob,
          gender: appointment.patientId.gender
        };
      }

      return {
        appointment: appointment.toObject(),
        orderType: 'clinic',
        id: appointment._id,
        displayId: `CLINIC-${appointment._id.toString().slice(-8)}`,
        
        // ✅ NEW: Free consultation info
        isFreeConsultation,
        freeConsultationType,
        membershipUsed: membershipUsed ? {
          planName: membershipUsed.planName,
          consultationsUsed: membershipUsed.consultationsUsed || 0,
          consultationLimit: membershipUsed.consultationLimit || 0,
          consultationsRemaining: (membershipUsed.consultationLimit || 0) - (membershipUsed.consultationsUsed || 0)
        } : null,
        
        // Cutoff info
        cutoffPercentage,
        cutoffType,
        cutoffAmount: parseFloat(cutoffAmount.toFixed(2)),
        vendorPayout: parseFloat(vendorPayout.toFixed(2)),
        originalPrice: price,
        
        // Clinic details
        clinicDetails: clinicDetails,
        doctorDetails: doctorDetails,
        patientDetails: patientDetails,
        userDetails: appointment.userId ? {
          name: appointment.userId.name,
          email: appointment.userId.email,
          phone: appointment.userId.phone
        } : {},
        
        // ✅ NEW: Financial breakdown for free consultations
        financialBreakdown: isFreeConsultation ? {
          originalConsultationFee: price,
          membershipDiscount: price, // Full discount
          amountPaid: 0,
          adminCutoffPercentage: cutoffPercentage,
          adminCutoffAmount: parseFloat(cutoffAmount.toFixed(2)),
          clinicPayout: parseFloat(vendorPayout.toFixed(2)),
          cutoffSource: 'membership'
        } : null,
        
        // Debug info
        debug: {
          hasValidClinicId: !!appointment.clinicId,
          clinicIdValue: appointment.clinicId?._id,
          isClinicOrder: true,
          freeConsultationCheck: {
            userId: userId,
            hasActiveMemberships: userId ? !!membershipMap[userId] : false,
            appointmentFlag: appointment.isFreeConsultation,
            userMembershipId: appointment.userMembershipId?._id
          }
        }
      };
    });

    // Calculate totals
    let totalRevenue = 0;
    let totalAdminEarnings = 0;
    let freeConsultationCount = 0;
    let paidConsultationCount = 0;
    let freeConsultationRevenue = 0;

    ordersWithCutoff.forEach(order => {
      totalRevenue += order.originalPrice || 0;
      totalAdminEarnings += order.cutoffAmount || 0;
      
      if (order.isFreeConsultation) {
        freeConsultationCount++;
        freeConsultationRevenue += order.originalPrice || 0;
      } else {
        paidConsultationCount++;
      }
    });

    const totalPages = Math.ceil(totalOrders / limitNum);
    
    res.json({
      success: true,
      message: "Clinic orders fetched successfully",
      count: ordersWithCutoff.length,
      totalOrders: totalOrders,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalAdminEarnings: parseFloat(totalAdminEarnings.toFixed(2)),
      
      // ✅ NEW: Free consultation stats
      freeConsultationStats: {
        count: freeConsultationCount,
        paidCount: paidConsultationCount,
        freeConsultationRevenue: parseFloat(freeConsultationRevenue.toFixed(2)),
        percentage: totalOrders > 0 ? ((freeConsultationCount / totalOrders) * 100).toFixed(2) + '%' : '0%'
      },
      
      pagination: {
        currentPage: pageNum,
        totalPages: totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
        limit: limitNum
      },
      data: ordersWithCutoff,
      cutoffSettings: {
        clinicCutoff: clinicCutoff,
        membershipCutoff: membershipCutoff,
        freeConsultationsUseMembershipCutoff: true
      },
      summary: {
        totalClinics: new Set(ordersWithCutoff.map(order => order.clinicDetails._id)).size,
        totalDoctors: new Set(ordersWithCutoff.map(order => order.doctorDetails._id)).size,
        averageOrderValue: totalOrders > 0 ? parseFloat((totalRevenue / totalOrders).toFixed(2)) : 0
      }
    });
  } catch (error) {
    console.error("Clinic orders error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});
router.get('/membership-orders', adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const cutoffSettings = await CutoffSettings.findOne();
    const cutoffPercentage = cutoffSettings?.membershipCutoff || 10;

    // Date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59.999Z')
      };
    }

    // Total count
    const totalPurchases = await MembershipPurchase.countDocuments({
      paymentStatus: 'completed',
      ...dateFilter
    });

    // Get membership purchases with pagination
    const membershipPurchases = await MembershipPurchase.find({
      paymentStatus: 'completed',
      ...dateFilter
    })
      .populate('userId', 'name email phone')
      .populate('membershipId', 'planName description durationDays consultationLimit price features')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Calculate earnings for each purchase
    const ordersWithCutoff = membershipPurchases.map(purchase => {
      const price = purchase.pricePaid || 0;
      const { cutoffAmount, vendorPayout } = calculateCutoff(price, cutoffPercentage);
      
      return {
        ...purchase.toObject(),
        orderType: 'membership',
        id: purchase._id,
        displayId: `MEM-${purchase._id.toString().slice(-8)}`,
        cutoffPercentage,
        cutoffAmount: parseFloat(cutoffAmount.toFixed(2)),
        vendorPayout: parseFloat(vendorPayout.toFixed(2)),
        originalPrice: price,
        userDetails: purchase.userId ? {
          name: purchase.userId.name,
          email: purchase.userId.email,
          phone: purchase.userId.phone
        } : {}
      };
    });

    // Calculate totals
    let totalRevenue = 0;
    let totalAdminEarnings = 0;

    ordersWithCutoff.forEach(order => {
      totalRevenue += order.originalPrice || 0;
      totalAdminEarnings += order.cutoffAmount || 0;
    });

    const totalPages = Math.ceil(totalPurchases / limitNum);

    // Plan-wise breakdown
    const planBreakdown = {};
    ordersWithCutoff.forEach(order => {
      const planName = order.membershipId?.planName || 'Unknown Plan';
      if (!planBreakdown[planName]) {
        planBreakdown[planName] = {
          count: 0,
          revenue: 0,
          earnings: 0
        };
      }
      planBreakdown[planName].count++;
      planBreakdown[planName].revenue += order.originalPrice || 0;
      planBreakdown[planName].earnings += order.cutoffAmount || 0;
    });

    res.json({
      success: true,
      message: "Membership orders fetched successfully",
      count: ordersWithCutoff.length,
      totalOrders: totalPurchases,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalAdminEarnings: parseFloat(totalAdminEarnings.toFixed(2)),
      pagination: {
        currentPage: pageNum,
        totalPages: totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
        limit: limitNum
      },
      data: ordersWithCutoff,
      cutoffPercentage,
      summary: {
        totalPurchases: totalPurchases,
        averagePurchaseValue: totalPurchases > 0 ? parseFloat((totalRevenue / totalPurchases).toFixed(2)) : 0,
        planBreakdown: planBreakdown
      }
    });
  } catch (error) {
    console.error("Membership orders error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});
// Get individual order types with cutoff calculations
// Get individual order types with cutoff calculations
router.get('/food-orders', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const cutoffSettings = await CutoffSettings.findOne();
    const cutoffPercentage = cutoffSettings?.foodCutoff || 5;

    const orders = await FoodOrder.find()
      .populate('userId', 'name email phone')
      .populate('vendorId', 'name email phone shopName')
      .populate('items.FoodItem')
      .sort({ createdAt: -1 });

    const ordersWithCutoff = orders.map(order => {
      const price = getOrderPrice(order, 'food');
      const { cutoffAmount, vendorPayout } = calculateCutoff(price, cutoffPercentage);
      
      return {
        ...order.toObject(),
        cutoffPercentage,
        cutoffAmount,
        vendorPayout,
        originalPrice: price
      };
    });

    // Calculate totals
    let totalRevenue = 0;
    let totalAdminEarnings = 0;
    let totalOrders = ordersWithCutoff.length;

    ordersWithCutoff.forEach(order => {
      totalRevenue += order.originalPrice || 0;
      totalAdminEarnings += order.cutoffAmount || 0;
    });

    // Apply pagination
    const paginatedOrders = ordersWithCutoff.slice(skip, skip + limitNum);
    const totalPages = Math.ceil(totalOrders / limitNum);
    
    res.json({
      success: true,
      message: "Food orders fetched successfully",
      count: paginatedOrders.length,
      totalOrders: totalOrders,
      totalRevenue: totalRevenue,
      totalAdminEarnings: totalAdminEarnings,
      pagination: {
        currentPage: pageNum,
        totalPages: totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
        limit: limitNum
      },
      data: paginatedOrders,
      cutoffPercentage
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

router.get('/pharmacy-orders', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const cutoffSettings = await CutoffSettings.findOne();
    const cutoffPercentage = cutoffSettings?.pharmacyCutoff || 5;

    const orders = await OrderPharmacy.find()
      .populate('userId', 'name email phone')
      .populate({ 
        path: 'items.vendorId', 
        select: 'name email phone shopName' 
      })
      .populate('items.productId')
      .populate('items.medicineId')
      .sort({ createdAt: -1 });

    const ordersWithCutoff = orders.map(order => {
      const price = getOrderPrice(order, 'pharmacy');
      const { cutoffAmount, vendorPayout } = calculateCutoff(price, cutoffPercentage);
      
      return {
        ...order.toObject(),
        cutoffPercentage,
        cutoffAmount,
        vendorPayout,
        originalPrice: price
      };
    });

    // Calculate totals
    let totalRevenue = 0;
    let totalAdminEarnings = 0;
    let totalOrders = ordersWithCutoff.length;

    ordersWithCutoff.forEach(order => {
      totalRevenue += order.originalPrice || 0;
      totalAdminEarnings += order.cutoffAmount || 0;
    });

    // Apply pagination
    const paginatedOrders = ordersWithCutoff.slice(skip, skip + limitNum);
    const totalPages = Math.ceil(totalOrders / limitNum);
    
    res.json({
      success: true,
      message: "Pharmacy orders fetched successfully",
      count: paginatedOrders.length,
      totalOrders: totalOrders,
      totalRevenue: totalRevenue,
      totalAdminEarnings: totalAdminEarnings,
      pagination: {
        currentPage: pageNum,
        totalPages: totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
        limit: limitNum
      },
      data: paginatedOrders,
      cutoffPercentage
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

router.get('/lab-orders', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const cutoffSettings = await CutoffSettings.findOne();
    const cutoffPercentage = cutoffSettings?.labCutoff || 5;

    const orders = await Appointment.find({ 
      $or: [
        { serviceType: 'lab' },
        { serviceType: 'Lab Test' },
        { serviceType: 'Walkin Collection' },
        { serviceType: 'Home Collection' },
        { method: { $in: ['Test', 'Package'] } }
      ]
    })
      .populate('userId', 'name email phone')
      .populate('vendorId', 'name email phone labName')
      .populate('driverId', 'name phoneNumber')
      .populate('testId', 'testName price')
      .populate('packageId', 'packageName price')
      .populate('AddMemberId')
      .sort({ createdAt: -1 });

    const ordersWithCutoff = orders.map(order => {
      const price = getOrderPrice(order, 'lab');
      const { cutoffAmount, vendorPayout } = calculateCutoff(price, cutoffPercentage);
      
      return {
        ...order.toObject(),
        cutoffPercentage,
        cutoffAmount,
        vendorPayout,
        originalPrice: price
      };
    });

    // Calculate totals
    let totalRevenue = 0;
    let totalAdminEarnings = 0;
    let totalOrders = ordersWithCutoff.length;

    ordersWithCutoff.forEach(order => {
      totalRevenue += order.originalPrice || 0;
      totalAdminEarnings += order.cutoffAmount || 0;
    });

    // Apply pagination
    const paginatedOrders = ordersWithCutoff.slice(skip, skip + limitNum);
    const totalPages = Math.ceil(totalOrders / limitNum);
    
    res.json({
      success: true,
      message: "Lab orders fetched successfully",
      count: paginatedOrders.length,
      totalOrders: totalOrders,
      totalRevenue: totalRevenue,
      totalAdminEarnings: totalAdminEarnings,
      pagination: {
        currentPage: pageNum,
        totalPages: totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
        limit: limitNum
      },
      data: paginatedOrders,
      cutoffPercentage
    });
  } catch (error) {
    console.error("Lab orders error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get doctor orders - FIXED POPULATION VERSION
// Get doctor orders - FILTER BY CLINIC ID ONLY
// Get doctor orders - PROPERLY FILTERED FOR INDEPENDENT DOCTORS ONLY
// Get doctor orders - FIXED VERSION WITH PROPER CLINICID FILTERING
// Get doctor orders - UPDATED WITH FREE CONSULTATION LOGIC
// Get doctor orders - FIXED VERSION WITH PROPER VARIABLE DEFINITION
router.get('/doctor-orders', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const cutoffSettings = await CutoffSettings.findOne();
    const doctorCutoff = cutoffSettings?.doctorCutoff || 5;

    // ✅ FIX: Independent doctors = appointments jisme clinicId NAHI HAI
    const pipeline = [
      {
        $match: {
          doctorId: { $exists: true, $ne: null }, // Must have doctorId
          vendorId: { $in: [null, undefined] }, // Must not have vendorId
        }
      },
      {
        $addFields: {
          // Convert clinicId to string for easier checking
          clinicIdString: { $toString: "$clinicId" },
          hasClinicId: { 
            $and: [
              { $ne: ["$clinicId", null] },
              { $ne: ["$clinicId", undefined] }
            ]
          }
        }
      },
      {
        $match: {
          // ClinicId should be null, undefined, or empty string
          $or: [
            { clinicId: null },
            { clinicId: { $exists: false } },
            { clinicIdString: "" }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNum }
    ];

    const countPipeline = [
      {
        $match: {
          doctorId: { $exists: true, $ne: null },
          vendorId: { $in: [null, undefined] },
        }
      },
      {
        $addFields: {
          clinicIdString: { $toString: "$clinicId" }
        }
      },
      {
        $match: {
          $or: [
            { clinicId: null },
            { clinicId: { $exists: false } },
            { clinicIdString: "" }
          ]
        }
      },
      { $count: "total" }
    ];

    console.log(`Fetching INDEPENDENT doctor appointments...`);

    // ✅ FIX: Properly execute both pipelines
    const [appointments, countResult] = await Promise.all([
      Appointment.aggregate(pipeline),
      Appointment.aggregate(countPipeline)
    ]);

    const totalOrders = countResult[0]?.total || 0;
    console.log(`Found ${totalOrders} INDEPENDENT doctor appointments`);

    // Agar count 0 hai toh seedhe response bhej do
    if (totalOrders === 0) {
      return res.json({
        success: true,
        message: "No independent doctor orders found",
        count: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalAdminEarnings: 0,
        pagination: {
          currentPage: pageNum,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
          limit: limitNum
        },
        data: [],
        cutoffPercentage: doctorCutoff
      });
    }

    // ✅ FIX: Get appointment IDs for population
    const appointmentIds = appointments.map(apt => apt._id);

    // ✅ FIX: Fetch populated appointments
    const populatedAppointments = await Appointment.find({ _id: { $in: appointmentIds } })
      .populate('userId', 'name email phone')
      .populate('doctorId', 'name email phone qualification specialist ClinicId')
      .populate('patientId', 'name phone dob gender')
      .populate('couponId', 'couponCode discountType discountValue')
      .sort({ createdAt: -1 });

    console.log(`Populated appointments: ${populatedAppointments.length}`);

    // ✅ FIX: Prescriptions fetch karo
    let prescriptionMap = {};
    try {
      const Prescription = require('../../../modal/doctorPrescription');
      const prescriptions = await Prescription.find({
        AppointmentId: { $in: appointmentIds }
      }).populate('addInsuranceTypeId', 'addInsurance insuranceImage');
      
      prescriptions.forEach(pres => {
        prescriptionMap[pres.AppointmentId.toString()] = pres;
      });
    } catch (presError) {
      console.log("Prescriptions not found or error:", presError.message);
    }

    // ✅ FIX: Get cutoff settings
    const cutoffSettingsData = await CutoffSettings.findOne();

    // ✅ FIX: Process each appointment
    const ordersWithCutoff = populatedAppointments.map(appointment => {
      // Price extract karo
      let price = 0;
      if (appointment.price) {
        const priceStr = appointment.price.toString();
        const numericPrice = priceStr.replace(/[₹,]/g, '');
        price = parseFloat(numericPrice) || 0;
      }
      
      // ✅ FIX: Check if FREE consultation
      const isFreeConsultation = appointment.isFreeConsultation || false;
      
      // ✅ FIX: CUTOFF LOGIC: Different cutoff for free vs paid
      let cutoffPercentage;
      let cutoffType = 'doctor'; // Default
      
      if (isFreeConsultation) {
        // 🚨 FREE CONSULTATION: Use MEMBERSHIP cutoff
        cutoffPercentage = cutoffSettingsData?.membershipCutoff || 20;
        cutoffType = 'membership';
        console.log(`✅ FREE Consultation: Order ${appointment._id}, Using MEMBERSHIP cutoff: ${cutoffPercentage}%`);
      } else {
        // 🚨 PAID CONSULTATION: Use DOCTOR cutoff
        cutoffPercentage = cutoffSettingsData?.doctorCutoff || 5;
        cutoffType = 'doctor';
      }
      
      const cutoffAmount = (price * cutoffPercentage) / 100;
      const vendorPayout = price - cutoffAmount;
      
      // Doctor details
      let doctorDetails = {};
      
      if (appointment.doctorId && typeof appointment.doctorId === 'object') {
        doctorDetails = {
          name: appointment.doctorId.name,
          email: appointment.doctorId.email,
          phone: appointment.doctorId.phone,
          qualification: appointment.doctorId.qualification,
          specialist: appointment.doctorId.specialist,
          personalClinicId: appointment.doctorId.ClinicId
        };
      }

      return {
        appointment: appointment.toObject(),
        doctor: doctorDetails,
        patient: {
          name: appointment.patientId?.name || 'N/A',
          phone: appointment.patientId?.phone || 'N/A',
          dob: appointment.patientId?.dob || 'N/A',
          gender: appointment.patientId?.gender || 'N/A'
        },
        coupon: appointment.couponId ? {
          couponCode: appointment.couponId.couponCode,
          discountType: appointment.couponId.discountType,
          discountValue: appointment.couponId.discountValue
        } : {},
        prescription: prescriptionMap[appointment._id.toString()] ? {
          _id: prescriptionMap[appointment._id.toString()]._id,
          insuranceName: prescriptionMap[appointment._id.toString()].addInsuranceTypeId?.addInsurance,
          insuranceImage: prescriptionMap[appointment._id.toString()].addInsuranceTypeId?.insuranceImage
        } : {},
        cutoffPercentage,
        cutoffType, // Add cutoff type for reference
        cutoffAmount: parseFloat(cutoffAmount.toFixed(2)),
        vendorPayout: parseFloat(vendorPayout.toFixed(2)),
        originalPrice: price,
        orderType: 'doctor',
        id: appointment._id,
        displayId: `DOC-${appointment._id.toString().slice(-8)}`,
        
        // 🚨 FREE CONSULTATION FLAGS
        isFreeConsultation: isFreeConsultation,
        membershipConsultationUsed: appointment.membershipConsultationUsed || false,
        userMembershipId: appointment.userMembershipId || null,
        
        // Important: Clinic check
        isClinicAppointment: !!appointment.clinicId,
        appointmentClinicId: appointment.clinicId,
        
        // 🚨 Financial breakdown for free consultations
        financialBreakdown: isFreeConsultation ? {
          originalConsultationFee: price,
          membershipDiscount: price, // Full discount
          amountPaid: 0,
          adminCutoffPercentage: cutoffPercentage,
          adminCutoffAmount: parseFloat(cutoffAmount.toFixed(2)),
          doctorPayout: parseFloat(vendorPayout.toFixed(2)),
          cutoffSource: 'membership'
        } : null
      };
    });

    // ✅ FIX: Calculate totals
    let totalRevenue = 0;
    let totalAdminEarnings = 0;

    ordersWithCutoff.forEach(order => {
      totalRevenue += order.originalPrice || 0;
      totalAdminEarnings += order.cutoffAmount || 0;
    });

    const totalPages = Math.ceil(totalOrders / limitNum);

    res.json({
      success: true,
      message: "Independent doctor orders fetched successfully",
      count: ordersWithCutoff.length,
      totalOrders: totalOrders,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalAdminEarnings: parseFloat(totalAdminEarnings.toFixed(2)),
      pagination: {
        currentPage: pageNum,
        totalPages: totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
        limit: limitNum
      },
      data: ordersWithCutoff,
      cutoffSettings: {
        doctorCutoff: cutoffSettingsData?.doctorCutoff || 5,
        membershipCutoff: cutoffSettingsData?.membershipCutoff || 20,
        freeConsultationsUseMembershipCutoff: true // Flag to indicate logic
      }
    });
    
  } catch (error) {
    console.error("Doctor orders error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Update individual order cutoff (if needed for specific orders)
// Update individual order cutoff - UPDATED WITH CLINIC
router.put('/orders/:orderId/cutoff', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { cutoffPercentage, orderType } = req.body;

    if (!orderType) {
      return res.status(400).json({ 
        success: false,
        message: "Order type is required" 
      });
    }

    let order;
    let collection;

    switch (orderType) {
      case 'food':
        order = await FoodOrder.findById(orderId);
        collection = 'FoodOrder';
        break;
      case 'pharmacy':
        order = await OrderPharmacy.findById(orderId);
        collection = 'OrderPharmacy';
        break;
      case 'lab':
      case 'doctor':
      case 'clinic': // ✅ CLINIC ADD KIYA
        order = await Appointment.findById(orderId);
        collection = 'Appointment';
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
        message: 'Order not found' 
      });
    }

    // Update individual order cutoff
    order.cutoffPercentage = cutoffPercentage;
    
    // Calculate and update earnings
    const price = getOrderPrice(order, orderType);
    const cutoffAmount = (price * cutoffPercentage) / 100;
    const vendorPayout = price - cutoffAmount;
    
    order.adminEarnings = cutoffAmount;
    order.vendorPayout = vendorPayout;
    
    await order.save();

    res.json({ 
      success: true,
      message: 'Order cutoff percentage updated successfully',
      orderType,
      cutoffPercentage,
      cutoffAmount,
      vendorPayout,
      collection
    });
    
  } catch (error) {
    console.error("Cutoff update error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Helper function to calculate cutoff
// 🚨 UPDATED: Helper function to calculate cutoff with FREE CONSULTATION LOGIC
// 🚨 UPDATED: Helper function to calculate cutoff with FREE CONSULTATION LOGIC
// 🚨 UPDATED: Helper function to calculate cutoff with FREE CONSULTATION LOGIC
function calculateCutoff(price, cutoffPercentage, isFreeConsultation = false, orderType = '') {
  // Check if valid price
  if (!price || isNaN(price)) {
    price = 0;
  }
  
  // 🚨 SPECIAL LOGIC: For FREE consultations in clinics
  if (isFreeConsultation && (orderType === 'clinic' || orderType === 'doctor')) {
    // For free consultations, we apply membership cutoff
    // Price is 0 but original price is used for calculation
    const cutoffAmount = (price * cutoffPercentage) / 100;
    const vendorPayout = price - cutoffAmount;
    
    return {
      cutoffAmount: parseFloat(cutoffAmount.toFixed(2)),
      vendorPayout: parseFloat(vendorPayout.toFixed(2)),
      isFreeConsultation: true,
      originalPrice: price
    };
  }
  
  const cutoffAmount = (price * cutoffPercentage) / 100;
  const vendorPayout = price - cutoffAmount;
  
  return {
    cutoffAmount: parseFloat(cutoffAmount.toFixed(2)),
    vendorPayout: parseFloat(vendorPayout.toFixed(2))
  };
}

// 🚨 UPDATED: Helper function to get order price based on type
function getOrderPrice(order, orderType) {
  if (!order) return 0;
  
  try {
    switch (orderType) {
      case 'food':
        return parseFloat(order.price || order.items?.reduce((sum, item) => sum + (item.finalprice || 0), 0) || 0);
      case 'pharmacy':
        return parseFloat(order.grandTotal || order.subTotal || 0);
      case 'lab':
        return parseFloat(order.price || 0);
      case 'doctor':
        // For aggregation results, use appointment.price
        if (order.appointment?.price) {
          return parseFloat(order.appointment.price);
        }
        return parseFloat(order.price || 0);
      case 'clinic':
        return parseFloat(order.price || 0);
      case 'membership':
        return parseFloat(order.pricePaid || 0);
      default:
        return 0;
    }
  } catch (error) {
    console.error(`Error getting price for ${orderType} order:`, error);
    return 0;
  }
}

// Helper function to get order price based on type
// Helper function to get order price based on type - UPDATED WITH CLINIC
function getOrderPrice(order, orderType) {
  switch (orderType) {
    case 'food':
      return parseFloat(order.price || order.items?.reduce((sum, item) => sum + (item.finalprice || 0), 0) || 0);
    case 'pharmacy':
      return parseFloat(order.grandTotal || order.subTotal || 0);
    case 'lab':
      return parseFloat(order.price || 0);
    case 'doctor':
      return parseFloat(order.appointment?.price || order.price || 0);
    case 'clinic':
      return parseFloat(order.price || 0);
    case 'membership':  // ✅ MEMBERSHIP ADD KIYA
      return parseFloat(order.pricePaid || 0);
    default:
      return 0;
  }
}

// Dashboard stats with cutoff calculations
// Dashboard stats with cutoff calculations - UPDATED
router.get('/dashboard-stats', async (req, res) => {
  try {
    const cutoffSettings = await CutoffSettings.findOne();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get counts - MEMBERSHIP ADD KIYA
    const [
      totalFoodOrders,
      totalPharmacyOrders,
      totalLabOrders,
      totalIndependentDoctorOrders,
      totalClinicOrders,
      totalMembershipPurchases,
      todayFoodOrders,
      todayPharmacyOrders,
      todayLabOrders,
      todayIndependentDoctorOrders,
      todayClinicOrders,
      todayMembershipPurchases
    ] = await Promise.all([
      // Total counts
      FoodOrder.countDocuments(),
      OrderPharmacy.countDocuments(),
      Appointment.countDocuments({
        $or: [
          { serviceType: 'lab' },
          { serviceType: 'Lab Test' },
          { serviceType: 'Walkin Collection' },
          { serviceType: 'Home Collection' },
          { method: { $in: ['Test', 'Package'] } }
        ]
      }),
      // Independent doctors
      Appointment.countDocuments({
        doctorId: { $exists: true, $ne: null },
        vendorId: { $in: [null, undefined] },
        $or: [
          { clinicId: null },
          { clinicId: { $exists: false } }
        ]
      }),
      // Clinic appointments
      Appointment.countDocuments({
        clinicId: { $exists: true, $ne: null }
      }),
      // Membership purchases
      MembershipPurchase.countDocuments({ paymentStatus: 'completed' }),
      
      // Today's counts
      FoodOrder.countDocuments({ createdAt: { $gte: today } }),
      OrderPharmacy.countDocuments({ createdAt: { $gte: today } }),
      Appointment.countDocuments({
        createdAt: { $gte: today },
        $or: [
          { serviceType: 'lab' },
          { serviceType: 'Lab Test' },
          { serviceType: 'Walkin Collection' },
          { serviceType: 'Home Collection' },
          { method: { $in: ['Test', 'Package'] } }
        ]
      }),
      // Today's independent doctors
      Appointment.countDocuments({
        createdAt: { $gte: today },
        doctorId: { $exists: true, $ne: null },
        vendorId: { $in: [null, undefined] },
        $or: [
          { clinicId: null },
          { clinicId: { $exists: false } }
        ]
      }),
      // Today's clinic appointments
      Appointment.countDocuments({
        createdAt: { $gte: today },
        clinicId: { $exists: true, $ne: null }
      }),
      // Today's membership purchases
      MembershipPurchase.countDocuments({
        paymentStatus: 'completed',
        createdAt: { $gte: today }
      })
    ]);

    const totalOrders = totalFoodOrders + totalPharmacyOrders + totalLabOrders + 
                       totalIndependentDoctorOrders + totalClinicOrders + totalMembershipPurchases;
    
    const todayOrders = todayFoodOrders + todayPharmacyOrders + todayLabOrders + 
                       todayIndependentDoctorOrders + todayClinicOrders + todayMembershipPurchases;

    const stats = {
      totalOrders,
      todayOrders,
      orderBreakdown: {
        food: totalFoodOrders,
        pharmacy: totalPharmacyOrders,
        lab: totalLabOrders,
        doctor: totalIndependentDoctorOrders,
        clinic: totalClinicOrders,
        membership: totalMembershipPurchases  // ✅ MEMBERSHIP ADD KIYA
      },
      todayBreakdown: {
        food: todayFoodOrders,
        pharmacy: todayPharmacyOrders,
        lab: todayLabOrders,
        doctor: todayIndependentDoctorOrders,
        clinic: todayClinicOrders,
        membership: todayMembershipPurchases  // ✅ MEMBERSHIP ADD KIYA
      },
      cutoffSettings: cutoffSettings || {
        foodCutoff: 5,
        pharmacyCutoff: 5,
        labCutoff: 5,
        doctorCutoff: 5,
        clinicCutoff: 5,
        membershipCutoff: 10  // ✅ MEMBERSHIP CUTOFF ADD KIYA
      }
    };

    res.json({
      success: true,
      message: "Dashboard stats fetched successfully",
      data: stats
    });
    
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});


// Revenue summary with date filter
// Revenue summary with date filter
// Revenue summary with date filter - UPDATED WITH CLINIC
// Revenue summary with date filter - UPDATED WITH CLINIC CUTOFF
// Revenue summary with date filter - UPDATED WITH NEW LOGIC
// Revenue summary with date filter - UPDATED WITH FREE CONSULTATION LOGIC
// Revenue summary with date filter - FIXED VERSION
// Revenue summary with date filter - Add clinic free consultation logic
// ✅ REVENUE SUMMARY WITH CLINIC FREE CONSULTATION LOGIC - FIXED VERSION
// ✅ REVENUE SUMMARY WITH CLINIC FREE CONSULTATION LOGIC - CORRECTED VERSION
router.get('/revenue-summary', adminMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let dateFilter = {};
    
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate + 'T23:59:59.999Z')
        }
      };
    }

    const cutoffSettings = await CutoffSettings.findOne();
    
    console.log("========================================");
    console.log("CALCULATING REVENUE SUMMARY - FIXED VERSION");
    console.log("========================================");

    // ✅ GET ALL ORDERS WITH ERROR HANDLING
    const [foodOrders, pharmacyOrders, labOrders, independentDoctorOrders, clinicOrders, membershipPurchases] = await Promise.all([
      // Food orders
      FoodOrder.find(dateFilter).catch(err => {
        console.error("❌ Error fetching food orders:", err);
        return [];
      }),
      
      // Pharmacy orders
      OrderPharmacy.find(dateFilter).catch(err => {
        console.error("❌ Error fetching pharmacy orders:", err);
        return [];
      }),
      
      // Lab orders
      Appointment.find({
        ...dateFilter,
        $or: [
          { serviceType: 'lab' },
          { serviceType: 'Lab Test' },
          { serviceType: 'Walkin Collection' },
          { serviceType: 'Home Collection' },
          { method: { $in: ['Test', 'Package'] } }
        ]
      }).catch(err => {
        console.error("❌ Error fetching lab orders:", err);
        return [];
      }),
      
      // Independent Doctor orders
      Appointment.find({
        ...dateFilter,
        doctorId: { $exists: true, $ne: null },
        vendorId: { $in: [null, undefined] },
        $or: [
          { clinicId: null },
          { clinicId: { $exists: false } }
        ]
      }).catch(err => {
        console.error("❌ Error fetching independent doctor orders:", err);
        return [];
      }),
      
      // Clinic orders
      Appointment.find({
        ...dateFilter,
        clinicId: { $exists: true, $ne: null }
      }).catch(err => {
        console.error("❌ Error fetching clinic orders:", err);
        return [];
      }),
      
      // Membership purchases
      MembershipPurchase.find({
        ...dateFilter,
        paymentStatus: 'completed'
      }).catch(err => {
        console.error("❌ Error fetching membership purchases:", err);
        return [];
      })
    ]);

    console.log("📊 ORDERS FETCHED:");
    console.log(`✅ Food Orders: ${foodOrders.length}`);
    console.log(`✅ Pharmacy Orders: ${pharmacyOrders.length}`);
    console.log(`✅ Lab Orders: ${labOrders.length}`);
    console.log(`✅ Independent Doctor Orders: ${independentDoctorOrders.length}`);
    console.log(`✅ Clinic Orders: ${clinicOrders.length}`);
    console.log(`✅ Membership Purchases: ${membershipPurchases.length}`);

    // ✅ CUTOFF PERCENTAGES
    const foodCutoff = cutoffSettings?.foodCutoff || 10;
    const pharmacyCutoff = cutoffSettings?.pharmacyCutoff || 5;
    const labCutoff = cutoffSettings?.labCutoff || 5;
    const doctorCutoff = cutoffSettings?.doctorCutoff || 5;
    const clinicCutoff = cutoffSettings?.clinicCutoff || 5;
    const membershipCutoff = cutoffSettings?.membershipCutoff || 20;

    // ✅ CALCULATE FOOD REVENUE
    const foodRevenue = Array.isArray(foodOrders) ? 
      foodOrders.reduce((sum, order) => sum + (parseFloat(order.price) || 0), 0) : 0;
    
    // ✅ CALCULATE PHARMACY REVENUE
    const pharmacyRevenue = Array.isArray(pharmacyOrders) ? 
      pharmacyOrders.reduce((sum, order) => sum + (parseFloat(order.grandTotal) || 0), 0) : 0;
    
    // ✅ CALCULATE LAB REVENUE
    const labRevenue = Array.isArray(labOrders) ? 
      labOrders.reduce((sum, order) => sum + (parseFloat(order.price) || 0), 0) : 0;
    
    // ✅ CALCULATE MEMBERSHIP REVENUE
    const membershipRevenue = Array.isArray(membershipPurchases) ? 
      membershipPurchases.reduce((sum, purchase) => sum + (parseFloat(purchase.pricePaid) || 0), 0) : 0;

    // ✅ CALCULATE DOCTOR REVENUE WITH FREE CONSULTATION LOGIC
    let paidDoctorRevenue = 0;
    let freeDoctorConsultationCount = 0;
    let freeDoctorConsultationRevenue = 0;
    let totalDoctorOrders = 0;

    if (Array.isArray(independentDoctorOrders)) {
      totalDoctorOrders = independentDoctorOrders.length;
      
      independentDoctorOrders.forEach(order => {
        try {
          const price = parseFloat(order.price) || 0;
          if (order.isFreeConsultation === true) {
            freeDoctorConsultationCount++;
            freeDoctorConsultationRevenue += price;
          } else {
            paidDoctorRevenue += price;
          }
        } catch (err) {
          console.error(`Error processing doctor order ${order._id}:`, err);
        }
      });
    }

    console.log(`✅ Doctor Stats: ${totalDoctorOrders} total, ${freeDoctorConsultationCount} free, ${totalDoctorOrders - freeDoctorConsultationCount} paid`);

    // ✅ CALCULATE CLINIC REVENUE WITH CORRECTED FREE CONSULTATION LOGIC
    let clinicPaidRevenue = 0;
    let clinicFreeConsultationCount = 0;
    let clinicFreeConsultationRevenue = 0;
    let totalClinicOrders = 0;

    // Step 1: Get all user IDs from clinic orders to check memberships
    const clinicUserIds = Array.isArray(clinicOrders) ? 
      [...new Set(clinicOrders.map(order => order.userId?.toString()).filter(id => id))] : [];
    
    let clinicMembershipMap = {};
    
    if (clinicUserIds.length > 0) {
      const clinicUserMemberships = await UserMemberShip.find({
        userId: { $in: clinicUserIds },
        isActive: true,
        endDate: { $gt: new Date() }
      }).catch(err => {
        console.error("Error fetching clinic user memberships:", err);
        return [];
      });
      
      clinicUserMemberships.forEach(membership => {
        const userId = membership.userId.toString();
        if (!clinicMembershipMap[userId]) {
          clinicMembershipMap[userId] = [];
        }
        clinicMembershipMap[userId].push(membership);
      });
    }

    if (Array.isArray(clinicOrders)) {
      totalClinicOrders = clinicOrders.length;
      
      // Step 2: Process each clinic order with CORRECTED LOGIC
      clinicOrders.forEach(order => {
        try {
          const price = parseFloat(order.price) || 0;
          const userId = order.userId?.toString();
          
          let isFreeConsultation = false;
          let freeConsultationType = 'none';
          
          // Method 1: Check appointment flag (direct flag)
          if (order.isFreeConsultation === true) {
            isFreeConsultation = true;
            freeConsultationType = 'appointment_flag';
          }
          // Method 2: Check if appointment is linked to membership
          else if (order.userMembershipId) {
            // ✅ FIXED: Check if this specific membership exists and has remaining consultations
            const membershipId = order.userMembershipId.toString();
            if (userId && clinicMembershipMap[userId]) {
              const matchingMembership = clinicMembershipMap[userId].find(
                membership => membership._id.toString() === membershipId
              );
              if (matchingMembership) {
                const consultationsUsed = matchingMembership.consultationsUsed || 0;
                const consultationLimit = matchingMembership.consultationLimit || 0;
                const consultationsRemaining = consultationLimit - consultationsUsed;
                
                if (consultationsRemaining > 0) {
                  isFreeConsultation = true;
                  freeConsultationType = 'membership_linked';
                }
              }
            }
          }
          // Method 3: Check user's active memberships (if no direct link)
          else if (userId && clinicMembershipMap[userId]) {
            const activeMemberships = clinicMembershipMap[userId];
            let hasAvailableConsultation = false;
            
            for (const membership of activeMemberships) {
              const consultationsUsed = membership.consultationsUsed || 0;
              const consultationLimit = membership.consultationLimit || 0;
              const consultationsRemaining = consultationLimit - consultationsUsed;
              
              if (consultationsRemaining > 0) {
                hasAvailableConsultation = true;
                break;
              }
            }
            
            // ✅ IMPORTANT: Agar user ke paas membership hai lekin appointment specific membership se link nahi hai,
            // toh bhi consider karo ke free consultation ho sakta hai
            if (hasAvailableConsultation) {
              // Check appointment date vs membership dates
              const appointmentDate = new Date(order.createdAt);
              for (const membership of activeMemberships) {
                if (appointmentDate >= membership.startDate && appointmentDate <= membership.endDate) {
                  isFreeConsultation = true;
                  freeConsultationType = 'user_has_active_membership';
                  break;
                }
              }
            }
          }
          
          if (isFreeConsultation) {
            clinicFreeConsultationCount++;
            clinicFreeConsultationRevenue += price;
            console.log(`🆓 Clinic Free Consultation: ${order._id}, Type: ${freeConsultationType}, Price: ${price}`);
          } else {
            clinicPaidRevenue += price;
            console.log(`💰 Clinic Paid Consultation: ${order._id}, Price: ${price}`);
          }
        } catch (err) {
          console.error(`Error processing clinic order ${order._id}:`, err);
        }
      });
    }

    console.log(`✅ Clinic Stats: ${totalClinicOrders} total, ${clinicFreeConsultationCount} free, ${clinicPaidRevenue} paid revenue`);

    // ✅ CALCULATE EARNINGS
    // Food earnings
    const foodEarnings = (foodRevenue * foodCutoff) / 100;
    
    // Pharmacy earnings
    const pharmacyEarnings = (pharmacyRevenue * pharmacyCutoff) / 100;
    
    // Lab earnings
    const labEarnings = (labRevenue * labCutoff) / 100;
    
    // ✅ Doctor earnings with different cutoffs
    const paidDoctorEarnings = (paidDoctorRevenue * doctorCutoff) / 100;
    const freeDoctorConsultationEarnings = (freeDoctorConsultationRevenue * membershipCutoff) / 100;
    const totalDoctorEarnings = paidDoctorEarnings + freeDoctorConsultationEarnings;
    const doctorRevenue = paidDoctorRevenue + freeDoctorConsultationRevenue;
    
    // ✅ Clinic earnings with different cutoffs
    const clinicPaidEarnings = (clinicPaidRevenue * clinicCutoff) / 100;
    const clinicFreeConsultationEarnings = (clinicFreeConsultationRevenue * membershipCutoff) / 100;
    const totalClinicEarnings = clinicPaidEarnings + clinicFreeConsultationEarnings;
    const clinicRevenue = clinicPaidRevenue + clinicFreeConsultationRevenue;
    
    // Membership earnings
    const membershipEarnings = (membershipRevenue * membershipCutoff) / 100;

    // ✅ CALCULATE TOTALS
    const totalRevenue = foodRevenue + pharmacyRevenue + labRevenue + doctorRevenue + clinicRevenue + membershipRevenue;
    const totalEarnings = foodEarnings + pharmacyEarnings + labEarnings + totalDoctorEarnings + totalClinicEarnings + membershipEarnings;

    console.log("💰 REVENUE BREAKDOWN:");
    console.log(`✅ Food: ₹${foodRevenue.toFixed(2)}`);
    console.log(`✅ Pharmacy: ₹${pharmacyRevenue.toFixed(2)}`);
    console.log(`✅ Lab: ₹${labRevenue.toFixed(2)}`);
    console.log(`✅ Doctor: ₹${doctorRevenue.toFixed(2)} (${freeDoctorConsultationCount} free)`);
    console.log(`✅ Clinic: ₹${clinicRevenue.toFixed(2)} (${clinicFreeConsultationCount} free)`);
    console.log(`✅ Membership: ₹${membershipRevenue.toFixed(2)}`);
    console.log(`✅ TOTAL REVENUE: ₹${totalRevenue.toFixed(2)}`);
    console.log(`✅ TOTAL EARNINGS: ₹${totalEarnings.toFixed(2)}`);

    // ✅ PREPARE SUMMARY RESPONSE
    const summary = {
      // Food
      foodRevenue: parseFloat(foodRevenue.toFixed(2)),
      foodOrders: Array.isArray(foodOrders) ? foodOrders.length : 0,
      foodEarnings: parseFloat(foodEarnings.toFixed(2)),
      foodCutoffPercentage: foodCutoff,
      
      // Pharmacy
      pharmacyRevenue: parseFloat(pharmacyRevenue.toFixed(2)),
      pharmacyOrders: Array.isArray(pharmacyOrders) ? pharmacyOrders.length : 0,
      pharmacyEarnings: parseFloat(pharmacyEarnings.toFixed(2)),
      pharmacyCutoffPercentage: pharmacyCutoff,
      
      // Lab
      labRevenue: parseFloat(labRevenue.toFixed(2)),
      labOrders: Array.isArray(labOrders) ? labOrders.length : 0,
      labEarnings: parseFloat(labEarnings.toFixed(2)),
      labCutoffPercentage: labCutoff,
      
      // Doctor
      doctorRevenue: parseFloat(doctorRevenue.toFixed(2)),
      doctorOrders: totalDoctorOrders,
      doctorEarnings: parseFloat(totalDoctorEarnings.toFixed(2)),
      doctorCutoffPercentage: doctorCutoff,
      
      // ✅ DOCTOR FREE CONSULTATION BREAKDOWN
      doctorFreeConsultations: {
        count: freeDoctorConsultationCount,
        paidCount: totalDoctorOrders - freeDoctorConsultationCount,
        originalConsultationFees: parseFloat(freeDoctorConsultationRevenue.toFixed(2)),
        earnings: parseFloat(freeDoctorConsultationEarnings.toFixed(2)),
        cutoffPercentage: membershipCutoff,
        doctorPaidEarnings: parseFloat(paidDoctorEarnings.toFixed(2)),
        paidCutoffPercentage: doctorCutoff,
        freePercentage: totalDoctorOrders > 0 ? parseFloat(((freeDoctorConsultationCount / totalDoctorOrders) * 100).toFixed(2)) : 0
      },

      // Clinic
      clinicRevenue: parseFloat(clinicRevenue.toFixed(2)),
      clinicOrders: totalClinicOrders,
      clinicEarnings: parseFloat(totalClinicEarnings.toFixed(2)),
      clinicCutoffPercentage: clinicCutoff,
      
      // ✅ CLINIC FREE CONSULTATION BREAKDOWN (CORRECTED)
      clinicFreeConsultations: {
        count: clinicFreeConsultationCount,
        paidCount: totalClinicOrders - clinicFreeConsultationCount,
        originalConsultationFees: parseFloat(clinicFreeConsultationRevenue.toFixed(2)),
        earnings: parseFloat(clinicFreeConsultationEarnings.toFixed(2)),
        cutoffPercentage: membershipCutoff,
        clinicPaidEarnings: parseFloat(clinicPaidEarnings.toFixed(2)),
        paidCutoffPercentage: clinicCutoff,
        freePercentage: totalClinicOrders > 0 ? parseFloat(((clinicFreeConsultationCount / totalClinicOrders) * 100).toFixed(2)) : 0,
        freeVsPaidRatio: totalClinicOrders > 0 ? 
          `${clinicFreeConsultationCount}:${totalClinicOrders - clinicFreeConsultationCount}` : '0:0'
      },

      // Membership
      membershipRevenue: parseFloat(membershipRevenue.toFixed(2)),
      membershipOrders: Array.isArray(membershipPurchases) ? membershipPurchases.length : 0,
      membershipEarnings: parseFloat(membershipEarnings.toFixed(2)),
      membershipCutoffPercentage: membershipCutoff,

      // ✅ TOTALS
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalEarnings: parseFloat(totalEarnings.toFixed(2)),
      totalOrders: (Array.isArray(foodOrders) ? foodOrders.length : 0) +
                   (Array.isArray(pharmacyOrders) ? pharmacyOrders.length : 0) +
                   (Array.isArray(labOrders) ? labOrders.length : 0) +
                   totalDoctorOrders +
                   totalClinicOrders +
                   (Array.isArray(membershipPurchases) ? membershipPurchases.length : 0),
      
      // ✅ BREAKDOWN PERCENTAGES
      breakdownPercentages: totalRevenue > 0 ? {
        food: parseFloat(((foodRevenue / totalRevenue) * 100).toFixed(2)),
        pharmacy: parseFloat(((pharmacyRevenue / totalRevenue) * 100).toFixed(2)),
        lab: parseFloat(((labRevenue / totalRevenue) * 100).toFixed(2)),
        doctor: parseFloat(((doctorRevenue / totalRevenue) * 100).toFixed(2)),
        clinic: parseFloat(((clinicRevenue / totalRevenue) * 100).toFixed(2)),
        membership: parseFloat(((membershipRevenue / totalRevenue) * 100).toFixed(2))
      } : {
        food: 0,
        pharmacy: 0,
        lab: 0,
        doctor: 0,
        clinic: 0,
        membership: 0
      }
    };

    res.json({
      success: true,
      message: "Revenue summary fetched successfully",
      data: summary,
      metadata: {
        dateFilter: startDate && endDate ? { startDate, endDate } : 'all',
        cutoffSettings: {
          foodCutoff,
          pharmacyCutoff,
          labCutoff,
          doctorCutoff,
          clinicCutoff,
          membershipCutoff
        },
        freeConsultationLogic: {
          doctor: "Free doctor consultations use membership cutoff (20%) instead of doctor cutoff (5%)",
          clinic: "Free clinic consultations use membership cutoff (20%) instead of clinic cutoff (5%)",
          checkMethods: [
            "1. appointment_flag (isFreeConsultation = true)",
            "2. membership_linked (userMembershipId with remaining consultations)",
            "3. user_has_active_membership (user has active membership with consultations)"
          ]
        },
        calculationTimestamp: new Date().toISOString(),
        clinicLogicMatch: "✅ Clinic free consultation logic now matches clinic-orders API"
      }
    });

  } catch (error) {
    console.error("❌ Revenue summary error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all vendors with earnings summary
// Get all vendors with earnings summary - FIXED VERSION
// Get all vendors with earnings summary - COMPLETELY FIXED VERSION
// Food vendors ko properly fetch aur calculate karne ke liye
// Get all vendors with earnings summary - UPDATED WITH CLINIC
// Get all vendors with earnings summary - UPDATED WITH FREE CONSULTATION LOGIC
// Get all vendors with earnings summary - COMPLETE FIXED VERSION
router.get('/vendor-earnings', async (req, res) => {
  try {
    const { period = 'all' } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get cutoff settings
    const cutoffSettings = await CutoffSettings.findOne();

    console.log("========================================");
    console.log("FETCHING VENDOR EARNINGS - START");
    console.log("========================================");

    // ✅ FIX: Fetch all vendors with error handling
    const [allVendorsFromDB, doctorVendors, clinicVendors] = await Promise.all([
      mongoose.connection.db.collection('vandors').find({}).toArray().catch(err => {
        console.error("Error fetching vendors:", err);
        return [];
      }),
      mongoose.connection.db.collection('doctors').find({}).toArray().catch(err => {
        console.error("Error fetching doctors:", err);
        return [];
      }),
      mongoose.connection.db.collection('clinics').find({}).toArray().catch(err => {
        console.error("Error fetching clinics:", err);
        return [];
      })
    ]);

    console.log(`Found ${allVendorsFromDB.length} vendors from vandors collection`);
    console.log(`Found ${doctorVendors.length} doctors from doctors collection`);
    console.log(`Found ${clinicVendors.length} clinics from clinics collection`);

    // ✅ FIX: Vendor categorization with checks
    const foodVendors = Array.isArray(allVendorsFromDB) ? allVendorsFromDB.filter(vendor => {
      const vendorType = (vendor.vendor || '').toLowerCase();
      const vendorTypeField = (vendor.vendorType || '').toLowerCase();
      const shopName = (vendor.shopName || '').toLowerCase();
      const name = (vendor.name || '').toLowerCase();
      
      return (
        vendorType.includes('food') ||
        vendorType.includes('restaurant') ||
        vendorTypeField.includes('food') ||
        vendorTypeField.includes('restaurant') ||
        shopName.includes('food') ||
        shopName.includes('restaurant') ||
        shopName.includes('cafe') ||
        shopName.includes('baker') ||
        name.includes('food') ||
        name.includes('restaurant') ||
        name.includes('cafe') ||
        (vendorType === '' && vendorTypeField === '')
      );
    }) : [];
    
    const pharmacyVendors = Array.isArray(allVendorsFromDB) ? allVendorsFromDB.filter(vendor => 
      vendor.vendor === 'pharmacy' ||
      vendor.vendorType === 'pharmacy' ||
      (vendor.shopName && vendor.shopName.toLowerCase().includes('pharmacy')) ||
      (vendor.name && vendor.name.toLowerCase().includes('pharmacy'))
    ) : [];
    
    const labVendors = Array.isArray(allVendorsFromDB) ? allVendorsFromDB.filter(vendor => 
      vendor.vendor === 'lab' ||
      vendor.vendorType === 'lab' ||
      (vendor.shopName && vendor.shopName.toLowerCase().includes('lab')) ||
      (vendor.name && vendor.name.toLowerCase().includes('lab'))
    ) : [];

    console.log(`\nVendor categorization:`);
    console.log(`- Food: ${foodVendors.length}`);
    console.log(`- Pharmacy: ${pharmacyVendors.length}`);
    console.log(`- Lab: ${labVendors.length}`);
    console.log(`- Doctors: ${doctorVendors.length}`);
    console.log(`- Clinics: ${clinicVendors.length}`);

    // ✅ FIX: Calculate earnings for each vendor type
    const foodVendorsEarnings = await calculateFoodVendorEarnings(foodVendors, period, cutoffSettings, today, startOfWeek, startOfMonth);
    const pharmacyVendorsEarnings = await calculatePharmacyVendorEarnings(pharmacyVendors, period, cutoffSettings, today, startOfWeek, startOfMonth);
    const labVendorsEarnings = await calculateLabVendorEarnings(labVendors, period, cutoffSettings, today, startOfWeek, startOfMonth);
    
    // ✅ FIX: Doctor Vendor Earnings Calculation with FREE consultation logic
    const doctorVendorsEarnings = await Promise.all(
      doctorVendors.map(async (doctor) => {
        try {
          console.log(`Calculating earnings for doctor: ${doctor.name} (${doctor._id})`);
          
          // Get ALL appointments for this doctor
          const allAppointments = await Appointment.find({
            doctorId: doctor._id.toString()
          }).catch(err => {
            console.error(`Error fetching appointments for doctor ${doctor._id}:`, err);
            return [];
          });

          // Separate FREE and PAID consultations
          let paidAppointments = [];
          let freeAppointments = [];
          let totalRevenue = 0;
          let paidRevenue = 0;
          let freeConsultationRevenue = 0; // Original consultation fees for free consults

          allAppointments.forEach(appointment => {
            try {
              const price = parseFloat(appointment.price) || 0;
              totalRevenue += price;
              
              if (appointment.isFreeConsultation) {
                freeAppointments.push(appointment);
                freeConsultationRevenue += price; // Original consultation fee
              } else {
                paidAppointments.push(appointment);
                paidRevenue += price;
              }
            } catch (err) {
              console.error(`Error processing appointment ${appointment._id}:`, err);
            }
          });

          const doctorCutoff = cutoffSettings?.doctorCutoff || 5;
          const membershipCutoff = cutoffSettings?.membershipCutoff || 20;

          // Calculate earnings
          const paidEarnings = (paidRevenue * (100 - doctorCutoff)) / 100;
          const freeConsultationEarnings = (freeConsultationRevenue * (100 - membershipCutoff)) / 100; // 🚨 Use membership cutoff
          const totalEarnings = paidEarnings + freeConsultationEarnings;

          // ✅ FIX: Time-based calculations - Helper function define करें
          const calculateTimeBasedEarningsFunc = (appointments, startDate, docCutoff, memCutoff) => {
            let paidRev = 0;
            let freeRev = 0;

            appointments
              .filter(apt => new Date(apt.createdAt) >= startDate)
              .forEach(appointment => {
                const price = parseFloat(appointment.price) || 0;
                if (appointment.isFreeConsultation) {
                  freeRev += price;
                } else {
                  paidRev += price;
                }
              });

            const paidEarn = (paidRev * (100 - docCutoff)) / 100;
            const freeEarn = (freeRev * (100 - memCutoff)) / 100;
            
            return paidEarn + freeEarn;
          };

          const todayEarnings = calculateTimeBasedEarningsFunc(allAppointments, today, doctorCutoff, membershipCutoff);
          const weeklyEarnings = calculateTimeBasedEarningsFunc(allAppointments, startOfWeek, doctorCutoff, membershipCutoff);
          const monthlyEarnings = calculateTimeBasedEarningsFunc(allAppointments, startOfMonth, doctorCutoff, membershipCutoff);

          // Count orders
          const totalOrders = allAppointments.length;
          const todayOrders = allAppointments.filter(apt => new Date(apt.createdAt) >= today).length;
          const weeklyOrders = allAppointments.filter(apt => new Date(apt.createdAt) >= startOfWeek).length;
          const monthlyOrders = allAppointments.filter(apt => new Date(apt.createdAt) >= startOfMonth).length;

          return {
            _id: doctor._id,
            name: doctor.name || 'Unknown Doctor',
            email: doctor.email || 'N/A',
            phone: doctor.phoneNumber || doctor.phone || 'N/A',
            type: 'doctor',
            shopName: doctor.clinicName || doctor.hospitalName || doctor.shopName || 'N/A',
            totalEarnings: parseFloat(totalEarnings.toFixed(2)),
            todayEarnings: parseFloat(todayEarnings.toFixed(2)),
            weeklyEarnings: parseFloat(weeklyEarnings.toFixed(2)),
            monthlyEarnings: parseFloat(monthlyEarnings.toFixed(2)),
            orders: {
              total: totalOrders,
              paid: paidAppointments.length,
              free: freeAppointments.length,
              today: todayOrders,
              weekly: weeklyOrders,
              monthly: monthlyOrders
            },
            isActive: doctor.Accountverify === '1',
            qualification: doctor.qualification || 'N/A',
            specialist: doctor.specialist || 'N/A',
            loginType: doctor.loginType || 'standalone',
            
            // 🚨 NEW: Free consultation stats
            freeConsultationStats: {
              count: freeAppointments.length,
              originalRevenue: parseFloat(freeConsultationRevenue.toFixed(2)),
              earnings: parseFloat(freeConsultationEarnings.toFixed(2)),
              cutoffPercentage: membershipCutoff,
              doctorPayout: parseFloat(freeConsultationEarnings.toFixed(2))
            },
            
            debug: {
              totalAppointments: allAppointments.length,
              paidAppointments: paidAppointments.length,
              freeAppointments: freeAppointments.length,
              paidRevenue: parseFloat(paidRevenue.toFixed(2)),
              freeConsultationRevenue: parseFloat(freeConsultationRevenue.toFixed(2)),
              doctorCutoff: doctorCutoff,
              membershipCutoff: membershipCutoff
            }
          };
        } catch (error) {
          console.error(`Error calculating earnings for doctor ${doctor._id}:`, error);
          // Return doctor with zero earnings instead of null
          return {
            _id: doctor._id,
            name: doctor.name || 'Unknown Doctor',
            email: doctor.email || 'N/A',
            phone: doctor.phoneNumber || doctor.phone || 'N/A',
            type: 'doctor',
            shopName: doctor.clinicName || doctor.hospitalName || doctor.shopName || 'N/A',
            totalEarnings: 0,
            todayEarnings: 0,
            weeklyEarnings: 0,
            monthlyEarnings: 0,
            orders: {
              total: 0,
              paid: 0,
              free: 0,
              today: 0,
              weekly: 0,
              monthly: 0
            },
            isActive: doctor.Accountverify === '1',
            qualification: doctor.qualification || 'N/A',
            specialist: doctor.specialist || 'N/A',
            loginType: doctor.loginType || 'standalone',
            freeConsultationStats: {
              count: 0,
              originalRevenue: 0,
              earnings: 0,
              cutoffPercentage: 0
            },
            error: error.message
          };
        }
      })
    );

    // ✅ FIX: Clinic Earnings Calculation
    const clinicVendorsEarnings = await Promise.all(
      clinicVendors.map(async (clinic) => {
        try {
          console.log(`Calculating earnings for clinic: ${clinic.name} (${clinic._id})`);
          
          // Get clinic appointments
          const clinicAppointments = await Appointment.find({
            clinicId: clinic._id.toString()
          }).catch(err => {
            console.error(`Error fetching appointments for clinic ${clinic._id}:`, err);
            return [];
          });

          const clinicCutoff = cutoffSettings?.clinicCutoff || 5;

          // Calculate revenue from appointments
          const totalRevenue = clinicAppointments.reduce((sum, appointment) => 
            sum + (parseFloat(appointment.price) || 0), 0
          );
          
          const todayRevenue = clinicAppointments
            .filter(apt => new Date(apt.createdAt) >= today)
            .reduce((sum, appointment) => sum + (parseFloat(appointment.price) || 0), 0);
          
          const weeklyRevenue = clinicAppointments
            .filter(apt => new Date(apt.createdAt) >= startOfWeek)
            .reduce((sum, appointment) => sum + (parseFloat(appointment.price) || 0), 0);
          
          const monthlyRevenue = clinicAppointments
            .filter(apt => new Date(apt.createdAt) >= startOfMonth)
            .reduce((sum, appointment) => sum + (parseFloat(appointment.price) || 0), 0);

          // Calculate clinic payout
          const totalEarnings = (totalRevenue * (100 - clinicCutoff)) / 100;
          const todayEarnings = (todayRevenue * (100 - clinicCutoff)) / 100;
          const weeklyEarnings = (weeklyRevenue * (100 - clinicCutoff)) / 100;
          const monthlyEarnings = (monthlyRevenue * (100 - clinicCutoff)) / 100;

          // Count orders
          const totalOrders = clinicAppointments.length;
          const todayOrders = clinicAppointments.filter(apt => new Date(apt.createdAt) >= today).length;
          const weeklyOrders = clinicAppointments.filter(apt => new Date(apt.createdAt) >= startOfWeek).length;
          const monthlyOrders = clinicAppointments.filter(apt => new Date(apt.createdAt) >= startOfMonth).length;

          return {
            _id: clinic._id,
            name: clinic.name || clinic.clinicName || 'Unknown Clinic',
            email: clinic.email || 'N/A',
            phone: clinic.phoneNumber || 'N/A',
            type: 'clinic',
            shopName: clinic.clinicName || clinic.name || 'N/A',
            totalEarnings: parseFloat(totalEarnings.toFixed(2)),
            todayEarnings: parseFloat(todayEarnings.toFixed(2)),
            weeklyEarnings: parseFloat(weeklyEarnings.toFixed(2)),
            monthlyEarnings: parseFloat(monthlyEarnings.toFixed(2)),
            orders: {
              total: totalOrders,
              today: todayOrders,
              weekly: weeklyOrders,
              monthly: monthlyOrders
            },
            isActive: clinic.Accountverify === '1',
            debug: { 
              appointmentsFound: clinicAppointments.length,
              totalRevenue: totalRevenue
            }
          };
        } catch (error) {
          console.error(`Error calculating earnings for clinic ${clinic._id}:`, error);
          return {
            _id: clinic._id,
            name: clinic.name || clinic.clinicName || 'Unknown Clinic',
            email: clinic.email || 'N/A',
            phone: clinic.phoneNumber || 'N/A',
            type: 'clinic',
            shopName: clinic.clinicName || clinic.name || 'N/A',
            totalEarnings: 0,
            todayEarnings: 0,
            weeklyEarnings: 0,
            monthlyEarnings: 0,
            orders: {
              total: 0,
              today: 0,
              weekly: 0,
              monthly: 0
            },
            isActive: clinic.Accountverify === '1',
            error: error.message
          };
        }
      })
    );

    // ✅ FIX: Filter out null values
    const filteredDoctorEarnings = doctorVendorsEarnings.filter(doctor => doctor !== null);
    const filteredClinicEarnings = clinicVendorsEarnings.filter(clinic => clinic !== null);
    const filteredFoodEarnings = Array.isArray(foodVendorsEarnings) ? foodVendorsEarnings.filter(vendor => vendor !== null) : [];
    const filteredPharmacyEarnings = Array.isArray(pharmacyVendorsEarnings) ? pharmacyVendorsEarnings.filter(vendor => vendor !== null) : [];
    const filteredLabEarnings = Array.isArray(labVendorsEarnings) ? labVendorsEarnings.filter(vendor => vendor !== null) : [];

    // Combine all vendors
    const allVendors = [
      ...filteredFoodEarnings,
      ...filteredPharmacyEarnings,
      ...filteredLabEarnings,
      ...filteredDoctorEarnings,
      ...filteredClinicEarnings
    ];

    // ✅ FIX: Calculate totals
    const totals = {
      totalVendors: allVendors.length,
      totalEarnings: allVendors.reduce((sum, vendor) => sum + (vendor.totalEarnings || 0), 0),
      todayEarnings: allVendors.reduce((sum, vendor) => sum + (vendor.todayEarnings || 0), 0),
      weeklyEarnings: allVendors.reduce((sum, vendor) => sum + (vendor.weeklyEarnings || 0), 0),
      monthlyEarnings: allVendors.reduce((sum, vendor) => sum + (vendor.monthlyEarnings || 0), 0),
      byType: {
        food: filteredFoodEarnings.length,
        pharmacy: filteredPharmacyEarnings.length,
        lab: filteredLabEarnings.length,
        doctor: filteredDoctorEarnings.length,
        clinic: filteredClinicEarnings.length
      },
      doctorStats: {
        totalDoctors: filteredDoctorEarnings.length,
        doctorsWithEarnings: filteredDoctorEarnings.filter(d => d.totalEarnings > 0).length,
        doctorsWithoutEarnings: filteredDoctorEarnings.filter(d => d.totalEarnings === 0).length,
        totalDoctorEarnings: filteredDoctorEarnings.reduce((sum, doc) => sum + (doc.totalEarnings || 0), 0),
        freeConsultationsTotal: filteredDoctorEarnings.reduce((sum, doc) => sum + (doc.freeConsultationStats?.count || 0), 0),
        freeConsultationsEarnings: filteredDoctorEarnings.reduce((sum, doc) => sum + (doc.freeConsultationStats?.earnings || 0), 0)
      }
    };

    console.log("\n========================================");
    console.log("VENDOR EARNINGS SUMMARY");
    console.log("========================================");
    console.log(`Total Vendors: ${totals.totalVendors}`);
    console.log(`Total Earnings: ₹${totals.totalEarnings}`);
    console.log(`Doctor Stats: ${JSON.stringify(totals.doctorStats)}`);
    console.log("========================================\n");

    res.json({
      success: true,
      message: "Vendor earnings fetched successfully",
      data: allVendors,
      totals,
      period,
      cutoffSettings: {
        foodCutoff: cutoffSettings?.foodCutoff || 5,
        pharmacyCutoff: cutoffSettings?.pharmacyCutoff || 5,
        labCutoff: cutoffSettings?.labCutoff || 5,
        doctorCutoff: cutoffSettings?.doctorCutoff || 5,
        clinicCutoff: cutoffSettings?.clinicCutoff || 5,
        membershipCutoff: cutoffSettings?.membershipCutoff || 20
      },
      debug: {
        vendorsInDB: allVendorsFromDB.length,
        vendorsByType: {
          food: foodVendors.length,
          pharmacy: pharmacyVendors.length,
          lab: labVendors.length,
          doctor: doctorVendors.length,
          clinic: clinicVendors.length
        },
        doctorEarningsSummary: totals.doctorStats
      }
    });
    
  } catch (error) {
    console.error("Vendor earnings error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 🚨 NEW: Helper function for time-based earnings with FREE consultation logic
function calculateTimeBasedEarnings(appointments, startDate, doctorCutoff, membershipCutoff) {
  let paidRevenue = 0;
  let freeConsultationRevenue = 0;

  appointments
    .filter(apt => new Date(apt.createdAt) >= startDate)
    .forEach(appointment => {
      const price = parseFloat(appointment.price) || 0;
      if (appointment.isFreeConsultation) {
        freeConsultationRevenue += price;
      } else {
        paidRevenue += price;
      }
    });

  const paidEarnings = (paidRevenue * (100 - doctorCutoff)) / 100;
  const freeConsultationEarnings = (freeConsultationRevenue * (100 - membershipCutoff)) / 100;
  
  return paidEarnings + freeConsultationEarnings;
}
// ✅ NEW: Clinic Earnings Calculation
// ✅ UPDATED: Clinic Earnings Calculation with Clinic Cutoff
// ✅ UPDATED: Clinic Earnings Calculation with FREE consultation logic
async function calculateClinicEarnings(clinics, period, cutoffSettings, today, startOfWeek, startOfMonth) {
  const clinicCutoff = cutoffSettings?.clinicCutoff || 5;
  const membershipCutoff = cutoffSettings?.membershipCutoff || 20;
  
  const clinicEarnings = await Promise.all(
    clinics.map(async (clinic) => {
      try {
        console.log(`Calculating earnings for clinic: ${clinic.name} (${clinic._id})`);
        
        // Get clinic appointments
        const clinicAppointments = await Appointment.find({
          clinicId: clinic._id.toString()
        });

        console.log(`Clinic ${clinic.name} has ${clinicAppointments.length} appointments`);

        if (clinicAppointments.length === 0) {
          return {
            _id: clinic._id,
            name: clinic.name || clinic.clinicName || 'Unknown Clinic',
            email: clinic.email || 'N/A',
            phone: clinic.phoneNumber || 'N/A',
            type: 'clinic',
            shopName: clinic.clinicName || clinic.name || 'N/A',
            totalEarnings: 0,
            todayEarnings: 0,
            weeklyEarnings: 0,
            monthlyEarnings: 0,
            orders: {
              total: 0,
              today: 0,
              weekly: 0,
              monthly: 0
            },
            freeConsultationStats: {
              count: 0,
              earnings: 0,
              cutoffPercentage: membershipCutoff
            },
            isActive: clinic.Accountverify === '1',
            debug: { appointmentsFound: 0 }
          };
        }

        // ✅ NEW: Get user memberships to check free consultations
        const userIds = [...new Set(clinicAppointments.map(apt => apt.userId?.toString()).filter(id => id))];
        const userMemberships = await UserMemberShip.find({
          userId: { $in: userIds },
          isActive: true,
          endDate: { $gt: new Date() }
        });

        const membershipMap = {};
        userMemberships.forEach(membership => {
          const userId = membership.userId.toString();
          if (!membershipMap[userId]) {
            membershipMap[userId] = [];
          }
          membershipMap[userId].push(membership);
        });

        let totalPaidRevenue = 0;
        let totalFreeConsultationRevenue = 0;
        let freeConsultationCount = 0;
        
        let todayPaidRevenue = 0;
        let todayFreeConsultationRevenue = 0;
        let weeklyPaidRevenue = 0;
        let weeklyFreeConsultationRevenue = 0;
        let monthlyPaidRevenue = 0;
        let monthlyFreeConsultationRevenue = 0;

        clinicAppointments.forEach(appointment => {
          const price = parseFloat(appointment.price) || 0;
          const userId = appointment.userId?.toString();
          const appointmentDate = new Date(appointment.createdAt);
          
          let isFreeConsultation = false;
          
          // Check appointment flag
          if (appointment.isFreeConsultation === true) {
            isFreeConsultation = true;
          }
          // Check user membership
          else if (userId && membershipMap[userId]) {
            const activeMemberships = membershipMap[userId];
            for (const membership of activeMemberships) {
              const consultationsUsed = membership.consultationsUsed || 0;
              const consultationLimit = membership.consultationLimit || 0;
              const consultationsRemaining = consultationLimit - consultationsUsed;
              
              if (consultationsRemaining > 0) {
                if (appointment.userMembershipId && 
                    appointment.userMembershipId.toString() === membership._id.toString()) {
                  isFreeConsultation = true;
                  break;
                }
              }
            }
          }
          
          if (isFreeConsultation) {
            totalFreeConsultationRevenue += price;
            freeConsultationCount++;
            
            if (appointmentDate >= today) {
              todayFreeConsultationRevenue += price;
            }
            if (appointmentDate >= startOfWeek) {
              weeklyFreeConsultationRevenue += price;
            }
            if (appointmentDate >= startOfMonth) {
              monthlyFreeConsultationRevenue += price;
            }
          } else {
            totalPaidRevenue += price;
            
            if (appointmentDate >= today) {
              todayPaidRevenue += price;
            }
            if (appointmentDate >= startOfWeek) {
              weeklyPaidRevenue += price;
            }
            if (appointmentDate >= startOfMonth) {
              monthlyPaidRevenue += price;
            }
          }
        });

        // Calculate earnings with different cutoffs
        const paidEarnings = (totalPaidRevenue * (100 - clinicCutoff)) / 100;
        const freeConsultationEarnings = (totalFreeConsultationRevenue * (100 - membershipCutoff)) / 100;
        const totalEarnings = paidEarnings + freeConsultationEarnings;
        
        const todayPaidEarnings = (todayPaidRevenue * (100 - clinicCutoff)) / 100;
        const todayFreeEarnings = (todayFreeConsultationRevenue * (100 - membershipCutoff)) / 100;
        const todayEarnings = todayPaidEarnings + todayFreeEarnings;
        
        const weeklyPaidEarnings = (weeklyPaidRevenue * (100 - clinicCutoff)) / 100;
        const weeklyFreeEarnings = (weeklyFreeConsultationRevenue * (100 - membershipCutoff)) / 100;
        const weeklyEarnings = weeklyPaidEarnings + weeklyFreeEarnings;
        
        const monthlyPaidEarnings = (monthlyPaidRevenue * (100 - clinicCutoff)) / 100;
        const monthlyFreeEarnings = (monthlyFreeConsultationRevenue * (100 - membershipCutoff)) / 100;
        const monthlyEarnings = monthlyPaidEarnings + monthlyFreeEarnings;

        // Count orders
        const totalOrders = clinicAppointments.length;
        const todayOrders = clinicAppointments.filter(apt => new Date(apt.createdAt) >= today).length;
        const weeklyOrders = clinicAppointments.filter(apt => new Date(apt.createdAt) >= startOfWeek).length;
        const monthlyOrders = clinicAppointments.filter(apt => new Date(apt.createdAt) >= startOfMonth).length;

        return {
          _id: clinic._id,
          name: clinic.name || clinic.clinicName || 'Unknown Clinic',
          email: clinic.email || 'N/A',
          phone: clinic.phoneNumber || 'N/A',
          type: 'clinic',
          shopName: clinic.clinicName || clinic.name || 'N/A',
          totalEarnings: parseFloat(totalEarnings.toFixed(2)),
          todayEarnings: parseFloat(todayEarnings.toFixed(2)),
          weeklyEarnings: parseFloat(weeklyEarnings.toFixed(2)),
          monthlyEarnings: parseFloat(monthlyEarnings.toFixed(2)),
          orders: {
            total: totalOrders,
            today: todayOrders,
            weekly: weeklyOrders,
            monthly: monthlyOrders,
            free: freeConsultationCount,
            paid: totalOrders - freeConsultationCount
          },
          freeConsultationStats: {
            count: freeConsultationCount,
            originalRevenue: parseFloat(totalFreeConsultationRevenue.toFixed(2)),
            earnings: parseFloat(freeConsultationEarnings.toFixed(2)),
            cutoffPercentage: membershipCutoff
          },
          isActive: clinic.Accountverify === '1',
          debug: { 
            appointmentsFound: clinicAppointments.length,
            totalPaidRevenue: parseFloat(totalPaidRevenue.toFixed(2)),
            totalFreeConsultationRevenue: parseFloat(totalFreeConsultationRevenue.toFixed(2))
          }
        };
      } catch (error) {
        console.error(`Error calculating earnings for clinic ${clinic._id}:`, error);
        return {
          _id: clinic._id,
          name: clinic.name || clinic.clinicName || 'Unknown Clinic',
          email: clinic.email || 'N/A',
          phone: clinic.phoneNumber || 'N/A',
          type: 'clinic',
          shopName: clinic.clinicName || clinic.name || 'N/A',
          totalEarnings: 0,
          todayEarnings: 0,
          weeklyEarnings: 0,
          monthlyEarnings: 0,
          orders: {
            total: 0,
            today: 0,
            weekly: 0,
            monthly: 0
          },
          isActive: clinic.Accountverify === '1',
          error: error.message
        };
      }
    })
  );

  return clinicEarnings.filter(clinic => clinic !== null);
}
// IMPROVED: Food Vendor Earnings Calculation
async function calculateFoodVendorEarnings(foodVendors, period, cutoffSettings, today, startOfWeek, startOfMonth) {
  const foodCutoff = cutoffSettings?.foodCutoff || 10;
  
  const vendorEarnings = await Promise.all(
    foodVendors.map(async (vendor) => {
      try {
        console.log(`Calculating earnings for food vendor: ${vendor.name} (${vendor._id})`);
        
        // Get food orders for this vendor - MULTIPLE WAYS TO FIND ORDERS
        let foodOrders = [];
        
        // Method 1: Find by vendorId
        foodOrders = await FoodOrder.find({ 
          vendorId: vendor._id.toString() 
        });

        // Method 2: If no orders found, try with vendor ID as string
        if (foodOrders.length === 0) {
          foodOrders = await FoodOrder.find({ 
            vendorId: vendor._id.toString() 
          });
        }

        // Method 3: If still no orders, try with any matching vendor reference
        if (foodOrders.length === 0) {
          // Check if vendor has any orders by name or other identifier
          const allFoodOrders = await FoodOrder.find({}).limit(100);
          foodOrders = allFoodOrders.filter(order => 
            order.vendorId && order.vendorId.toString() === vendor._id.toString()
          );
        }

        console.log(`Food Vendor ${vendor.name} has ${foodOrders.length} orders`);

        // If no orders, still return vendor with zero earnings
        if (foodOrders.length === 0) {
          return {
            _id: vendor._id,
            name: vendor.name || vendor.shopName || 'Unknown Food Vendor',
            email: vendor.email || 'N/A',
            phone: vendor.phone || 'N/A',
            type: 'food',
            shopName: vendor.shopName || vendor.name || 'N/A',
            totalEarnings: 0,
            todayEarnings: 0,
            weeklyEarnings: 0,
            monthlyEarnings: 0,
            orders: {
              total: 0,
              today: 0,
              weekly: 0,
              monthly: 0
            },
            isActive: vendor.isActive !== false,
            debug: { ordersFound: 0 }
          };
        }

        // Calculate revenue from orders
        const totalRevenue = foodOrders.reduce((sum, order) => {
          const orderPrice = parseFloat(order.price) || 
                           order.items?.reduce((itemSum, item) => 
                             itemSum + (parseFloat(item.finalprice) || parseFloat(item.price) || 0), 0) || 0;
          return sum + orderPrice;
        }, 0);
        
        const todayRevenue = foodOrders
          .filter(order => new Date(order.createdAt) >= today)
          .reduce((sum, order) => {
            const orderPrice = parseFloat(order.price) || 0;
            return sum + orderPrice;
          }, 0);
        
        const weeklyRevenue = foodOrders
          .filter(order => new Date(order.createdAt) >= startOfWeek)
          .reduce((sum, order) => {
            const orderPrice = parseFloat(order.price) || 0;
            return sum + orderPrice;
          }, 0);
        
        const monthlyRevenue = foodOrders
          .filter(order => new Date(order.createdAt) >= startOfMonth)
          .reduce((sum, order) => {
            const orderPrice = parseFloat(order.price) || 0;
            return sum + orderPrice;
          }, 0);

        // Calculate vendor payout (vendor keeps 100% - admin cutoff)
        const totalEarnings = (totalRevenue * (100 - foodCutoff)) / 100;
        const todayEarnings = (todayRevenue * (100 - foodCutoff)) / 100;
        const weeklyEarnings = (weeklyRevenue * (100 - foodCutoff)) / 100;
        const monthlyEarnings = (monthlyRevenue * (100 - foodCutoff)) / 100;

        // Count orders
        const totalOrders = foodOrders.length;
        const todayOrders = foodOrders.filter(order => new Date(order.createdAt) >= today).length;
        const weeklyOrders = foodOrders.filter(order => new Date(order.createdAt) >= startOfWeek).length;
        const monthlyOrders = foodOrders.filter(order => new Date(order.createdAt) >= startOfMonth).length;

        return {
          _id: vendor._id,
          name: vendor.name || vendor.shopName || 'Unknown Food Vendor',
          email: vendor.email || 'N/A',
          phone: vendor.phone || 'N/A',
          type: 'food',
          shopName: vendor.shopName || vendor.name || 'N/A',
          totalEarnings: parseFloat(totalEarnings.toFixed(2)),
          todayEarnings: parseFloat(todayEarnings.toFixed(2)),
          weeklyEarnings: parseFloat(weeklyEarnings.toFixed(2)),
          monthlyEarnings: parseFloat(monthlyEarnings.toFixed(2)),
          orders: {
            total: totalOrders,
            today: todayOrders,
            weekly: weeklyOrders,
            monthly: monthlyOrders
          },
          isActive: vendor.isActive !== false,
          debug: { 
            ordersFound: foodOrders.length,
            totalRevenue: totalRevenue
          }
        };
      } catch (error) {
        console.error(`Error calculating earnings for food vendor ${vendor._id}:`, error);
        // Return vendor with zero earnings instead of null
        return {
          _id: vendor._id,
          name: vendor.name || vendor.shopName || 'Unknown Food Vendor',
          email: vendor.email || 'N/A',
          phone: vendor.phone || 'N/A',
          type: 'food',
          shopName: vendor.shopName || vendor.name || 'N/A',
          totalEarnings: 0,
          todayEarnings: 0,
          weeklyEarnings: 0,
          monthlyEarnings: 0,
          orders: {
            total: 0,
            today: 0,
            weekly: 0,
            monthly: 0
          },
          isActive: vendor.isActive !== false,
          error: error.message
        };
      }
    })
  );

  return vendorEarnings.filter(vendor => vendor !== null);
}

// FIXED: Pharmacy Vendor Earnings Calculation
async function calculatePharmacyVendorEarnings(pharmacyVendors, period, cutoffSettings, today, startOfWeek, startOfMonth) {
  const pharmacyCutoff = cutoffSettings?.pharmacyCutoff || 5;
  
  const vendorEarnings = await Promise.all(
    pharmacyVendors.map(async (vendor) => {
      try {
        // Get pharmacy orders for this vendor
        const pharmacyOrders = await OrderPharmacy.find({ 
          'items.vendorId': vendor._id.toString() 
        });

        console.log(`Pharmacy Vendor ${vendor.name} has ${pharmacyOrders.length} orders`);

        // Calculate revenue from orders
        const totalRevenue = pharmacyOrders.reduce((sum, order) => 
          sum + (parseFloat(order.grandTotal) || parseFloat(order.subTotal) || 0), 0
        );
        
        const todayRevenue = pharmacyOrders
          .filter(order => new Date(order.createdAt) >= today)
          .reduce((sum, order) => sum + (parseFloat(order.grandTotal) || 0), 0);
        
        const weeklyRevenue = pharmacyOrders
          .filter(order => new Date(order.createdAt) >= startOfWeek)
          .reduce((sum, order) => sum + (parseFloat(order.grandTotal) || 0), 0);
        
        const monthlyRevenue = pharmacyOrders
          .filter(order => new Date(order.createdAt) >= startOfMonth)
          .reduce((sum, order) => sum + (parseFloat(order.grandTotal) || 0), 0);

        // Calculate vendor payout (vendor keeps 100% - admin cutoff)
        const totalEarnings = (totalRevenue * (100 - pharmacyCutoff)) / 100;
        const todayEarnings = (todayRevenue * (100 - pharmacyCutoff)) / 100;
        const weeklyEarnings = (weeklyRevenue * (100 - pharmacyCutoff)) / 100;
        const monthlyEarnings = (monthlyRevenue * (100 - pharmacyCutoff)) / 100;

        // Count orders
        const totalOrders = pharmacyOrders.length;
        const todayOrders = pharmacyOrders.filter(order => new Date(order.createdAt) >= today).length;
        const weeklyOrders = pharmacyOrders.filter(order => new Date(order.createdAt) >= startOfWeek).length;
        const monthlyOrders = pharmacyOrders.filter(order => new Date(order.createdAt) >= startOfMonth).length;

        return {
          _id: vendor._id,
          name: vendor.name || vendor.shopName || 'Unknown Pharmacy',
          email: vendor.email || 'N/A',
          phone: vendor.phone || 'N/A',
          type: 'pharmacy',
          shopName: vendor.shopName || vendor.name || 'N/A',
          totalEarnings: parseFloat(totalEarnings.toFixed(2)),
          todayEarnings: parseFloat(todayEarnings.toFixed(2)),
          weeklyEarnings: parseFloat(weeklyEarnings.toFixed(2)),
          monthlyEarnings: parseFloat(monthlyEarnings.toFixed(2)),
          orders: {
            total: totalOrders,
            today: todayOrders,
            weekly: weeklyOrders,
            monthly: monthlyOrders
          },
          isActive: vendor.isActive !== false
        };
      } catch (error) {
        console.error(`Error calculating earnings for pharmacy vendor ${vendor._id}:`, error);
        return null;
      }
    })
  );

  return vendorEarnings.filter(vendor => vendor !== null);
}

// FIXED: Lab Vendor Earnings Calculation
async function calculateLabVendorEarnings(labVendors, period, cutoffSettings, today, startOfWeek, startOfMonth) {
  const labCutoff = cutoffSettings?.labCutoff || 5;
  
  const vendorEarnings = await Promise.all(
    labVendors.map(async (vendor) => {
      try {
        // Get lab orders for this vendor
        const labOrders = await Appointment.find({ 
          vendorId: vendor._id.toString(),
          $or: [
            { serviceType: 'lab' },
            { serviceType: 'Lab Test' },
            { serviceType: 'Walkin Collection' },
            { serviceType: 'Home Collection' },
            { method: { $in: ['Test', 'Package'] } }
          ]
        });

        console.log(`Lab Vendor ${vendor.name} has ${labOrders.length} orders`);

        // Calculate revenue from orders
        const totalRevenue = labOrders.reduce((sum, order) => 
          sum + (parseFloat(order.price) || 0), 0
        );
        
        const todayRevenue = labOrders
          .filter(order => new Date(order.createdAt) >= today)
          .reduce((sum, order) => sum + (parseFloat(order.price) || 0), 0);
        
        const weeklyRevenue = labOrders
          .filter(order => new Date(order.createdAt) >= startOfWeek)
          .reduce((sum, order) => sum + (parseFloat(order.price) || 0), 0);
        
        const monthlyRevenue = labOrders
          .filter(order => new Date(order.createdAt) >= startOfMonth)
          .reduce((sum, order) => sum + (parseFloat(order.price) || 0), 0);

        // Calculate vendor payout (vendor keeps 100% - admin cutoff)
        const totalEarnings = (totalRevenue * (100 - labCutoff)) / 100;
        const todayEarnings = (todayRevenue * (100 - labCutoff)) / 100;
        const weeklyEarnings = (weeklyRevenue * (100 - labCutoff)) / 100;
        const monthlyEarnings = (monthlyRevenue * (100 - labCutoff)) / 100;

        // Count orders
        const totalOrders = labOrders.length;
        const todayOrders = labOrders.filter(order => new Date(order.createdAt) >= today).length;
        const weeklyOrders = labOrders.filter(order => new Date(order.createdAt) >= startOfWeek).length;
        const monthlyOrders = labOrders.filter(order => new Date(order.createdAt) >= startOfMonth).length;

        return {
          _id: vendor._id,
          name: vendor.name || vendor.shopName || vendor.labName || 'Unknown Lab',
          email: vendor.email || 'N/A',
          phone: vendor.phone || 'N/A',
          type: 'lab',
          shopName: vendor.shopName || vendor.labName || vendor.name || 'N/A',
          totalEarnings: parseFloat(totalEarnings.toFixed(2)),
          todayEarnings: parseFloat(todayEarnings.toFixed(2)),
          weeklyEarnings: parseFloat(weeklyEarnings.toFixed(2)),
          monthlyEarnings: parseFloat(monthlyEarnings.toFixed(2)),
          orders: {
            total: totalOrders,
            today: todayOrders,
            weekly: weeklyOrders,
            monthly: monthlyOrders
          },
          isActive: vendor.isActive !== false
        };
      } catch (error) {
        console.error(`Error calculating earnings for lab vendor ${vendor._id}:`, error);
        return null;
      }
    })
  );

  return vendorEarnings.filter(vendor => vendor !== null);
}

// Doctor Vendor Earnings Calculation (Already working)
// FIXED: Doctor Vendor Earnings Calculation with Clinic ID
// DEBUG VERSION: Doctor Vendor Earnings Calculation with Clinic Name Debug
// FIXED: Doctor Vendor Earnings Calculation with Clinic ID
async function calculateDoctorEarnings(doctors, period, cutoffSettings, today, startOfWeek, startOfMonth) {
  const doctorCutoff = cutoffSettings?.doctorCutoff || 5;
  
  const doctorEarnings = await Promise.all(
    doctors.map(async (doctor) => {
      try {
        // ✅ FIXED: PROPERLY FILTER INDEPENDENT DOCTOR APPOINTMENTS
        const doctorAppointments = await Appointment.find({
          doctorId: doctor._id.toString(),
          // Must not have vendorId (not lab)
          $or: [
            { vendorId: null },
            { vendorId: { $exists: false } },
            { vendorId: undefined }
          ],
          // Must not have clinicId (not clinic appointment)
          $or: [
            { clinicId: null },
            { clinicId: { $exists: false } },
            { clinicId: undefined }
          ],
          // Must be doctor appointments (service type or method)
          $or: [
            { serviceType: { $regex: /doctor|consultation/i } },
            { method: { $regex: /consult|appointment/i } },
            { 
              $and: [
                { serviceType: { $exists: true } },
                { serviceType: { $ne: 'lab' } },
                { serviceType: { $ne: 'Lab Test' } },
                { serviceType: { $ne: 'Walkin Collection' } },
                { serviceType: { $ne: 'Home Collection' } }
              ]
            }
          ]
        });

        console.log(`Independent Doctor ${doctor.name} has ${doctorAppointments.length} appointments`);

        // If no appointments found, try alternative query
        let appointments = doctorAppointments;
        if (doctorAppointments.length === 0) {
          // Alternative query - just check for doctorId and not lab
          appointments = await Appointment.find({
            doctorId: doctor._id.toString(),
            vendorId: { $in: [null, undefined] },
            $or: [
              { clinicId: null },
              { clinicId: { $exists: false } }
            ]
          });
          console.log(`Alternative query found ${appointments.length} appointments for ${doctor.name}`);
        }

        // Check if doctor has personal clinic
        let clinicInfo = {
          clinicId: null,
          clinicName: null,
          hasClinic: false
        };

        if (doctor.ClinicId && mongoose.Types.ObjectId.isValid(doctor.ClinicId)) {
          try {
            const clinic = await mongoose.connection.db.collection('clinics').findOne({ 
              _id: new mongoose.Types.ObjectId(doctor.ClinicId) 
            });
            
            if (clinic) {
              clinicInfo = {
                clinicId: doctor.ClinicId,
                clinicName: clinic.clinicName || clinic.name || 'Clinic Name Not Available',
                hasClinic: true
              };
            }
          } catch (clinicError) {
            console.error(`Error fetching clinic details for doctor ${doctor._id}:`, clinicError);
          }
        }

        // If still no appointments, return zero earnings but still include doctor
        if (appointments.length === 0) {
          return {
            _id: doctor._id,
            name: doctor.name || 'Unknown Doctor',
            email: doctor.email || 'N/A',
            phone: doctor.phoneNumber || doctor.phone || 'N/A',
            type: 'doctor',
            shopName: doctor.clinicName || doctor.hospitalName || doctor.shopName || 'N/A',
            totalEarnings: 0,
            todayEarnings: 0,
            weeklyEarnings: 0,
            monthlyEarnings: 0,
            orders: {
              total: 0,
              today: 0,
              weekly: 0,
              monthly: 0
            },
            isActive: doctor.Accountverify === '1',
            ...clinicInfo,
            qualification: doctor.qualification || 'N/A',
            specialist: doctor.specialist || 'N/A',
            loginType: doctor.loginType || 'standalone',
            debug: {
              appointmentsFound: 0,
              doctorId: doctor._id,
              doctorName: doctor.name
            }
          };
        }

        // Calculate earnings from appointments
        const totalRevenue = appointments.reduce((sum, appointment) => {
          let price = 0;
          if (appointment.price) {
            const priceStr = appointment.price.toString();
            const numericPrice = priceStr.replace(/[₹,]/g, '');
            price = parseFloat(numericPrice) || 0;
          }
          return sum + price;
        }, 0);
        
        const todayRevenue = appointments
          .filter(apt => new Date(apt.createdAt) >= today)
          .reduce((sum, appointment) => {
            let price = 0;
            if (appointment.price) {
              const priceStr = appointment.price.toString();
              const numericPrice = priceStr.replace(/[₹,]/g, '');
              price = parseFloat(numericPrice) || 0;
            }
            return sum + price;
          }, 0);
        
        const weeklyRevenue = appointments
          .filter(apt => new Date(apt.createdAt) >= startOfWeek)
          .reduce((sum, appointment) => {
            let price = 0;
            if (appointment.price) {
              const priceStr = appointment.price.toString();
              const numericPrice = priceStr.replace(/[₹,]/g, '');
              price = parseFloat(numericPrice) || 0;
            }
            return sum + price;
          }, 0);
        
        const monthlyRevenue = appointments
          .filter(apt => new Date(apt.createdAt) >= startOfMonth)
          .reduce((sum, appointment) => {
            let price = 0;
            if (appointment.price) {
              const priceStr = appointment.price.toString();
              const numericPrice = priceStr.replace(/[₹,]/g, '');
              price = parseFloat(numericPrice) || 0;
            }
            return sum + price;
          }, 0);

        // Calculate vendor payout (doctor keeps 100% - admin cutoff)
        const totalEarnings = (totalRevenue * (100 - doctorCutoff)) / 100;
        const todayEarnings = (todayRevenue * (100 - doctorCutoff)) / 100;
        const weeklyEarnings = (weeklyRevenue * (100 - doctorCutoff)) / 100;
        const monthlyEarnings = (monthlyRevenue * (100 - doctorCutoff)) / 100;

        // Count orders
        const totalOrders = appointments.length;
        const todayOrders = appointments.filter(apt => new Date(apt.createdAt) >= today).length;
        const weeklyOrders = appointments.filter(apt => new Date(apt.createdAt) >= startOfWeek).length;
        const monthlyOrders = appointments.filter(apt => new Date(apt.createdAt) >= startOfMonth).length;

        return {
          _id: doctor._id,
          name: doctor.name || 'Unknown Doctor',
          email: doctor.email || 'N/A',
          phone: doctor.phoneNumber || doctor.phone || 'N/A',
          type: 'doctor',
          shopName: doctor.clinicName || doctor.hospitalName || doctor.shopName || 'N/A',
          totalEarnings: parseFloat(totalEarnings.toFixed(2)),
          todayEarnings: parseFloat(todayEarnings.toFixed(2)),
          weeklyEarnings: parseFloat(weeklyEarnings.toFixed(2)),
          monthlyEarnings: parseFloat(monthlyEarnings.toFixed(2)),
          orders: {
            total: totalOrders,
            today: todayOrders,
            weekly: weeklyOrders,
            monthly: monthlyOrders
          },
          isActive: doctor.Accountverify === '1',
          ...clinicInfo,
          qualification: doctor.qualification || 'N/A',
          specialist: doctor.specialist || 'N/A',
          loginType: doctor.loginType || 'standalone',
          debug: {
            appointmentsFound: appointments.length,
            totalRevenue: totalRevenue,
            hasVendorId: appointments[0]?.vendorId ? true : false,
            hasClinicId: appointments[0]?.clinicId ? true : false,
            sampleAppointment: appointments.length > 0 ? {
              _id: appointments[0]._id,
              price: appointments[0].price,
              serviceType: appointments[0].serviceType,
              method: appointments[0].method
            } : null
          }
        };
      } catch (error) {
        console.error(`Error calculating earnings for doctor ${doctor._id}:`, error);
        
        // Return doctor with zero earnings instead of null
        return {
          _id: doctor._id,
          name: doctor.name || 'Unknown Doctor',
          email: doctor.email || 'N/A',
          phone: doctor.phoneNumber || doctor.phone || 'N/A',
          type: 'doctor',
          shopName: doctor.clinicName || doctor.hospitalName || doctor.shopName || 'N/A',
          totalEarnings: 0,
          todayEarnings: 0,
          weeklyEarnings: 0,
          monthlyEarnings: 0,
          orders: {
            total: 0,
            today: 0,
            weekly: 0,
            monthly: 0
          },
          isActive: doctor.Accountverify === '1',
          qualification: doctor.qualification || 'N/A',
          specialist: doctor.specialist || 'N/A',
          loginType: doctor.loginType || 'standalone',
          error: error.message
        };
      }
    })
  );

  return doctorEarnings.filter(doctor => doctor !== null);
}

// Get detailed vendor earnings by ID - COMPLETELY FIXED VERSION
// Get detailed vendor earnings by ID - FIXED VERSION
// Get detailed vendor earnings by ID - UPDATED WITH CLINIC
// Get detailed vendor earnings by ID - COMPLETELY FIXED VERSION
// Get detailed vendor earnings by ID - FIXED VERSION
// Get detailed vendor earnings by ID - UPDATED WITH CLINIC
router.get('/vendor-earnings/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { period = 'all' } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const cutoffSettings = await CutoffSettings.findOne();

    console.log(`Fetching details for vendor: ${vendorId}`);

    // Vendor finding with clinic support
    let vendor = null;
    let vendorType = 'unknown';

    // Pehle clinics collection mein check karo
    vendor = await mongoose.connection.db.collection('clinics').findOne({ 
      _id: new mongoose.Types.ObjectId(vendorId) 
    });
    
    if (vendor) {
      vendorType = 'clinic';
      console.log(`Found clinic: ${vendor.name}`);
    } else {
      // Phir doctors collection mein check karo
      vendor = await mongoose.connection.db.collection('doctors').findOne({ 
        _id: new mongoose.Types.ObjectId(vendorId) 
      });
      
      if (vendor) {
        vendorType = 'doctor';
        console.log(`Found doctor: ${vendor.name}`);
      } else {
        // Phir vandors collection mein check karo
        vendor = await mongoose.connection.db.collection('vandors').findOne({ 
          _id: new mongoose.Types.ObjectId(vendorId) 
        });
        
        if (vendor) {
          vendorType = getVendorType(vendor);
          console.log(`Found vendor: ${vendor.name}, Type: ${vendorType}`);
        }
      }
    }

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found"
      });
    }

    console.log(`Final - Vendor: ${vendor.name}, Type: ${vendorType}`);

    // Calculate detailed earnings based on vendor type - CLINIC ADD KIYA
    let earnings = {};
    let recentOrders = [];
    
    if (vendorType === 'doctor') {
      earnings = await calculateDetailedDoctorEarnings(vendorId, period, cutoffSettings, today, startOfWeek, startOfMonth);
      recentOrders = await getRecentDoctorOrders(vendorId);
    } else if (vendorType === 'food') {
      earnings = await calculateDetailedFoodVendorEarnings(vendorId, period, cutoffSettings, today, startOfWeek, startOfMonth);
      recentOrders = await getRecentFoodOrders(vendorId);
    } else if (vendorType === 'pharmacy') {
      earnings = await calculateDetailedPharmacyVendorEarnings(vendorId, period, cutoffSettings, today, startOfWeek, startOfMonth);
      recentOrders = await getRecentPharmacyOrders(vendorId);
    } else if (vendorType === 'lab') {
      earnings = await calculateDetailedLabVendorEarnings(vendorId, period, cutoffSettings, today, startOfWeek, startOfMonth);
      recentOrders = await getRecentLabOrders(vendorId);
    } else if (vendorType === 'clinic') {
      earnings = await calculateDetailedClinicEarnings(vendorId, period, cutoffSettings, today, startOfWeek, startOfMonth);
      recentOrders = await getRecentClinicOrders(vendorId);
    } else {
      console.log(`Unknown vendor type ${vendorType}, defaulting to food`);
      vendorType = 'food';
      earnings = await calculateDetailedFoodVendorEarnings(vendorId, period, cutoffSettings, today, startOfWeek, startOfMonth);
      recentOrders = await getRecentFoodOrders(vendorId);
    }

    // ✅ DOCTOR KE LIYE FREE CONSULTATION STATS ADD KIYE
    if (vendorType === 'doctor') {
      try {
        // Doctor ke appointments fetch karo
        const doctorAppointments = await Appointment.find({
          doctorId: vendorId.toString()
        });

        // Free consultations count karo
        const freeConsultations = doctorAppointments.filter(app => 
          app.isFreeConsultation === true
        ).length;

        const totalConsultations = doctorAppointments.length;
        const paidConsultations = totalConsultations - freeConsultations;

        // Calculate free consultation revenue
        let freeConsultationRevenue = 0;
        let freeConsultationDoctorPayout = 0;
        let freeConsultationAdminEarnings = 0;

        if (freeConsultations > 0) {
          freeConsultationRevenue = doctorAppointments
            .filter(app => app.isFreeConsultation === true)
            .reduce((sum, app) => sum + (parseFloat(app.price) || 0), 0);
          
          const membershipCutoff = cutoffSettings?.membershipCutoff || 20;
          freeConsultationAdminEarnings = (freeConsultationRevenue * membershipCutoff) / 100;
          freeConsultationDoctorPayout = freeConsultationRevenue - freeConsultationAdminEarnings;
        }

        // Vendor object mein free consultation stats add karo
        vendor.freeConsultationStats = {
          count: freeConsultations,
          paidCount: paidConsultations,
          totalCount: totalConsultations,
          originalRevenue: freeConsultationRevenue,
          doctorPayout: freeConsultationDoctorPayout,
          adminEarnings: freeConsultationAdminEarnings,
          membershipCutoffPercentage: cutoffSettings?.membershipCutoff || 20
        };
      } catch (error) {
        console.log("Error calculating free consultation stats:", error.message);
        vendor.freeConsultationStats = {
          count: 0,
          paidCount: 0,
          totalCount: 0,
          originalRevenue: 0,
          doctorPayout: 0,
          adminEarnings: 0,
          membershipCutoffPercentage: cutoffSettings?.membershipCutoff || 20
        };
      }
    }

    res.json({
      success: true,
      message: "Vendor details fetched successfully",
      data: {
        vendor: {
          _id: vendor._id,
          name: vendor.name,
          email: vendor.email,
          phone: vendor.phone || vendor.phoneNumber,
          type: vendorType,
          shopName: vendor.shopName || vendor.clinicName || vendor.labName || vendor.clinicName || 'N/A',
          address: vendor.address,
          isActive: vendorType === 'clinic' ? vendor.Accountverify === '1' : vendor.isActive !== false,
          createdAt: vendor.createdAt,
          // ✅ DOCTOR SPECIFIC FIELDS ADD KIYE
          ...(vendorType === 'doctor' && {
            qualification: vendor.qualification,
            specialist: vendor.specialist,
            freeConsultationStats: vendor.freeConsultationStats,
            hasClinic: vendor.ClinicId ? true : false,
            clinicId: vendor.ClinicId,
            clinicName: vendor.clinicName || vendor.hospitalName
          })
        },
        earnings,
        recentOrders
      }
    });
    
  } catch (error) {
    console.error("Vendor details error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// ✅ NEW: Detailed Clinic Earnings Calculation
// ✅ UPDATED: Detailed Clinic Earnings Calculation with Clinic Cutoff
async function calculateDetailedClinicEarnings(clinicId, period, cutoffSettings, today, startOfWeek, startOfMonth) {
  const clinicCutoff = cutoffSettings?.clinicCutoff || 5; // ✅ Ab clinic ka alag cutoff
  
  // Get all clinic appointments for this clinic
  const clinicAppointments = await Appointment.find({ 
    clinicId: clinicId.toString()
  }).sort({ createdAt: -1 });

  console.log(`Clinic ${clinicId} has ${clinicAppointments.length} appointments`);

  // Calculate revenue from appointments
  const totalRevenue = clinicAppointments.reduce((sum, appointment) => 
    sum + (parseFloat(appointment.price) || 0), 0
  );
  
  const todayRevenue = clinicAppointments
    .filter(appointment => new Date(appointment.createdAt) >= today)
    .reduce((sum, appointment) => sum + (parseFloat(appointment.price) || 0), 0);
  
  const weeklyRevenue = clinicAppointments
    .filter(appointment => new Date(appointment.createdAt) >= startOfWeek)
    .reduce((sum, appointment) => sum + (parseFloat(appointment.price) || 0), 0);
  
  const monthlyRevenue = clinicAppointments
    .filter(appointment => new Date(appointment.createdAt) >= startOfMonth)
    .reduce((sum, appointment) => sum + (parseFloat(appointment.price) || 0), 0);

  // Calculate clinic payout (clinic keeps 100% - admin cutoff)
  const totalEarnings = (totalRevenue * (100 - clinicCutoff)) / 100;
  const todayEarnings = (todayRevenue * (100 - clinicCutoff)) / 100;
  const weeklyEarnings = (weeklyRevenue * (100 - clinicCutoff)) / 100;
  const monthlyEarnings = (monthlyRevenue * (100 - clinicCutoff)) / 100;

  // Count orders
  const totalOrders = clinicAppointments.length;
  const todayOrders = clinicAppointments.filter(appointment => new Date(appointment.createdAt) >= today).length;
  const weeklyOrders = clinicAppointments.filter(appointment => new Date(appointment.createdAt) >= startOfWeek).length;
  const monthlyOrders = clinicAppointments.filter(appointment => new Date(appointment.createdAt) >= startOfMonth).length;

  // Calculate admin earnings
  const adminEarnings = totalRevenue * (clinicCutoff / 100);

  return {
    summary: {
      totalEarnings: parseFloat(totalEarnings.toFixed(2)),
      todayEarnings: parseFloat(todayEarnings.toFixed(2)),
      weeklyEarnings: parseFloat(weeklyEarnings.toFixed(2)),
      monthlyEarnings: parseFloat(monthlyEarnings.toFixed(2)),
      totalOrders,
      todayOrders,
      weeklyOrders,
      monthlyOrders,
      cutoffPercentage: clinicCutoff, // ✅ Ab clinic ka alag cutoff dikhega
      adminEarnings: parseFloat(adminEarnings.toFixed(2)),
      totalRevenue: parseFloat(totalRevenue.toFixed(2))
    },
    periodBreakdown: {
      total: parseFloat(totalEarnings.toFixed(2)),
      today: parseFloat(todayEarnings.toFixed(2)),
      week: parseFloat(weeklyEarnings.toFixed(2)),
      month: parseFloat(monthlyEarnings.toFixed(2))
    },
    revenueBreakdown: {
      total: parseFloat(totalRevenue.toFixed(2)),
      today: parseFloat(todayRevenue.toFixed(2)),
      week: parseFloat(weeklyRevenue.toFixed(2)),
      month: parseFloat(monthlyRevenue.toFixed(2))
    }
  };
}
// Detailed Food Vendor Earnings Calculation
async function calculateDetailedFoodVendorEarnings(vendorId, period, cutoffSettings, today, startOfWeek, startOfMonth) {
  const foodCutoff = cutoffSettings?.foodCutoff || 10;
  
  // Get all food orders for this vendor
  const foodOrders = await FoodOrder.find({ 
    vendorId: vendorId.toString() 
  }).sort({ createdAt: -1 });

  console.log(`Food Vendor ${vendorId} has ${foodOrders.length} orders`);

  // Calculate revenue from orders
  const totalRevenue = foodOrders.reduce((sum, order) => {
    const orderPrice = parseFloat(order.price) || 
                     order.items?.reduce((itemSum, item) => 
                       itemSum + (parseFloat(item.finalprice) || parseFloat(item.price) || 0), 0) || 0;
    return sum + orderPrice;
  }, 0);
  
  const todayRevenue = foodOrders
    .filter(order => new Date(order.createdAt) >= today)
    .reduce((sum, order) => {
      const orderPrice = parseFloat(order.price) || 0;
      return sum + orderPrice;
    }, 0);
  
  const weeklyRevenue = foodOrders
    .filter(order => new Date(order.createdAt) >= startOfWeek)
    .reduce((sum, order) => {
      const orderPrice = parseFloat(order.price) || 0;
      return sum + orderPrice;
    }, 0);
  
  const monthlyRevenue = foodOrders
    .filter(order => new Date(order.createdAt) >= startOfMonth)
    .reduce((sum, order) => {
      const orderPrice = parseFloat(order.price) || 0;
      return sum + orderPrice;
    }, 0);

  // Calculate vendor payout (vendor keeps 100% - admin cutoff)
  const totalEarnings = (totalRevenue * (100 - foodCutoff)) / 100;
  const todayEarnings = (todayRevenue * (100 - foodCutoff)) / 100;
  const weeklyEarnings = (weeklyRevenue * (100 - foodCutoff)) / 100;
  const monthlyEarnings = (monthlyRevenue * (100 - foodCutoff)) / 100;

  // Count orders
  const totalOrders = foodOrders.length;
  const todayOrders = foodOrders.filter(order => new Date(order.createdAt) >= today).length;
  const weeklyOrders = foodOrders.filter(order => new Date(order.createdAt) >= startOfWeek).length;
  const monthlyOrders = foodOrders.filter(order => new Date(order.createdAt) >= startOfMonth).length;

  // Calculate admin earnings
  const adminEarnings = totalRevenue * (foodCutoff / 100);

  return {
    summary: {
      totalEarnings: parseFloat(totalEarnings.toFixed(2)),
      todayEarnings: parseFloat(todayEarnings.toFixed(2)),
      weeklyEarnings: parseFloat(weeklyEarnings.toFixed(2)),
      monthlyEarnings: parseFloat(monthlyEarnings.toFixed(2)),
      totalOrders,
      todayOrders,
      weeklyOrders,
      monthlyOrders,
      cutoffPercentage: foodCutoff,
      adminEarnings: parseFloat(adminEarnings.toFixed(2)),
      totalRevenue: parseFloat(totalRevenue.toFixed(2))
    },
    periodBreakdown: {
      total: parseFloat(totalEarnings.toFixed(2)),
      today: parseFloat(todayEarnings.toFixed(2)),
      week: parseFloat(weeklyEarnings.toFixed(2)),
      month: parseFloat(monthlyEarnings.toFixed(2))
    },
    revenueBreakdown: {
      total: parseFloat(totalRevenue.toFixed(2)),
      today: parseFloat(todayRevenue.toFixed(2)),
      week: parseFloat(weeklyRevenue.toFixed(2)),
      month: parseFloat(monthlyRevenue.toFixed(2))
    }
  };
}

// Detailed Pharmacy Vendor Earnings Calculation
async function calculateDetailedPharmacyVendorEarnings(vendorId, period, cutoffSettings, today, startOfWeek, startOfMonth) {
  const pharmacyCutoff = cutoffSettings?.pharmacyCutoff || 5;
  
  // Get all pharmacy orders for this vendor
  const pharmacyOrders = await OrderPharmacy.find({ 
    'items.vendorId': vendorId.toString() 
  }).sort({ createdAt: -1 });

  console.log(`Pharmacy Vendor ${vendorId} has ${pharmacyOrders.length} orders`);

  // Calculate revenue from orders
  const totalRevenue = pharmacyOrders.reduce((sum, order) => 
    sum + (parseFloat(order.grandTotal) || parseFloat(order.subTotal) || 0), 0
  );
  
  const todayRevenue = pharmacyOrders
    .filter(order => new Date(order.createdAt) >= today)
    .reduce((sum, order) => sum + (parseFloat(order.grandTotal) || 0), 0);
  
  const weeklyRevenue = pharmacyOrders
    .filter(order => new Date(order.createdAt) >= startOfWeek)
    .reduce((sum, order) => sum + (parseFloat(order.grandTotal) || 0), 0);
  
  const monthlyRevenue = pharmacyOrders
    .filter(order => new Date(order.createdAt) >= startOfMonth)
    .reduce((sum, order) => sum + (parseFloat(order.grandTotal) || 0), 0);

  // Calculate vendor payout (vendor keeps 100% - admin cutoff)
  const totalEarnings = (totalRevenue * (100 - pharmacyCutoff)) / 100;
  const todayEarnings = (todayRevenue * (100 - pharmacyCutoff)) / 100;
  const weeklyEarnings = (weeklyRevenue * (100 - pharmacyCutoff)) / 100;
  const monthlyEarnings = (monthlyRevenue * (100 - pharmacyCutoff)) / 100;

  // Count orders
  const totalOrders = pharmacyOrders.length;
  const todayOrders = pharmacyOrders.filter(order => new Date(order.createdAt) >= today).length;
  const weeklyOrders = pharmacyOrders.filter(order => new Date(order.createdAt) >= startOfWeek).length;
  const monthlyOrders = pharmacyOrders.filter(order => new Date(order.createdAt) >= startOfMonth).length;

  // Calculate admin earnings
  const adminEarnings = totalRevenue * (pharmacyCutoff / 100);

  return {
    summary: {
      totalEarnings: parseFloat(totalEarnings.toFixed(2)),
      todayEarnings: parseFloat(todayEarnings.toFixed(2)),
      weeklyEarnings: parseFloat(weeklyEarnings.toFixed(2)),
      monthlyEarnings: parseFloat(monthlyEarnings.toFixed(2)),
      totalOrders,
      todayOrders,
      weeklyOrders,
      monthlyOrders,
      cutoffPercentage: pharmacyCutoff,
      adminEarnings: parseFloat(adminEarnings.toFixed(2)),
      totalRevenue: parseFloat(totalRevenue.toFixed(2))
    },
    periodBreakdown: {
      total: parseFloat(totalEarnings.toFixed(2)),
      today: parseFloat(todayEarnings.toFixed(2)),
      week: parseFloat(weeklyEarnings.toFixed(2)),
      month: parseFloat(monthlyEarnings.toFixed(2))
    },
    revenueBreakdown: {
      total: parseFloat(totalRevenue.toFixed(2)),
      today: parseFloat(todayRevenue.toFixed(2)),
      week: parseFloat(weeklyRevenue.toFixed(2)),
      month: parseFloat(monthlyRevenue.toFixed(2))
    }
  };
}

// Detailed Lab Vendor Earnings Calculation
async function calculateDetailedLabVendorEarnings(vendorId, period, cutoffSettings, today, startOfWeek, startOfMonth) {
  const labCutoff = cutoffSettings?.labCutoff || 5;
  
  // Get all lab orders for this vendor
  const labOrders = await Appointment.find({ 
    vendorId: vendorId.toString(),
    $or: [
      { serviceType: 'lab' },
      { serviceType: 'Lab Test' },
      { serviceType: 'Walkin Collection' },
      { serviceType: 'Home Collection' },
      { method: { $in: ['Test', 'Package'] } }
    ]
  }).sort({ createdAt: -1 });

  console.log(`Lab Vendor ${vendorId} has ${labOrders.length} orders`);

  // Calculate revenue from orders
  const totalRevenue = labOrders.reduce((sum, order) => 
    sum + (parseFloat(order.price) || 0), 0
  );
  
  const todayRevenue = labOrders
    .filter(order => new Date(order.createdAt) >= today)
    .reduce((sum, order) => sum + (parseFloat(order.price) || 0), 0);
  
  const weeklyRevenue = labOrders
    .filter(order => new Date(order.createdAt) >= startOfWeek)
    .reduce((sum, order) => sum + (parseFloat(order.price) || 0), 0);
  
  const monthlyRevenue = labOrders
    .filter(order => new Date(order.createdAt) >= startOfMonth)
    .reduce((sum, order) => sum + (parseFloat(order.price) || 0), 0);

  // Calculate vendor payout (vendor keeps 100% - admin cutoff)
  const totalEarnings = (totalRevenue * (100 - labCutoff)) / 100;
  const todayEarnings = (todayRevenue * (100 - labCutoff)) / 100;
  const weeklyEarnings = (weeklyRevenue * (100 - labCutoff)) / 100;
  const monthlyEarnings = (monthlyRevenue * (100 - labCutoff)) / 100;

  // Count orders
  const totalOrders = labOrders.length;
  const todayOrders = labOrders.filter(order => new Date(order.createdAt) >= today).length;
  const weeklyOrders = labOrders.filter(order => new Date(order.createdAt) >= startOfWeek).length;
  const monthlyOrders = labOrders.filter(order => new Date(order.createdAt) >= startOfMonth).length;

  // Calculate admin earnings
  const adminEarnings = totalRevenue * (labCutoff / 100);

  return {
    summary: {
      totalEarnings: parseFloat(totalEarnings.toFixed(2)),
      todayEarnings: parseFloat(todayEarnings.toFixed(2)),
      weeklyEarnings: parseFloat(weeklyEarnings.toFixed(2)),
      monthlyEarnings: parseFloat(monthlyEarnings.toFixed(2)),
      totalOrders,
      todayOrders,
      weeklyOrders,
      monthlyOrders,
      cutoffPercentage: labCutoff,
      adminEarnings: parseFloat(adminEarnings.toFixed(2)),
      totalRevenue: parseFloat(totalRevenue.toFixed(2))
    },
    periodBreakdown: {
      total: parseFloat(totalEarnings.toFixed(2)),
      today: parseFloat(todayEarnings.toFixed(2)),
      week: parseFloat(weeklyEarnings.toFixed(2)),
      month: parseFloat(monthlyEarnings.toFixed(2))
    },
    revenueBreakdown: {
      total: parseFloat(totalRevenue.toFixed(2)),
      today: parseFloat(todayRevenue.toFixed(2)),
      week: parseFloat(weeklyRevenue.toFixed(2)),
      month: parseFloat(monthlyRevenue.toFixed(2))
    }
  };
}

// Detailed Doctor Earnings Calculation
async function calculateDetailedDoctorEarnings(doctorId, period, cutoffSettings, today, startOfWeek, startOfMonth) {
  const doctorCutoff = cutoffSettings?.doctorCutoff || 5;
  
  // Doctor details fetch karo
  const doctor = await mongoose.connection.db.collection('doctors').findOne({ 
    _id: new mongoose.Types.ObjectId(doctorId) 
  });
  
  // ✅ CLINIC DETAILS FETCH KARO
  let clinicInfo = {
    clinicId: null,
    clinicName: null,
    hasClinic: false
  };

  if (doctor?.ClinicId) {
    try {
      const clinic = await mongoose.connection.db.collection('clinics').findOne({ 
        _id: new mongoose.Types.ObjectId(doctor.ClinicId) 
      });
      
      if (clinic) {
        clinicInfo = {
          clinicId: doctor.ClinicId,
          clinicName: clinic.clinicName || clinic.name || 'Unknown Clinic',
          hasClinic: true,
          clinicDetails: {
            name: clinic.clinicName || clinic.name,
            email: clinic.email,
            phone: clinic.phoneNumber,
            address: clinic.address
          }
        };
      }
    } catch (clinicError) {
      console.error(`Error fetching clinic details:`, clinicError);
    }
  }

  const appointments = await Appointment.find({ 
    doctorId: doctorId.toString(),
    serviceType: { $in: ["Endocrinologists", "Neuro", "doctor", "Doctor"] }
  }).sort({ createdAt: -1 });
  
  const totalRevenue = appointments.reduce((sum, apt) => sum + (parseFloat(apt.price) || 0), 0);
  const todayRevenue = appointments.filter(apt => new Date(apt.createdAt) >= today)
    .reduce((sum, apt) => sum + (parseFloat(apt.price) || 0), 0);
  const weeklyRevenue = appointments.filter(apt => new Date(apt.createdAt) >= startOfWeek)
    .reduce((sum, apt) => sum + (parseFloat(apt.price) || 0), 0);
  const monthlyRevenue = appointments.filter(apt => new Date(apt.createdAt) >= startOfMonth)
    .reduce((sum, apt) => sum + (parseFloat(apt.price) || 0), 0);

  // Calculate vendor payout (doctor keeps 100% - admin cutoff)
  const totalEarnings = (totalRevenue * (100 - doctorCutoff)) / 100;
  const todayEarnings = (todayRevenue * (100 - doctorCutoff)) / 100;
  const weeklyEarnings = (weeklyRevenue * (100 - doctorCutoff)) / 100;
  const monthlyEarnings = (monthlyRevenue * (100 - doctorCutoff)) / 100;

  // Count orders
  const totalOrders = appointments.length;
  const todayOrders = appointments.filter(apt => new Date(apt.createdAt) >= today).length;
  const weeklyOrders = appointments.filter(apt => new Date(apt.createdAt) >= startOfWeek).length;
  const monthlyOrders = appointments.filter(apt => new Date(apt.createdAt) >= startOfMonth).length;

  // Calculate admin earnings
  const adminEarnings = totalRevenue * (doctorCutoff / 100);

  return {
    summary: {
      totalEarnings: parseFloat(totalEarnings.toFixed(2)),
      todayEarnings: parseFloat(todayEarnings.toFixed(2)),
      weeklyEarnings: parseFloat(weeklyEarnings.toFixed(2)),
      monthlyEarnings: parseFloat(monthlyEarnings.toFixed(2)),
      totalOrders,
      todayOrders,
      weeklyOrders,
      monthlyOrders,
      cutoffPercentage: doctorCutoff,
      adminEarnings: parseFloat(adminEarnings.toFixed(2)),
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      ...clinicInfo // ✅ Clinic info include ki
    },
    periodBreakdown: {
      total: parseFloat(totalEarnings.toFixed(2)),
      today: parseFloat(todayEarnings.toFixed(2)),
      week: parseFloat(weeklyEarnings.toFixed(2)),
      month: parseFloat(monthlyEarnings.toFixed(2))
    },
    revenueBreakdown: {
      total: parseFloat(totalRevenue.toFixed(2)),
      today: parseFloat(todayRevenue.toFixed(2)),
      week: parseFloat(weeklyRevenue.toFixed(2)),
      month: parseFloat(monthlyRevenue.toFixed(2))
    }
  };
}

// Recent Orders Functions
async function getRecentFoodOrders(vendorId) {
  const orders = await FoodOrder.find({ vendorId: vendorId.toString() })
    .populate('userId', 'name phone email')
    .sort({ createdAt: -1 })
    .limit(10);

  return orders.map(order => ({
    _id: order._id,
    orderId: `FOOD-${order._id.toString().slice(-8)}`,
    customer: order.userId ? {
      name: order.userId.name,
      phone: order.userId.phone,
      email: order.userId.email
    } : { name: 'N/A', phone: 'N/A', email: 'N/A' },
    amount: parseFloat(order.price) || 0,
    status: order.status,
    createdAt: order.createdAt,
    type: 'food'
  }));
}

async function getRecentPharmacyOrders(vendorId) {
  const orders = await OrderPharmacy.find({ 'items.vendorId': vendorId.toString() })
    .populate('userId', 'name phone email')
    .sort({ createdAt: -1 })
    .limit(10);

  return orders.map(order => ({
    _id: order._id,
    orderId: `PHARM-${order._id.toString().slice(-8)}`,
    customer: order.userId ? {
      name: order.userId.name,
      phone: order.userId.phone,
      email: order.userId.email
    } : { name: 'N/A', phone: 'N/A', email: 'N/A' },
    amount: parseFloat(order.grandTotal) || 0,
    status: order.orderStatus,
    createdAt: order.createdAt,
    type: 'pharmacy'
  }));
}

async function getRecentLabOrders(vendorId) {
  const orders = await Appointment.find({ 
    vendorId: vendorId.toString(),
    $or: [
      { serviceType: 'lab' },
      { serviceType: 'Lab Test' },
      { serviceType: 'Walkin Collection' },
      { serviceType: 'Home Collection' },
      { method: { $in: ['Test', 'Package'] } }
    ]
  })
    .populate('userId', 'name phone email')
    .sort({ createdAt: -1 })
    .limit(10);

  return orders.map(order => ({
    _id: order._id,
    orderId: `LAB-${order._id.toString().slice(-8)}`,
    customer: order.userId ? {
      name: order.userId.name,
      phone: order.userId.phone,
      email: order.userId.email
    } : { name: 'N/A', phone: 'N/A', email: 'N/A' },
    amount: parseFloat(order.price) || 0,
    status: order.status,
    createdAt: order.createdAt,
    type: 'lab'
  }));
}

async function getRecentDoctorOrders(doctorId) {
  try {
    console.log(`Fetching recent orders for doctor: ${doctorId}`);
    
    // Doctor details fetch karo
    const doctor = await mongoose.connection.db.collection('doctors').findOne({ 
      _id: new mongoose.Types.ObjectId(doctorId) 
    });
    
    if (!doctor) {
      console.log(`Doctor ${doctorId} not found`);
      return [];
    }
    
    // Debug: Check if doctor has clinic
    console.log(`Doctor ${doctor.name} has ClinicId: ${doctor.ClinicId}`);
    
    // ✅ FIXED: Pehle independent appointments (clinicId nahi hai)
    const independentAppointments = await Appointment.find({
      doctorId: doctorId.toString(),
      vendorId: { $in: [null, undefined] }, // Not lab
      $or: [
        { clinicId: null },
        { clinicId: { $exists: false } },
        { clinicId: undefined }
      ]
    })
      .populate('userId', 'name phone email')
      .populate('patientId', 'name phone dob gender')
      .populate('couponId', 'couponCode discountType discountValue')
      .sort({ createdAt: -1 })
      .limit(5);

    console.log(`Found ${independentAppointments.length} independent appointments`);

    // ✅ FIXED: Phir clinic appointments (doctor ke personal clinic se)
    let clinicAppointments = [];
    
    if (doctor.ClinicId && mongoose.Types.ObjectId.isValid(doctor.ClinicId)) {
      clinicAppointments = await Appointment.find({
        doctorId: doctorId.toString(),
        clinicId: doctor.ClinicId.toString()
      })
        .populate('userId', 'name phone email')
        .populate('patientId', 'name phone dob gender')
        .populate('clinicId', 'name clinicName email phoneNumber')
        .populate('couponId', 'couponCode discountType discountValue')
        .sort({ createdAt: -1 })
        .limit(5);

      console.log(`Found ${clinicAppointments.length} clinic appointments for doctor's personal clinic`);
    }

    // Combine both types of appointments
    const allAppointments = [...independentAppointments, ...clinicAppointments]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    console.log(`Total appointments for doctor ${doctor.name}: ${allAppointments.length}`);

    // Process appointments
    const recentOrders = allAppointments.map((appointment, index) => {
      let appointmentType = 'independent';
      let clinicInfo = {};
      
      // Check if it's a clinic appointment
      if (appointment.clinicId && typeof appointment.clinicId === 'object') {
        appointmentType = 'clinic';
        clinicInfo = {
          clinicId: appointment.clinicId._id,
          clinicName: appointment.clinicId.clinicName || appointment.clinicId.name,
          email: appointment.clinicId.email,
          phone: appointment.clinicId.phoneNumber
        };
      } else if (appointment.clinicId && doctor.ClinicId && 
                 appointment.clinicId.toString() === doctor.ClinicId.toString()) {
        appointmentType = 'clinic';
        clinicInfo = {
          clinicId: doctor.ClinicId,
          clinicName: doctor.clinicName || 'Personal Clinic'
        };
      }

      // Get customer details
      let customer = { name: 'N/A', phone: 'N/A', email: 'N/A' };
      
      if (appointment.userId && typeof appointment.userId === 'object') {
        customer = {
          name: appointment.userId.name,
          phone: appointment.userId.phone,
          email: appointment.userId.email
        };
      } else if (appointment.patientId && typeof appointment.patientId === 'object') {
        customer = {
          name: appointment.patientId.name,
          phone: appointment.patientId.phone,
          email: appointment.patientId.email || 'N/A'
        };
      }

      // Get price
      let price = 0;
      if (appointment.price) {
        const priceStr = appointment.price.toString();
        const numericPrice = priceStr.replace(/[₹,]/g, '');
        price = parseFloat(numericPrice) || 0;
      }

      return {
        _id: appointment._id,
        orderId: appointmentType === 'clinic' 
          ? `CLINIC-DOC-${appointment._id.toString().slice(-8)}`
          : `DOC-${appointment._id.toString().slice(-8)}`,
        customer,
        amount: price,
        status: appointment.status || 'pending',
        createdAt: appointment.createdAt,
        type: 'doctor',
        appointmentType: appointmentType,
        clinicInfo: appointmentType === 'clinic' ? clinicInfo : null,
        debug: {
          hasClinicId: !!appointment.clinicId,
          clinicIdValue: appointment.clinicId,
          doctorClinicId: doctor.ClinicId,
          isClinicAppointment: appointmentType === 'clinic'
        }
      };
    });

    return recentOrders;
    
  } catch (error) {
    console.error(`Error in getRecentDoctorOrders for doctor ${doctorId}:`, error);
    return [];
  }
}

// Special function for detailed doctor earnings
async function calculateDetailedDoctorEarnings(doctorId, period, cutoffSettings, today, startOfWeek, startOfMonth) {
  const doctorCutoff = cutoffSettings?.doctorCutoff || 5;
  
  const appointments = await Appointment.find({ doctorId: doctorId.toString() });
  
  const totalRevenue = appointments.reduce((sum, apt) => sum + (parseFloat(apt.price) || 0), 0);
  const todayRevenue = appointments.filter(apt => new Date(apt.createdAt) >= today)
    .reduce((sum, apt) => sum + (parseFloat(apt.price) || 0), 0);
  const weeklyRevenue = appointments.filter(apt => new Date(apt.createdAt) >= startOfWeek)
    .reduce((sum, apt) => sum + (parseFloat(apt.price) || 0), 0);
  const monthlyRevenue = appointments.filter(apt => new Date(apt.createdAt) >= startOfMonth)
    .reduce((sum, apt) => sum + (parseFloat(apt.price) || 0), 0);

  return {
    total: {
      revenue: totalRevenue,
      earnings: (totalRevenue * (100 - doctorCutoff)) / 100,
      orders: appointments.length
    },
    today: {
      revenue: todayRevenue,
      earnings: (todayRevenue * (100 - doctorCutoff)) / 100,
      orders: appointments.filter(apt => new Date(apt.createdAt) >= today).length
    },
    weekly: {
      revenue: weeklyRevenue,
      earnings: (weeklyRevenue * (100 - doctorCutoff)) / 100,
      orders: appointments.filter(apt => new Date(apt.createdAt) >= startOfWeek).length
    },
    monthly: {
      revenue: monthlyRevenue,
      earnings: (monthlyRevenue * (100 - doctorCutoff)) / 100,
      orders: appointments.filter(apt => new Date(apt.createdAt) >= startOfMonth).length
    },
    cutoffPercentage: doctorCutoff
  };
}

// Helper function to find vendor by ID
async function findVendorById(vendorId) {
  let vendor = await mongoose.connection.db.collection('vandors').findOne({
    _id: new mongoose.Types.ObjectId(vendorId)
  });

  if (vendor) {
    const type = getVendorType(vendor);
    return [vendor, type];
  }

  // Check in doctors collection
  vendor = await mongoose.connection.db.collection('doctors').findOne({
    _id: new mongoose.Types.ObjectId(vendorId)
  });

  if (vendor) {
    return [vendor, 'doctor'];
  }

  return [null, null];
}

// Helper function to get vendor type
// Helper function to get vendor type - FIXED VERSION
// Helper function to get vendor type - UPDATED WITH CLINIC
function getVendorType(vendor) {
  console.log("Checking vendor type for:", vendor.name, vendor);
  
  // Pehle vendor field check karo
  if (vendor.vendor === 'food' || vendor.vendor === 'restaurant') {
    console.log("Detected as food vendor");
    return 'food';
  }
  if (vendor.vendor === 'pharmacy') {
    console.log("Detected as pharmacy vendor");
    return 'pharmacy';
  }
  if (vendor.vendor === 'lab') {
    console.log("Detected as lab vendor");
    return 'lab';
  }
  
  // Phir vendorType field check karo
  if (vendor.vendorType === 'food' || vendor.vendorType === 'restaurant') {
    console.log("Detected as food vendor (vendorType)");
    return 'food';
  }
  if (vendor.vendorType === 'pharmacy') {
    console.log("Detected as pharmacy vendor (vendorType)");
    return 'pharmacy';
  }
  if (vendor.vendorType === 'lab') {
    console.log("Detected as lab vendor (vendorType)");
    return 'lab';
  }
  
  // Agar kuch bhi nahi mila, toh shopName ya name se check karo
  const shopName = (vendor.shopName || '').toLowerCase();
  const name = (vendor.name || '').toLowerCase();
  
  if (shopName.includes('pharmacy') || name.includes('pharmacy') || 
      shopName.includes('medical') || name.includes('medical')) {
    console.log("Detected as pharmacy vendor (name/shopName)");
    return 'pharmacy';
  }
  
  if (shopName.includes('lab') || name.includes('lab') || 
      shopName.includes('diagnostic') || name.includes('diagnostic')) {
    console.log("Detected as lab vendor (name/shopName)");
    return 'lab';
  }
  
  if (shopName.includes('food') || name.includes('food') || 
      shopName.includes('restaurant') || name.includes('restaurant') ||
      shopName.includes('cafe') || name.includes('cafe')) {
    console.log("Detected as food vendor (name/shopName)");
    return 'food';
  }
  
  console.log("Could not detect vendor type, defaulting to other");
  return 'other';
}

// Helper function to calculate vendor earnings
async function calculateVendorEarnings(vendorType, vendors, period, cutoffSettings, today, startOfWeek, startOfMonth) {
  const earningsPromises = vendors.map(async (vendor) => {
    const vendorId = vendor._id.toString();
    
    const [
      totalEarnings,
      todayEarnings,
      weeklyEarnings,
      monthlyEarnings,
      totalOrders,
      todayOrders,
      weeklyOrders,
      monthlyOrders
    ] = await Promise.all([
      calculateVendorEarningsByPeriod(vendorId, vendorType, 'all', cutoffSettings),
      calculateVendorEarningsByPeriod(vendorId, vendorType, 'today', cutoffSettings, today),
      calculateVendorEarningsByPeriod(vendorId, vendorType, 'week', cutoffSettings, startOfWeek),
      calculateVendorEarningsByPeriod(vendorId, vendorType, 'month', cutoffSettings, startOfMonth),
      calculateVendorOrdersByPeriod(vendorId, vendorType, 'all'),
      calculateVendorOrdersByPeriod(vendorId, vendorType, 'today', today),
      calculateVendorOrdersByPeriod(vendorId, vendorType, 'week', startOfWeek),
      calculateVendorOrdersByPeriod(vendorId, vendorType, 'month', startOfMonth)
    ]);

    return {
      _id: vendor._id,
      name: vendor.name || vendor.shopName || vendor.labName || 'Unknown',
      email: vendor.email || 'N/A',
      phone: vendor.phone || 'N/A',
      type: vendorType,
      shopName: vendor.shopName || vendor.labName || vendor.business || 'N/A',
      totalEarnings,
      todayEarnings,
      weeklyEarnings,
      monthlyEarnings,
      orders: {
        total: totalOrders,
        today: todayOrders,
        weekly: weeklyOrders,
        monthly: monthlyOrders
      },
      isActive: vendor.isActive !== false
    };
  });

  return Promise.all(earningsPromises);
}

// Calculate vendor earnings by period
async function calculateVendorEarningsByPeriod(vendorId, vendorType, period, cutoffSettings, startDate = null) {
  const dateFilter = getDateFilter(period, startDate);
  const cutoffPercentage = getCutoffPercentageByType(cutoffSettings, vendorType);

  switch (vendorType) {
    case 'food':
      const foodOrders = await FoodOrder.aggregate([
        {
          $match: {
            vendorId: new mongoose.Types.ObjectId(vendorId),
            status: { $in: ['5', '7', 'completed'] },
            ...dateFilter
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: { $toDouble: '$price' } }
          }
        }
      ]);
      
      const foodRevenue = foodOrders[0]?.totalRevenue || 0;
      return foodRevenue * (1 - cutoffPercentage / 100);

    case 'pharmacy':
      const pharmacyOrders = await OrderPharmacy.aggregate([
        {
          $match: {
            'items.vendorId': new mongoose.Types.ObjectId(vendorId),
            orderStatus: { $in: ['completed', 'delivered'] },
            ...dateFilter
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$grandTotal' }
          }
        }
      ]);
      
      const pharmacyRevenue = pharmacyOrders[0]?.totalRevenue || 0;
      return pharmacyRevenue * (1 - cutoffPercentage / 100);

    case 'lab':
      const labOrders = await Appointment.aggregate([
        {
          $match: {
            vendorId: new mongoose.Types.ObjectId(vendorId),
            status: '8',
            ...dateFilter,
            $or: [
              { serviceType: 'lab' },
              { serviceType: 'Lab Test' },
              { serviceType: 'Walkin Collection' },
              { serviceType: 'Home Collection' },
              { method: { $in: ['Test', 'Package'] } }
            ]
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: { $toDouble: '$price' } }
          }
        }
      ]);
      
      const labRevenue = labOrders[0]?.totalRevenue || 0;
      return labRevenue * (1 - cutoffPercentage / 100);

    case 'doctor':
      const doctorOrders = await Appointment.aggregate([
        {
          $match: {
            doctorId: new mongoose.Types.ObjectId(vendorId),
            status: '7',
            ...dateFilter,
            serviceType: { $in: ["Endocrinologists", "Neuro", "doctor", "Doctor"] }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: { $toDouble: '$price' } }
          }
        }
      ]);
      
      const doctorRevenue = doctorOrders[0]?.totalRevenue || 0;
      return doctorRevenue * (1 - cutoffPercentage / 100);

    default:
      return 0;
  }
}

// Calculate vendor orders by period
async function calculateVendorOrdersByPeriod(vendorId, vendorType, period, startDate = null) {
  const dateFilter = getDateFilter(period, startDate);

  switch (vendorType) {
    case 'food':
      return FoodOrder.countDocuments({
        vendorId: new mongoose.Types.ObjectId(vendorId),
        status: { $in: ['5', '7', 'completed'] },
        ...dateFilter
      });

    case 'pharmacy':
      return OrderPharmacy.countDocuments({
        'items.vendorId': new mongoose.Types.ObjectId(vendorId),
        orderStatus: { $in: ['completed', 'delivered'] },
        ...dateFilter
      });

    case 'lab':
      return Appointment.countDocuments({
        vendorId: new mongoose.Types.ObjectId(vendorId),
        status: '8',
        ...dateFilter,
        $or: [
          { serviceType: 'lab' },
          { serviceType: 'Lab Test' },
          { serviceType: 'Walkin Collection' },
          { serviceType: 'Home Collection' },
          { method: { $in: ['Test', 'Package'] } }
        ]
      });

    case 'doctor':
      return Appointment.countDocuments({
        doctorId: new mongoose.Types.ObjectId(vendorId),
        status: '7',
        ...dateFilter,
        serviceType: { $in: ["Endocrinologists", "Neuro", "doctor", "Doctor"] }
      });

    default:
      return 0;
  }
}

// Helper function to get date filter
function getDateFilter(period, startDate) {
  switch (period) {
    case 'today':
      return { createdAt: { $gte: startDate } };
    case 'week':
      return { createdAt: { $gte: startDate } };
    case 'month':
      return { createdAt: { $gte: startDate } };
    default:
      return {};
  }
}

// Helper function to get cutoff percentage by vendor type
function getCutoffPercentageByType(cutoffSettings, vendorType) {
  if (!cutoffSettings) return 5;

  switch (vendorType) {
    case 'food':
      return cutoffSettings.foodCutoff;
    case 'pharmacy':
      return cutoffSettings.pharmacyCutoff;
    case 'lab':
      return cutoffSettings.labCutoff;
    case 'doctor':
      return cutoffSettings.doctorCutoff;
     case 'clinic':  // ✅ CLINIC CUTOFF ADD KIYA
      return cutoffSettings.clinicCutoff;
    default:
      return 5;
  }
}

// Calculate detailed vendor earnings
async function calculateDetailedVendorEarnings(vendorId, vendorType, period, cutoffSettings, today, startOfWeek, startOfMonth) {
  const cutoffPercentage = getCutoffPercentageByType(cutoffSettings, vendorType);

  const [
    totalEarnings,
    todayEarnings,
    weeklyEarnings,
    monthlyEarnings,
    totalOrders,
    todayOrders,
    weeklyOrders,
    monthlyOrders,
    recentOrders
  ] = await Promise.all([
    calculateVendorEarningsByPeriod(vendorId, vendorType, 'all', cutoffSettings),
    calculateVendorEarningsByPeriod(vendorId, vendorType, 'today', cutoffSettings, today),
    calculateVendorEarningsByPeriod(vendorId, vendorType, 'week', cutoffSettings, startOfWeek),
    calculateVendorEarningsByPeriod(vendorId, vendorType, 'month', cutoffSettings, startOfMonth),
    calculateVendorOrdersByPeriod(vendorId, vendorType, 'all'),
    calculateVendorOrdersByPeriod(vendorId, vendorType, 'today', today),
    calculateVendorOrdersByPeriod(vendorId, vendorType, 'week', startOfWeek),
    calculateVendorOrdersByPeriod(vendorId, vendorType, 'month', startOfMonth),
    getRecentVendorOrders(vendorId, vendorType)
  ]);

  return {
    summary: {
      totalEarnings,
      todayEarnings,
      weeklyEarnings,
      monthlyEarnings,
      totalOrders,
      todayOrders,
      weeklyOrders,
      monthlyOrders,
      cutoffPercentage,
      adminEarnings: totalEarnings * (cutoffPercentage / 100)
    },
    recentOrders,
    periodBreakdown: {
      total: totalEarnings,
      today: todayEarnings,
      week: weeklyEarnings,
      month: monthlyEarnings
    }
  };
}

// Get recent vendor orders
async function getRecentVendorOrders(vendorId, vendorType) {
  switch (vendorType) {
    case 'food':
      return FoodOrder.find({
        vendorId: new mongoose.Types.ObjectId(vendorId)
      })
      .populate('userId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(10);

    case 'pharmacy':
      return OrderPharmacy.find({
        'items.vendorId': new mongoose.Types.ObjectId(vendorId)
      })
      .populate('userId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(10);

    case 'lab':
      return Appointment.find({
        vendorId: new mongoose.Types.ObjectId(vendorId),
        $or: [
          { serviceType: 'lab' },
          { serviceType: 'Lab Test' },
          { serviceType: 'Walkin Collection' },
          { serviceType: 'Home Collection' },
          { method: { $in: ['Test', 'Package'] } }
        ]
      })
      .populate('userId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(10);

    case 'doctor':
      // ✅ UPDATED: Only independent doctor appointments
      return Appointment.find({
        doctorId: new mongoose.Types.ObjectId(vendorId),
        vendorId: { $in: [null, undefined] },
        $or: [
          { clinicId: null },
          { clinicId: { $exists: false } }
        ]
      })
      .populate('userId', 'name phone')
      .populate('patientId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(10);

    case 'clinic':
      // ✅ UPDATED: Only clinic appointments
      return Appointment.find({
        clinicId: new mongoose.Types.ObjectId(vendorId)
      })
      .populate('userId', 'name phone')
      .populate('doctorId', 'name email')
      .populate('patientId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(10);

    default:
      return [];
  }
}
async function getRecentClinicOrders(clinicId) {
  const orders = await Appointment.find({
    clinicId: clinicId.toString()
  })
    .populate('userId', 'name phone email')
    .populate('doctorId', 'name email')
    .populate('patientId', 'name phone dob gender')
    .sort({ createdAt: -1 })
    .limit(10);

  return orders.map(order => ({
    _id: order._id,
    orderId: `CLINIC-${order._id.toString().slice(-8)}`,
    customer: order.userId ? {
      name: order.userId.name,
      phone: order.userId.phone,
      email: order.userId.email
    } : { 
      name: order.patientId?.name || 'N/A', 
      phone: order.patientId?.phone || 'N/A', 
      email: 'N/A' 
    },
    doctor: order.doctorId ? {
      name: order.doctorId.name,
      email: order.doctorId.email
    } : { name: 'N/A', email: 'N/A' },
    amount: getOrderPrice(order, 'clinic'),
    status: order.status,
    createdAt: order.createdAt,
    type: 'clinic'
  }));
}

module.exports = router;