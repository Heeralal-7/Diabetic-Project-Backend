const express = require('express');
const router = express.Router();
const {
  getCancellationRequests,
  getCancellationSettings,
  updateCancellationSettings,
  adminCancelOrder,
  getCancellationAnalytics
} = require('../../../controllers/subadmin/user/cancellationCharge');
const { subAdminMiddleware } = require('../../../middleware/auth');


// ✅ Get cancellation requests
// Endpoint: /subadmin-cancellation/cancellation-requests
router.get('/cancellation-requests', subAdminMiddleware, getCancellationRequests);

// ✅ Get cancellation settings
// Endpoint: /subadmin-cancellation/cancellation-settings
router.get('/cancellation-settings', subAdminMiddleware,getCancellationSettings);

// ✅ Update cancellation settings
// Endpoint: /subadmin-cancellation/update-settings
router.put('/update-settings', subAdminMiddleware,updateCancellationSettings);

// ✅ Admin cancel order
// Endpoint: /subadmin-cancellation/cancel-order
router.post('/cancel-order', subAdminMiddleware,adminCancelOrder);

// ✅ Get cancellation analytics
// Endpoint: /subadmin-cancellation/analytics
router.get('/analytics', subAdminMiddleware,getCancellationAnalytics);

module.exports = router;