const express = require('express');
const router = express.Router();
const { 
    testCreate,
    getAllTests,
    getTestById,
    updateTest,
    deleteTest,
    getTestStats
} = require('../../../../controllers/subadmin/Vendor/Lab/TestCreate');
const { subAdminMiddleware } = require('../../../../middleware/auth');

// ✅ TEST MANAGEMENT ROUTES
router.post('/create', subAdminMiddleware, testCreate);
router.get('/all', subAdminMiddleware, getAllTests);
router.get('/stats', subAdminMiddleware, getTestStats);
router.get('/:id', subAdminMiddleware, getTestById);
router.put('/update/:id', subAdminMiddleware, updateTest);
router.delete('/delete/:id', subAdminMiddleware, deleteTest);

module.exports = router;