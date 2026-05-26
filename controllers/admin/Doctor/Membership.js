// controllers/admin/Doctor/Membership.js
const membership = require("../../../modal/MemberShip");

// ✅ CREATE MEMBERSHIP PLAN WITH DISCOUNT MATRIX
// ✅ CREATE MEMBERSHIP PLAN WITH DISCOUNT MATRIX & DELIVERY LIMITS
const createMembershipPlan = async (req, res) => {
  try {
    const {
      planName,
      description,
      durationDays,
      consultationLimit,
      // ✅ New Delivery Limits
      labDeliveryLimit,
      foodDeliveryLimit,
      pharmacyDeliveryLimit,
      
      price,
      features,
      discountPercentage,
      BloodSugar,
      AgeGroup,
      HadDiabetes,
      LifeStyle,
      BloodSugarDiscounts = [],
      AgeGroupDiscounts = [],
      HadDiabetesDiscounts = [],
      LifeStyleDiscounts = []
    } = req.body;

    // ✅ CHECK PERMISSION FOR SUB-ADMIN
    if (req.subAdmin && !req.subAdmin.permissions?.membership?.create) {
      return res.status(403).send({
        success: 0,
        message: "No permission to create membership plans",
      });
    }

    // Validation
    if (!planName || !durationDays || !consultationLimit || price === undefined) {
      return res.status(400).send({
        success: 0,
        message: "Plan name, duration, consultation limit, and price are required",
      });
    }

    // Check if plan name already exists
    const existingPlan = await membership.findOne({ 
      planName: planName.trim(),
      isActive: true 
    });

    if (existingPlan) {
      return res.status(400).send({
        success: 0,
        message: "A membership plan with this name already exists",
      });
    }

    // Create discount matrix
    const discountMatrix = {
      BloodSugar: BloodSugar ? BloodSugar.map((option, index) => ({
        option,
        discount: BloodSugarDiscounts[index] || 0
      })) : [],
      AgeGroup: AgeGroup ? AgeGroup.map((option, index) => ({
        option,
        discount: AgeGroupDiscounts[index] || 0
      })) : [],
      HadDiabetes: HadDiabetes ? HadDiabetes.map((option, index) => ({
        option,
        discount: HadDiabetesDiscounts[index] || 0
      })) : [],
      LifeStyle: LifeStyle ? LifeStyle.map((option, index) => ({
        option,
        discount: LifeStyleDiscounts[index] || 0
      })) : []
    };

    const newMembership = new membership({
      planName: planName.trim(),
      description: description?.trim() || "",
      durationDays: parseInt(durationDays),
      consultationLimit: parseInt(consultationLimit),
      
      // ✅ Saving Delivery Limits (Default to 0 if not provided)
      labDeliveryLimit: labDeliveryLimit ? parseInt(labDeliveryLimit) : 0,
      foodDeliveryLimit: foodDeliveryLimit ? parseInt(foodDeliveryLimit) : 0,
      pharmacyDeliveryLimit: pharmacyDeliveryLimit ? parseInt(pharmacyDeliveryLimit) : 0,

      price: parseFloat(price),
      features: features || [],
      discountPercentage: discountPercentage || 0,
      BloodSugar: BloodSugar || [],
      AgeGroup: AgeGroup || [],
      HadDiabetes: HadDiabetes || [],
      LifeStyle: LifeStyle || [],
      discountMatrix,
      showDiscounts: true,
      adminId: req.user._id
    });

    await newMembership.save();

    console.log(`✅ Membership plan created: ${newMembership.planName}`);

    return res.status(201).send({
      success: 1,
      message: "Membership plan created successfully",
      data: newMembership,
    });
  } catch (error) {
    console.error("❌ Error creating membership plan:", error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ GET ALL MEMBERSHIP PLANS
const getMembershipPlans = async (req, res) => {
  try {
    const { 
      status = 'active',
      page = 1, 
      limit = 10,
      search = ''
    } = req.query;

    if (req.subAdmin && !req.subAdmin.permissions?.membership?.view) {
      return res.status(403).send({ success: 0, message: "No permission" });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = {};
    if (status === 'active') query.isActive = true;
    else if (status === 'inactive') query.isActive = false;
    
    if (search) query.planName = { $regex: search, $options: 'i' };

    const totalPlans = await membership.countDocuments(query);
    const plans = await membership.find(query)
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const plansWithDiscounts = plans.map(plan => {
      const basePrice = plan.price || 0;
      const planDiscount = plan.discountPercentage || 0;
      const discountedPrice = basePrice - (basePrice * planDiscount / 100);
      return { ...plan.toObject(), discountedPrice };
    });

    return res.status(200).send({
      success: 1,
      message: "Plans fetched",
      data: {
        plans: plansWithDiscounts,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalPlans / limitNum),
          totalPlans
        }
      }
    });
  } catch (error) {
    return res.status(500).send({ success: 0, message: error.message });
  }
};



// ✅ CALCULATE DISCOUNTED PRICE (ADMIN VIEW)
const calculateDiscountPreview = async (req, res) => {
  try {
    const { planId, selections } = req.body;

    if (!planId) {
      return res.status(400).send({
        success: 0,
        message: "Plan ID is required",
      });
    }

    const plan = await membership.findById(planId);
    if (!plan) {
      return res.status(404).send({
        success: 0,
        message: "Membership plan not found",
      });
    }

    const basePrice = plan.price || 0;
    const planDiscount = plan.discountPercentage || 0;
    
    let totalDiscountPercent = planDiscount;
    const discountBreakdown = {
      planDiscount,
      conditionDiscounts: {}
    };

    // Calculate discounts based on selections
    if (selections) {
      const discountMatrix = plan.discountMatrix || {};

      // Blood Sugar discount
      if (selections.BloodSugar && discountMatrix.BloodSugar) {
        const bloodSugarOption = discountMatrix.BloodSugar.find(
          item => item.option === selections.BloodSugar
        );
        if (bloodSugarOption && bloodSugarOption.discount) {
          totalDiscountPercent += bloodSugarOption.discount;
          discountBreakdown.conditionDiscounts.BloodSugar = {
            option: selections.BloodSugar,
            discount: bloodSugarOption.discount
          };
        }
      }

      // Age Group discount
      if (selections.AgeGroup && discountMatrix.AgeGroup) {
        const ageGroupOption = discountMatrix.AgeGroup.find(
          item => item.option === selections.AgeGroup
        );
        if (ageGroupOption && ageGroupOption.discount) {
          totalDiscountPercent += ageGroupOption.discount;
          discountBreakdown.conditionDiscounts.AgeGroup = {
            option: selections.AgeGroup,
            discount: ageGroupOption.discount
          };
        }
      }

      // Diabetes History discount
      if (selections.HadDiabetes && discountMatrix.HadDiabetes) {
        const diabetesOption = discountMatrix.HadDiabetes.find(
          item => item.option === selections.HadDiabetes
        );
        if (diabetesOption && diabetesOption.discount) {
          totalDiscountPercent += diabetesOption.discount;
          discountBreakdown.conditionDiscounts.HadDiabetes = {
            option: selections.HadDiabetes,
            discount: diabetesOption.discount
          };
        }
      }

      // Lifestyle discount
      if (selections.LifeStyle && discountMatrix.LifeStyle) {
        const lifestyleOption = discountMatrix.LifeStyle.find(
          item => item.option === selections.LifeStyle
        );
        if (lifestyleOption && lifestyleOption.discount) {
          totalDiscountPercent += lifestyleOption.discount;
          discountBreakdown.conditionDiscounts.LifeStyle = {
            option: selections.LifeStyle,
            discount: lifestyleOption.discount
          };
        }
      }
    }

    // Cap discount at 80%
    totalDiscountPercent = Math.min(totalDiscountPercent, 80);

    const discountAmount = (basePrice * totalDiscountPercent) / 100;
    const finalPrice = basePrice - discountAmount;

    return res.status(200).send({
      success: 1,
      message: "Discount calculation successful",
      data: {
        basePrice,
        planDiscount,
        totalDiscountPercent,
        discountAmount,
        finalPrice,
        discountBreakdown,
        maxPossibleDiscount: planDiscount + 
          (plan.discountMatrix?.BloodSugar?.reduce((max, item) => Math.max(max, item.discount || 0), 0) || 0) +
          (plan.discountMatrix?.AgeGroup?.reduce((max, item) => Math.max(max, item.discount || 0), 0) || 0) +
          (plan.discountMatrix?.HadDiabetes?.reduce((max, item) => Math.max(max, item.discount || 0), 0) || 0) +
          (plan.discountMatrix?.LifeStyle?.reduce((max, item) => Math.max(max, item.discount || 0), 0) || 0)
      }
    });
  } catch (error) {
    console.error("❌ Error calculating discount preview:", error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ GET PLAN DISCOUNT MATRIX
const getPlanDiscountMatrix = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await membership.findById(id).select(
      'planName price discountPercentage discountMatrix BloodSugar AgeGroup HadDiabetes LifeStyle showDiscounts'
    );

    if (!plan) {
      return res.status(404).send({
        success: 0,
        message: "Membership plan not found",
      });
    }

    return res.status(200).send({
      success: 1,
      message: "Discount matrix fetched successfully",
      data: {
        planName: plan.planName,
        basePrice: plan.price,
        planDiscount: plan.discountPercentage || 0,
        showDiscounts: plan.showDiscounts || false,
        options: {
          BloodSugar: plan.BloodSugar || [],
          AgeGroup: plan.AgeGroup || [],
          HadDiabetes: plan.HadDiabetes || [],
          LifeStyle: plan.LifeStyle || []
        },
        discountMatrix: plan.discountMatrix || {
          BloodSugar: [],
          AgeGroup: [],
          HadDiabetes: [],
          LifeStyle: []
        }
      }
    });
  } catch (error) {
    console.error("❌ Error fetching discount matrix:", error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ UPDATE DISCOUNT MATRIX
const updateDiscountMatrix = async (req, res) => {
  try {
    const { id } = req.params;
    const { discountMatrix, showDiscounts } = req.body;

    // ✅ CHECK PERMISSION FOR SUB-ADMIN
    if (req.subAdmin && !req.subAdmin.permissions?.membership?.edit) {
      return res.status(403).send({
        success: 0,
        message: "No permission to update discount matrix",
      });
    }

    const plan = await membership.findById(id);
    if (!plan) {
      return res.status(404).send({
        success: 0,
        message: "Membership plan not found",
      });
    }

    const updateData = {};
    if (discountMatrix) {
      updateData.discountMatrix = discountMatrix;
    }
    if (showDiscounts !== undefined) {
      updateData.showDiscounts = showDiscounts;
    }

    const updatedPlan = await membership.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return res.status(200).send({
      success: 1,
      message: "Discount matrix updated successfully",
      data: updatedPlan,
    });
  } catch (error) {
    console.error("❌ Error updating discount matrix:", error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ GET SINGLE MEMBERSHIP PLAN BY ID
const getMembershipPlanById = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ CHECK PERMISSION FOR SUB-ADMIN
    if (req.subAdmin && !req.subAdmin.permissions?.membership?.view) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view membership plans",
      });
    }

    const plan = await membership.findById(id).populate('adminId', 'name email');

    if (!plan) {
      return res.status(404).send({
        success: 0,
        message: "Membership plan not found",
      });
    }

    return res.status(200).send({
      success: 1,
      message: "Membership plan fetched successfully",
      data: plan,
    });
  } catch (error) {
    console.error("❌ Error fetching membership plan:", error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ UPDATE MEMBERSHIP PLAN
const updateMembershipPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (req.subAdmin && !req.subAdmin.permissions?.membership?.edit) {
      return res.status(403).send({ success: 0, message: "No permission" });
    }

    delete updateData._id;
    delete updateData.adminId;
    delete updateData.createdAt;

    if (updateData.planName) {
      const existingPlan = await membership.findOne({
        planName: updateData.planName.trim(),
        _id: { $ne: id },
        isActive: true
      });
      if (existingPlan) return res.status(400).send({ success: 0, message: "Name exists" });
      updateData.planName = updateData.planName.trim();
    }

    // Parse numeric fields including new delivery limits
    if (updateData.durationDays) updateData.durationDays = parseInt(updateData.durationDays);
    if (updateData.consultationLimit) updateData.consultationLimit = parseInt(updateData.consultationLimit);
    if (updateData.labDeliveryLimit !== undefined) updateData.labDeliveryLimit = parseInt(updateData.labDeliveryLimit);
    if (updateData.foodDeliveryLimit !== undefined) updateData.foodDeliveryLimit = parseInt(updateData.foodDeliveryLimit);
    if (updateData.pharmacyDeliveryLimit !== undefined) updateData.pharmacyDeliveryLimit = parseInt(updateData.pharmacyDeliveryLimit);
    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.discountPercentage) updateData.discountPercentage = parseFloat(updateData.discountPercentage);

    const updatedPlan = await membership.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('adminId', 'name email');

    if (!updatedPlan) return res.status(404).send({ success: 0, message: "Plan not found" });

    return res.status(200).send({
      success: 1,
      message: "Membership plan updated",
      data: updatedPlan,
    });
  } catch (error) {
    return res.status(500).send({ success: 0, message: error.message });
  }
};

// ✅ TOGGLE MEMBERSHIP PLAN STATUS (Activate/Deactivate)
const toggleMembershipPlanStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ CHECK PERMISSION FOR SUB-ADMIN
    if (req.subAdmin && !req.subAdmin.permissions?.membership?.edit) {
      return res.status(403).send({
        success: 0,
        message: "No permission to update membership plans",
      });
    }

    const plan = await membership.findById(id);

    if (!plan) {
      return res.status(404).send({
        success: 0,
        message: "Membership plan not found",
      });
    }

    const updatedPlan = await membership.findByIdAndUpdate(
      id,
      { isActive: !plan.isActive },
      { new: true }
    ).populate('adminId', 'name email');

    const statusMessage = updatedPlan.isActive ? "activated" : "deactivated";

    console.log(`✅ Membership plan ${statusMessage}: ${updatedPlan.planName}`);

    return res.status(200).send({
      success: 1,
      message: `Membership plan ${statusMessage} successfully`,
      data: updatedPlan,
    });
  } catch (error) {
    console.error("❌ Error toggling membership plan status:", error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ GET ACTIVE MEMBERSHIP PLANS (For dropdown/selection)
const getActiveMembershipPlans = async (req, res) => {
  try {
    const activePlans = await membership.find({ isActive: true })
      .select('planName description durationDays consultationLimit price features discountPercentage')
      .sort({ price: 1 });

    return res.status(200).send({
      success: 1,
      message: "Active membership plans fetched successfully",
      data: activePlans,
    });
  } catch (error) {
    console.error("❌ Error fetching active membership plans:", error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = {
  createMembershipPlan,
  getMembershipPlans,
  getMembershipPlanById,
  updateMembershipPlan,
  toggleMembershipPlanStatus,
  getActiveMembershipPlans,
  calculateDiscountPreview,
  getPlanDiscountMatrix,
  updateDiscountMatrix
};