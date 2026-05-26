// controllers/userMembershipController.js
const UserMemberShip = require("../../../../modal/UsermemberShip");
const MemberShip = require("../../../../modal/MemberShip");
const MembershipPurchase = require("../../../../modal/membershipPurchase");
const Appointment = require("../../../../modal/Appointment");
const Wallet = require("../../../../modal/wallet");

// ✅ GET ALL ACTIVE MEMBERSHIP PLANS FOR USER (UPDATED)
// Method: GET
// Endpoint: /user-membership/plans
const getMembershipPlans = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10,
      search = ''
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query for active plans
    let query = { isActive: true };

    // Search filter
    if (search) {
      query.planName = { $regex: search, $options: 'i' };
    }

    // Get total count for pagination
    const totalPlans = await MemberShip.countDocuments(query);
    
    // Get plans with pagination
    // ✅ UPDATED: Added delivery limits and health options to .select()
    const plans = await MemberShip.find(query)
      .select('planName description durationDays consultationLimit labDeliveryLimit foodDeliveryLimit pharmacyDeliveryLimit price features discountPercentage BloodSugar AgeGroup HadDiabetes LifeStyle showDiscounts')
      .sort({ price: 1 })
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(totalPlans / limitNum);

    console.log(`✅ Fetched ${plans.length} membership plans for user`);

    return res.status(200).send({
      success: 1,
      message: "Membership plans fetched successfully",
      data: {
        plans,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalPlans,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }
    });
  } catch (error) {
    console.error("❌ Error fetching membership plans:", error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ GET SINGLE MEMBERSHIP PLAN DETAILS
// Method: GET
// Endpoint: /user-membership/plans/:id
const getMembershipPlanById = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await MemberShip.findById(id)
      .select('planName description durationDays consultationLimit price features discountPercentage BloodSugar AgeGroup HadDiabetes LifeStyle');

    if (!plan) {
      return res.status(404).send({
        success: 0,
        message: "Membership plan not found",
      });
    }

    return res.status(200).send({
      success: 1,
      message: "Membership plan details fetched successfully",
      data: plan,
    });
  } catch (error) {
    console.error("❌ Error fetching membership plan details:", error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ PURCHASE MEMBERSHIP PLAN
// Method: POST
// Endpoint: /user-membership/purchase
// ✅ PURCHASE MEMBERSHIP PLAN (UPDATED)
const purchaseMembership = async (req, res) => {
  try {
    const {
      membershipId,
      paymentDetails,
      BloodSugar,
      AgeGroup,
      HadDiabetes,
      LifeStyle,
      paymentId
    } = req.body;

    const userId = req.user._id;

    if (!membershipId) return res.status(400).send({ success: 0, message: "Membership ID required" });

    const membershipPlan = await MemberShip.findById(membershipId);
    if (!membershipPlan || !membershipPlan.isActive) {
      return res.status(404).send({ success: 0, message: "Plan not found or inactive" });
    }

    // Check active membership
    const activeMembership = await UserMemberShip.findOne({
      userId,
      isActive: true,
      endDate: { $gt: new Date() }
    });

    if (activeMembership) {
      return res.status(400).send({
        success: 0,
        message: "You already have an active membership plan"
      });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + membershipPlan.durationDays);

    // ✅ Create user membership with ALL limits
    const userMembership = new UserMemberShip({
      membershipId,
      userId,
      planName: membershipPlan.planName,
      description: membershipPlan.description,
      durationDays: membershipPlan.durationDays,
      
      // Consultation
      consultationLimit: membershipPlan.consultationLimit,
      consultationsUsed: 0,

      // ✅ Delivery Limits (Copied from Plan)
      labDeliveryLimit: membershipPlan.labDeliveryLimit || 0,
      labDeliveriesUsed: 0,
      foodDeliveryLimit: membershipPlan.foodDeliveryLimit || 0,
      foodDeliveriesUsed: 0,
      pharmacyDeliveryLimit: membershipPlan.pharmacyDeliveryLimit || 0,
      pharmacyDeliveriesUsed: 0,

      pricePaid: membershipPlan.price,
      startDate,
      endDate,
      isActive: true,
      status: "active",
      paymentStatus: "completed",
      paymentId: paymentId || "",
      paymentDetails: paymentDetails || {},
      BloodSugar: BloodSugar || "",
      AgeGroup: AgeGroup || "",
      HadDiabetes: HadDiabetes || "",
      LifeStyle: LifeStyle || ""
    });

    await userMembership.save();

    // Create history record
    const purchaseRecord = new MembershipPurchase({
      userId,
      membershipId,
      planName: membershipPlan.planName,
      durationDays: membershipPlan.durationDays,
      consultationLimit: membershipPlan.consultationLimit,
      // Record limits in history too
      labDeliveryLimit: membershipPlan.labDeliveryLimit || 0,
      foodDeliveryLimit: membershipPlan.foodDeliveryLimit || 0,
      pharmacyDeliveryLimit: membershipPlan.pharmacyDeliveryLimit || 0,
      pricePaid: membershipPlan.price,
      paymentStatus: "completed",
      paymentId: paymentId || "",
      paymentDetails: paymentDetails || {}
    });

    await purchaseRecord.save();

    // Wallet deduction (if using wallet logic)
    const walletData = {
      debit: membershipPlan.price,
      userId: userId,
      description: `Membership purchase: ${membershipPlan.planName}`,
      type: "membership",
      referenceId: userMembership._id
    };
    await Wallet.create(walletData);

    return res.status(201).send({
      success: 1,
      message: "Membership purchased successfully",
      data: {
        membership: userMembership,
        validUntil: endDate
      }
    });
  } catch (error) {
    console.error("❌ Error:", error);
    return res.status(500).send({ success: 0, message: error.message });
  }
};

// ✅ GET ACTIVE MEMBERSHIP (UPDATED)
// Endpoint :  /user-membership/active
 
const getActiveMembership = async (req, res) => {
  try {
    const userId = req.user._id;

    const activeMembership = await UserMemberShip.findOne({
      userId,
      isActive: true,
      endDate: { $gt: new Date() }
    }).populate('membershipId', 'planName description features labDeliveryLimit foodDeliveryLimit pharmacyDeliveryLimit');

    if (!activeMembership) {
      return res.status(201).send({ 
        success: 0, 
        message: "No active membership found" 
      });
    }

    const daysRemaining = Math.ceil((activeMembership.endDate - new Date()) / (1000 * 60 * 60 * 24));

    // ✅ Format response to match frontend expectations
    return res.status(200).send({
      success: 1,
      message: "Active membership fetched successfully",
      data: {
        membership: {
          _id: activeMembership._id,
          planName: activeMembership.planName,
          description: activeMembership.description,
          startDate: activeMembership.startDate,
          endDate: activeMembership.endDate,
          pricePaid: activeMembership.pricePaid,
          BloodSugar: activeMembership.BloodSugar || "",
          AgeGroup: activeMembership.AgeGroup || "",
          HadDiabetes: activeMembership.HadDiabetes || "",
          LifeStyle: activeMembership.LifeStyle || "",
          // ✅ Include ALL delivery limits from membership
          labDeliveryLimit: activeMembership.labDeliveryLimit || 0,
          foodDeliveryLimit: activeMembership.foodDeliveryLimit || 0,
          pharmacyDeliveryLimit: activeMembership.pharmacyDeliveryLimit || 0,
          // ✅ Include ALL delivery usage counts
          labDeliveriesUsed: activeMembership.labDeliveriesUsed || 0,
          foodDeliveriesUsed: activeMembership.foodDeliveriesUsed || 0,
          pharmacyDeliveriesUsed: activeMembership.pharmacyDeliveriesUsed || 0,
          // Consultation data
          consultationLimit: activeMembership.consultationLimit || 0,
          consultationsUsed: activeMembership.consultationsUsed || 0
        },
        usage: {
          // ✅ Corrected structure for frontend
          consultationsUsed: activeMembership.consultationsUsed || 0,
          totalConsultations: activeMembership.consultationLimit || 0,
          consultationsRemaining: Math.max(0, (activeMembership.consultationLimit || 0) - (activeMembership.consultationsUsed || 0)),
          
          // ✅ Delivery usage (formatted as frontend expects)
          labDeliveriesUsed: activeMembership.labDeliveriesUsed || 0,
          foodDeliveriesUsed: activeMembership.foodDeliveriesUsed || 0,
          pharmacyDeliveriesUsed: activeMembership.pharmacyDeliveriesUsed || 0,
          
          daysRemaining,
          isExpired: daysRemaining <= 0
        }
      }
    });
  } catch (error) {
    console.error("❌ Error fetching active membership:", error);
    return res.status(500).send({ 
      success: 0, 
      message: error.message 
    });
  }
};
// Method: POST
// Endpoint: /user-membership/update-pharmacy-usage
const updatePharmacyDeliveryUsage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { 
      orderId,
      rapidDeliveryApplied = false,
      rapidDeliveryDiscount = 0,
      membershipDiscount = 0
    } = req.body;

    const activeMembership = await UserMemberShip.findOne({
      userId,
      isActive: true,
      endDate: { $gt: new Date() }
    });

    if (!activeMembership) {
      return res.status(404).send({ 
        success: 0, 
        message: "No active pharmacy membership found" 
      });
    }

    // Check current pharmacy delivery usage
    const pharmacyLimit = activeMembership.pharmacyDeliveryLimit || 0;
    const pharmacyUsed = activeMembership.pharmacyDeliveriesUsed || 0;
    
    if (pharmacyUsed >= pharmacyLimit) {
      return res.status(400).send({
        success: 0,
        message: "Pharmacy membership delivery limit reached",
        data: {
          used: pharmacyUsed,
          limit: pharmacyLimit,
          remaining: 0
        }
      });
    }

    // Update the usage
    const newUsedCount = pharmacyUsed + 1;
    activeMembership.pharmacyDeliveriesUsed = newUsedCount;

    // Add to delivery history
    activeMembership.deliveryUsageHistory = activeMembership.deliveryUsageHistory || [];
    activeMembership.deliveryUsageHistory.push({
      date: new Date(),
      type: 'pharmacy',
      orderId: orderId,
      usedCount: 1,
      orderType: 'pharmacy',
      rapidDeliveryApplied: rapidDeliveryApplied,
      rapidDeliveryDiscount: rapidDeliveryDiscount,
      membershipDiscount: membershipDiscount,
      totalSavings: membershipDiscount + rapidDeliveryDiscount,
      remainingBefore: pharmacyLimit - pharmacyUsed,
      remainingAfter: pharmacyLimit - newUsedCount
    });

    await activeMembership.save();

    const remainingDeliveries = Math.max(0, pharmacyLimit - newUsedCount);

    return res.status(200).send({
      success: 1,
      message: "Pharmacy membership delivery usage updated successfully",
      data: {
        membershipId: activeMembership._id,
        planName: activeMembership.planName,
        type: 'pharmacy',
        used: newUsedCount,
        limit: pharmacyLimit,
        remaining: remainingDeliveries,
        updatedAt: activeMembership.updatedAt,
        savings: {
          membershipDiscount: membershipDiscount,
          rapidDeliveryDiscount: rapidDeliveryDiscount,
          totalSavings: membershipDiscount + rapidDeliveryDiscount
        }
      }
    });

  } catch (error) {
    console.error("Error updating pharmacy membership delivery usage:", error);
    return res.status(500).send({ 
      success: 0, 
      message: error.message 
    });
  }
};

// Update the existing checkMembershipForDelivery function to handle pharmacy specifically
// Method: POST
// Endpoint: /user-membership/check-delivery
const checkMembershipForDelivery = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type } = req.body; 

    if (!['lab', 'food', 'pharmacy'].includes(type)) {
      return res.status(400).send({ success: 0, message: "Invalid delivery type" });
    }

    const activeMembership = await UserMemberShip.findOne({
      userId,
      isActive: true,
      endDate: { $gt: new Date() },
    });

    let result = {
      hasActiveMembership: false,
      isFreeDelivery: false,
      remainingDeliveries: 0,
      deliveryType: type,
      message: ""
    };

    if (activeMembership) {
      let limit = 0;
      let used = 0;

      if (type === 'lab') {
        limit = activeMembership.labDeliveryLimit || 0;
        used = activeMembership.labDeliveriesUsed || 0;
      } else if (type === 'food') {
        limit = activeMembership.foodDeliveryLimit || 0;
        used = activeMembership.foodDeliveriesUsed || 0;
      } else if (type === 'pharmacy') {
        limit = activeMembership.pharmacyDeliveryLimit || 0;
        used = activeMembership.pharmacyDeliveriesUsed || 0;
      }

      const remaining = Math.max(0, limit - used);

      if (remaining > 0) {
        result = {
          hasActiveMembership: true, 
          isFreeDelivery: true,
          remainingDeliveries: remaining,
          deliveryType: type,
          message: `Free ${type} delivery applied from membership (${remaining} remaining)`,
          membershipDetails: {
            planName: activeMembership.planName,
            limit: limit,
            used: used,
            remaining: remaining
          }
        };
      } else {
        result.hasActiveMembership = true;
        result.message = `Membership ${type} delivery limit exceeded`;
      }
    } else {
      result.message = "No active membership found";
    }

    return res.status(200).send({
      success: 1,
      message: "Delivery check completed",
      data: result,
    });
  } catch (error) {
    console.error("Error checking delivery:", error);
    return res.status(500).send({ success: 0, message: error.message });
  }
};
// ✅ NEW FUNCTION: UPDATE MEMBERSHIP DELIVERY USAGE
// Method: POST
// Endpoint: /user-membership/update-delivery-usage
const updateMembershipDeliveryUsage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { 
      type,           // 'lab', 'food', 'pharmacy'
      orderId,        // Order reference
      usedCount = 1   // Default 1 delivery used
    } = req.body;

    if (!['lab', 'food', 'pharmacy'].includes(type)) {
      return res.status(400).send({ 
        success: 0, 
        message: "Invalid delivery type. Must be 'lab', 'food', or 'pharmacy'" 
      });
    }

    // Find active membership
    const activeMembership = await UserMemberShip.findOne({
      userId,
      isActive: true,
      endDate: { $gt: new Date() }
    });

    if (!activeMembership) {
      return res.status(404).send({ 
        success: 0, 
        message: "No active membership found" 
      });
    }

    // Check current usage
    let currentUsed = 0;
    let currentLimit = 0;
    
    if (type === 'lab') {
      currentUsed = activeMembership.labDeliveriesUsed || 0;
      currentLimit = activeMembership.labDeliveryLimit || 0;
    } else if (type === 'food') {
      currentUsed = activeMembership.foodDeliveriesUsed || 0;
      currentLimit = activeMembership.foodDeliveryLimit || 0;
    } else if (type === 'pharmacy') {
      currentUsed = activeMembership.pharmacyDeliveriesUsed || 0;
      currentLimit = activeMembership.pharmacyDeliveryLimit || 0;
    }

    // Check if limit is reached
    if (currentUsed >= currentLimit) {
      return res.status(400).send({
        success: 0,
        message: `Membership ${type} delivery limit reached`,
        data: {
          used: currentUsed,
          limit: currentLimit,
          remaining: 0
        }
      });
    }

    // Update the usage
    const newUsedCount = currentUsed + usedCount;
    
    if (type === 'lab') {
      activeMembership.labDeliveriesUsed = newUsedCount;
    } else if (type === 'food') {
      activeMembership.foodDeliveriesUsed = newUsedCount;
    } else if (type === 'pharmacy') {
      activeMembership.pharmacyDeliveriesUsed = newUsedCount;
    }

    // Also track in history
    activeMembership.deliveryUsageHistory = activeMembership.deliveryUsageHistory || [];
    activeMembership.deliveryUsageHistory.push({
      date: new Date(),
      type: type,
      orderId: orderId,
      usedCount: usedCount,
      remainingBefore: currentLimit - currentUsed,
      remainingAfter: currentLimit - newUsedCount
    });

    await activeMembership.save();

    // Calculate remaining deliveries
    const remainingDeliveries = Math.max(0, currentLimit - newUsedCount);

    return res.status(200).send({
      success: 1,
      message: "Membership delivery usage updated successfully",
      data: {
        membershipId: activeMembership._id,
        planName: activeMembership.planName,
        type: type,
        used: newUsedCount,
        limit: currentLimit,
        remaining: remainingDeliveries,
        updatedAt: activeMembership.updatedAt
      }
    });

  } catch (error) {
    console.error("❌ Error updating membership delivery usage:", error);
    return res.status(500).send({ 
      success: 0, 
      message: error.message 
    });
  }
};

