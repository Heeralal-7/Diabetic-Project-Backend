// admin membership routes
const express = require('express');
const router = express.Router();
const {
  createMembershipPlan,
  getMembershipPlans,
  getMembershipPlanById,
  updateMembershipPlan,
  toggleMembershipPlanStatus,
  getActiveMembershipPlans,
  calculateDiscountPreview,
  getPlanDiscountMatrix,
  updateDiscountMatrix
} = require('../../../controllers/admin/Doctor/Membership');
const { adminMiddleware } = require('../../../middleware/auth');

// Create a new membership plan
router.post('/create', adminMiddleware, createMembershipPlan);

// Get all membership plans
router.get('/all', adminMiddleware, getMembershipPlans);

// Get a membership plan by ID
router.get('/:id', adminMiddleware, getMembershipPlanById);

// Update a membership plan
router.put('/update/:id', adminMiddleware, updateMembershipPlan);

// Toggle membership plan status
router.patch('/toggle-status/:id', adminMiddleware, toggleMembershipPlanStatus);

// Get all active membership plans
router.get('/active/plans', getActiveMembershipPlans);

// NEW: Calculate discount preview
router.post('/calculate-preview', adminMiddleware, calculateDiscountPreview);

// NEW: Get discount matrix
router.get('/discount-matrix/:id', adminMiddleware, getPlanDiscountMatrix);

// NEW: Update discount matrix
router.put('/discount-matrix/:id', adminMiddleware, updateDiscountMatrix);

module.exports = router;