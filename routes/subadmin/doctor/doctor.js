const express = require('express');
const router = express.Router();
const { 
  getDoctors, 
  getDoctorById, 
  updateDoctorVerification, 
  deleteDoctor,
  getDocumentByDoctorId,
  verifyDoctorAccount,
  rejectDoctorAccount,
  approveDocumentField,
  rejectDocumentField,
  createInsurance,
  createQualification,
  getQualifications,
  createMembership,
  getMembership,
  calculateDiscountedPrice,
  getDoctorStats,
  getMonthlyDoctorStats
} = require('../../../controllers/subadmin/doctor/doctor');
const { subAdminMiddleware } = require('../../../middleware/auth');

// Doctor Management Routes
router.get('/', subAdminMiddleware, getDoctors);
router.get('/stats', subAdminMiddleware, getDoctorStats);
router.get('/monthly-stats', subAdminMiddleware, getMonthlyDoctorStats);
router.get('/:id', subAdminMiddleware, getDoctorById);
router.put('/:id/verification', subAdminMiddleware, updateDoctorVerification);
router.delete('/:id', subAdminMiddleware, deleteDoctor);

// Document Management Routes
router.get('/:id/documents', subAdminMiddleware, getDocumentByDoctorId);
router.patch('/:id/documents/approve', subAdminMiddleware, approveDocumentField);
router.patch('/:id/documents/reject', subAdminMiddleware, rejectDocumentField);

// Account Verification Routes
router.patch('/:id/verify', subAdminMiddleware, verifyDoctorAccount);
router.patch('/:id/reject', subAdminMiddleware, rejectDoctorAccount);

// Insurance Management Routes
router.post('/insurance', subAdminMiddleware, createInsurance);


// Qualification Management Routes
router.post('/qualifications', subAdminMiddleware, createQualification);
router.get('/qualifications', subAdminMiddleware, getQualifications);

// Membership Management Routes
router.post('/membership', subAdminMiddleware, createMembership);
router.get('/membership', subAdminMiddleware, getMembership);
router.post('/membership/calculate-discount', subAdminMiddleware, calculateDiscountedPrice);

module.exports = router;