// ✅ NEW FUNCTION: GET MEMBERSHIP DELIVERY USAGE DETAILS
// Method: GET
// Endpoint: /user-membership/delivery-usage
const getMembershipDeliveryUsage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type } = req.query; // Optional filter

    const activeMembership = await UserMemberShip.findOne({
      userId,
      isActive: true,
      endDate: { $gt: new Date() }
    });

    if (!activeMembership) {
      return res.status(404).send({ 
        success: 0, 
        message: "No active membership found" 
      });
    }

    const usageData = {
      membershipId: activeMembership._id,
      planName: activeMembership.planName,
      startDate: activeMembership.startDate,
      endDate: activeMembership.endDate,
      deliveries: {}
    };

    // Add all delivery types data
    const types = ['lab', 'food', 'pharmacy'];
    types.forEach(type => {
      let limit = 0;
      let used = 0;
      
      if (type === 'lab') {
        limit = activeMembership.labDeliveryLimit || 0;
        used = activeMembership.labDeliveriesUsed || 0;
      } else if (type === 'food') {
        limit = activeMembership.foodDeliveryLimit || 0;
        used = activeMembership.foodDeliveriesUsed || 0;
      } else if (type === 'pharmacy') {
        limit = activeMembership.pharmacyDeliveryLimit || 0;
        used = activeMembership.pharmacyDeliveriesUsed || 0;
      }

      usageData.deliveries[type] = {
        limit: limit,
        used: used,
        remaining: Math.max(0, limit - used),
        usagePercentage: limit > 0 ? Math.round((used / limit) * 100) : 0
      };
    });

    // If specific type requested, return only that
    if (type && ['lab', 'food', 'pharmacy'].includes(type)) {
      return res.status(200).send({
        success: 1,
        message: `Membership ${type} delivery usage fetched`,
        data: {
          ...usageData,
          deliveries: usageData.deliveries[type]
        }
      });
    }

    return res.status(200).send({
      success: 1,
      message: "Membership delivery usage fetched successfully",
      data: usageData
    });

  } catch (error) {
    console.error("❌ Error getting membership delivery usage:", error);
    return res.status(500).send({ 
      success: 0, 
      message: error.message 
    });
  }
};


