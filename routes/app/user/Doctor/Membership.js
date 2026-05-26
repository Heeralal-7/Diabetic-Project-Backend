const express = require('express');
const router = express.Router();
const {
    getMembershipPlans,
  getMembershipPlanById,
  purchaseMembership,
  getActiveMembership,
  getMembershipHistory,
  checkMembershipForAppointment,
  calculateDiscountedPrice,
  getMembershipBenefits,
  checkMembershipForDelivery,
  updateMembershipDeliveryUsage,
  getMembershipDeliveryUsage,
  updatePharmacyDeliveryUsage
} = require('../../../../controllers/app/user/Doctor/Membership');
const { middlewere } = require('../../../../middleware/auth');

// Route to get all membership plans
router.get('/plans', middlewere, getMembershipPlans);

// Route to get a membership plan by ID
router.get('/plan/:id', middlewere, getMembershipPlanById);

// Route to purchase a membership plan
router.post('/purchase', middlewere, purchaseMembership);

// Route to get active membership for user
router.get('/active', middlewere, getActiveMembership);

// Route to get membership history for user
router.get('/history', middlewere, getMembershipHistory);

// Route to check membership for appointment
router.get('/check-appointment', middlewere, checkMembershipForAppointment);
// ✅ NEW ROUTE: Check membership for delivery charges
router.post('/check-delivery', middlewere, checkMembershipForDelivery);
// router.get('/check-delivery', middlewere, checkMembershipForDelivery);
// ✅ NEW ROUTE: Update membership delivery usage
router.post('/update-delivery-usage', middlewere, updateMembershipDeliveryUsage);
router.post('/update-pharmacy-usage', middlewere, updatePharmacyDeliveryUsage);
// ✅ NEW ROUTE: Get membership delivery usage
router.get('/delivery-usage', middlewere, getMembershipDeliveryUsage);


// Route to calculate discounted price based on membership
router.post('/calculate-price', middlewere, calculateDiscountedPrice);

// Route to get membership benefits
router.get('/benefits', middlewere, getMembershipBenefits);

module.exports = router;