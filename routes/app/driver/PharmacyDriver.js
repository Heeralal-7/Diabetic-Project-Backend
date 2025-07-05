const express = require('express');
const { getAssignedOrders,
    driverAssignReject,
        startOrder,
        arrivedOrder,
        markAsDelivered,
        rejectOrder,
        orderHistory
} = require('../../../controllers/app/driver/PharmacyDriver');
const { driverMiddleware} = require('../../../middleware/auth');
 
 
const router = express.Router();
 
// Route to get orders assigned to the pharmacy vendor
router.get('/assigned-orders', driverMiddleware, getAssignedOrders);
router.patch('/driver-assign-reject/:orderId', driverMiddleware, driverAssignReject);
router.patch('/start-order/:orderId', driverMiddleware, startOrder);
router.patch('/arrived-order', driverMiddleware, arrivedOrder);
router.patch('/order-delivered/:orderId', driverMiddleware, markAsDelivered);
router.patch('/reject-order/:orderId', driverMiddleware, rejectOrder);
router.get('/order-history', driverMiddleware, orderHistory);
 
module.exports = router;
 