// ✅ GET USER'S MEMBERSHIP HISTORY
// Method: GET
// Endpoint: /user-membership/history
const getMembershipHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const totalHistory = await UserMemberShip.countDocuments({ userId });
    
    const membershipHistory = await UserMemberShip.find({ userId })
      .populate('membershipId', 'planName description features')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(totalHistory / limitNum);

    return res.status(200).send({
      success: 1,
      message: "Membership history fetched successfully",
      data: {
        history: membershipHistory,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalHistory,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }
    });
  } catch (error) {
    console.error("❌ Error fetching membership history:", error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ CHECK MEMBERSHIP FOR APPOINTMENT (Utility function)
// Method: GET
// Endpoint: /user-membership/check-appointment
const checkMembershipForAppointment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { doctorId } = req.query;

    // ✅ First, find all active memberships
    const activeMembership = await UserMemberShip.findOne({
      userId,
      isActive: true,
      endDate: { $gt: new Date() },
    });

    let result = {
      hasActiveMembership: false,
      isFreeConsultation: false,
      consultationsRemaining: 0,
      membershipDetails: null,
      consultationFees: { onlineFees: "0", offlineFees: "0" },
    };

    if (activeMembership) {
      // ✅ Handle missing/null consultationLimit safely
      const consultationLimit = activeMembership.consultationLimit ?? 0;
      const consultationsUsed = activeMembership.consultationsUsed ?? 0;

      const consultationsRemaining = Math.max(consultationLimit - consultationsUsed, 0);

      // Only count as active if still within consultation limit
      if (consultationsRemaining > 0) {
        result = {
          hasActiveMembership: true,
          isFreeConsultation: true,
          consultationsRemaining,
          membershipDetails: {
            planName: activeMembership.planName,
            consultationsUsed,
            consultationLimit,
            endDate: activeMembership.endDate,
          },
          consultationFees: { onlineFees: "0", offlineFees: "0" },
        };
      }
    } else if (doctorId) {
      // Optional: fetch consultation fees when no membership
      // const consultationFees = await ConsultationFees.findOne({ doctorId });
      // result.consultationFees = consultationFees || { onlineFees: "0", offlineFees: "0" };
    }

    return res.status(200).send({
      success: 1,
      message: "Membership check completed",
      data: result,
    });
  } catch (error) {
    console.error("❌ Error checking membership for appointment:", error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};


// ✅ CALCULATE DISCOUNTED PRICE (From your existing code, updated)
// Method: POST
// Endpoint: /user-membership/calculate-price
// controllers/userMembershipController.js - Updated calculateDiscountedPrice
const calculateDiscountedPrice = async (req, res) => {
  try {
    const userId = req.user._id;
    const { membershipId, BloodSugar, AgeGroup, HadDiabetes, LifeStyle } = req.body;

    if (!membershipId) {
      return res.status(400).send({
        success: 0,
        message: "Membership ID is required",
      });
    }

    // Get membership plan with discount matrix
    const membershipPlan = await MemberShip.findById(membershipId);
    if (!membershipPlan) {
      return res.status(404).send({
        success: 0,
        message: "Membership plan not found",
      });
    }

    const basePrice = membershipPlan.price || 0;
    const planDiscount = membershipPlan.discountPercentage || 0;
    
    let totalDiscountPercent = planDiscount;
    const discountBreakdown = {
      planDiscount,
      conditionDiscounts: {},
      discountMatrix: membershipPlan.showDiscounts ? membershipPlan.discountMatrix : null
    };

    // Calculate discounts based on user selections using discount matrix
    const discountMatrix = membershipPlan.discountMatrix || {};

    // Blood Sugar discount
    if (BloodSugar && discountMatrix.BloodSugar) {
      const bloodSugarOption = discountMatrix.BloodSugar.find(
        item => item.option === BloodSugar
      );
      if (bloodSugarOption && bloodSugarOption.discount) {
        totalDiscountPercent += bloodSugarOption.discount;
        discountBreakdown.conditionDiscounts.BloodSugar = {
          option: BloodSugar,
          discount: bloodSugarOption.discount
        };
      }
    }

    // Age Group discount
    if (AgeGroup && discountMatrix.AgeGroup) {
      const ageGroupOption = discountMatrix.AgeGroup.find(
        item => item.option === AgeGroup
      );
      if (ageGroupOption && ageGroupOption.discount) {
        totalDiscountPercent += ageGroupOption.discount;
        discountBreakdown.conditionDiscounts.AgeGroup = {
          option: AgeGroup,
          discount: ageGroupOption.discount
        };
      }
    }

    // Diabetes History discount
    if (HadDiabetes && discountMatrix.HadDiabetes) {
      const diabetesOption = discountMatrix.HadDiabetes.find(
        item => item.option === HadDiabetes
      );
      if (diabetesOption && diabetesOption.discount) {
        totalDiscountPercent += diabetesOption.discount;
        discountBreakdown.conditionDiscounts.HadDiabetes = {
          option: HadDiabetes,
          discount: diabetesOption.discount
        };
      }
    }

    // Lifestyle discount
    if (LifeStyle && discountMatrix.LifeStyle) {
      const lifestyleOption = discountMatrix.LifeStyle.find(
        item => item.option === LifeStyle
      );
      if (lifestyleOption && lifestyleOption.discount) {
        totalDiscountPercent += lifestyleOption.discount;
        discountBreakdown.conditionDiscounts.LifeStyle = {
          option: LifeStyle,
          discount: lifestyleOption.discount
        };
      }
    }

    // Cap discount at 80%
    totalDiscountPercent = Math.min(totalDiscountPercent, 80);

    const discountAmount = (basePrice * totalDiscountPercent) / 100;
    const finalPrice = basePrice - discountAmount;

    return res.status(200).send({
      success: 1,
      message: "Price calculated successfully",
      data: {
        basePrice,
        planDiscount,
        totalDiscountPercent,
        discountAmount,
        finalPrice,
        discountBreakdown,
        showDiscounts: membershipPlan.showDiscounts || false,
        // Return available options for frontend display
        availableOptions: membershipPlan.showDiscounts ? {
          BloodSugar: discountMatrix.BloodSugar?.map(item => ({
            option: item.option,
            discount: item.discount
          })) || [],
          AgeGroup: discountMatrix.AgeGroup?.map(item => ({
            option: item.option,
            discount: item.discount
          })) || [],
          HadDiabetes: discountMatrix.HadDiabetes?.map(item => ({
            option: item.option,
            discount: item.discount
          })) || [],
          LifeStyle: discountMatrix.LifeStyle?.map(item => ({
            option: item.option,
            discount: item.discount
          })) || []
        } : null
      }
    });
  } catch (error) {
    console.error("❌ Error calculating price:", error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ GET MEMBERSHIP BENEFITS AND STATS
// Method: GET
// Endpoint: /user-membership/benefits
// ✅ GET MEMBERSHIP BENEFITS AND STATS (UPDATED)
const getMembershipBenefits = async (req, res) => {
  try {
    const userId = req.user._id;

    const activeMembership = await UserMemberShip.findOne({
      userId,
      isActive: true,
      endDate: { $gt: new Date() }
    });

    // Get total appointments made using membership
    const membershipAppointments = await Appointment.countDocuments({
      userId,
      userMembershipId: { $exists: true },
      isFreeConsultation: true
    });

    // Calculate savings
    const totalSavings = membershipAppointments * 500; // Assuming average consultation fee

    const benefits = {
      hasActiveMembership: !!activeMembership,
      totalFreeConsultations: membershipAppointments,
      estimatedSavings: totalSavings,
      benefits: [
        "Free consultations during membership period",
        "Priority customer support",
        "Health tracking features",
        "Personalized health insights",
        "Free delivery benefits on lab, food, and medicine orders"
      ]
    };

    if (activeMembership) {
      // ✅ Include delivery benefits in response
      benefits.currentPlan = {
        planName: activeMembership.planName,
        consultationsUsed: activeMembership.consultationsUsed || 0,
        consultationLimit: activeMembership.consultationLimit || 0,
        consultationsRemaining: Math.max(0, (activeMembership.consultationLimit || 0) - (activeMembership.consultationsUsed || 0)),
        daysRemaining: Math.ceil((activeMembership.endDate - new Date()) / (1000 * 60 * 60 * 24)),
        
        // ✅ Delivery benefits
        deliveryBenefits: {
          lab: {
            limit: activeMembership.labDeliveryLimit || 0,
            used: activeMembership.labDeliveriesUsed || 0,
            remaining: Math.max(0, (activeMembership.labDeliveryLimit || 0) - (activeMembership.labDeliveriesUsed || 0))
          },
          food: {
            limit: activeMembership.foodDeliveryLimit || 0,
            used: activeMembership.foodDeliveriesUsed || 0,
            remaining: Math.max(0, (activeMembership.foodDeliveryLimit || 0) - (activeMembership.foodDeliveriesUsed || 0))
          },
          pharmacy: {
            limit: activeMembership.pharmacyDeliveryLimit || 0,
            used: activeMembership.pharmacyDeliveriesUsed || 0,
            remaining: Math.max(0, (activeMembership.pharmacyDeliveryLimit || 0) - (activeMembership.pharmacyDeliveriesUsed || 0))
          }
        }
      };
      
      // ✅ Calculate delivery savings
      const deliverySavings = 
        ((activeMembership.labDeliveriesUsed || 0) * 50) + // Lab delivery charge
        ((activeMembership.foodDeliveriesUsed || 0) * 30) + // Food delivery charge
        ((activeMembership.pharmacyDeliveriesUsed || 0) * 40); // Pharmacy delivery charge
      
      benefits.estimatedSavings += deliverySavings;
    }

    return res.status(200).send({
      success: 1,
      message: "Membership benefits fetched successfully",
      data: benefits
    });
  } catch (error) {
    console.error("❌ Error fetching membership benefits:", error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};



module.exports = {
  getMembershipPlans,
  getMembershipPlanById,
  purchaseMembership,
  getActiveMembership,
  getMembershipHistory,
  checkMembershipForAppointment,
  checkMembershipForDelivery,
  updatePharmacyDeliveryUsage,
  updateMembershipDeliveryUsage,
  getMembershipDeliveryUsage,
  calculateDiscountedPrice,
  getMembershipBenefits
};