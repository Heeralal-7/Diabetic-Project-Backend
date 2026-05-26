const express = require('express');
const { subAdminMiddleware } = require('../../../middleware/auth');
const { createMembershipPlan, getMembershipPlans, getMembershipPlanById, updateMembershipPlan, toggleMembershipPlanStatus, getActiveMembershipPlans, calculateDiscountPreview, updateDiscountMatrix, getPlanDiscountMatrix } = require('../../../controllers/subadmin/doctor/MembershipPlans');
const router = express.Router();
 
 
router.post("/sub/create-membership-plans",subAdminMiddleware,createMembershipPlan);
router.get("/sub/membership-plans",subAdminMiddleware,getMembershipPlans);
router.get("/sub/membership-plansById/:id",subAdminMiddleware,getMembershipPlanById);
router.put("/sub/membership-update/:id",subAdminMiddleware,updateMembershipPlan);
router.patch("/sub/toggle-status/:id",subAdminMiddleware,toggleMembershipPlanStatus);
 
// Get all active membership plans
router.get('/sub/active/plans', getActiveMembershipPlans);
// NEW: Calculate discount preview
router.post('/sub/calculate-preview', subAdminMiddleware, calculateDiscountPreview);
 
// NEW: Get discount matrix
router.get('/sub/discount-matrix/:id', subAdminMiddleware, getPlanDiscountMatrix);
 
// NEW: Update discount matrixupdateMembershipPlan
router.put('/sub/discount-matrix/:id', subAdminMiddleware,updateDiscountMatrix);
 
module.exports = router;
 