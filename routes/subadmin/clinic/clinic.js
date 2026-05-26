const express = require('express');
const router = express.Router();
const { 
  getAllClinics,
  getClinicById,
  getClinicStats,
  getClinicsByStatus,
  approveClinic,
  rejectClinic,
  getDocumentByClinicId,
  approveClinicDocumentField,
  rejectClinicDocumentField,

} = require('../../../controllers/subadmin/clinic/clinic');
const { subAdminMiddleware } = require('../../../middleware/auth');

// Main routes (keeping your original structure)
router.get('/', subAdminMiddleware, getAllClinics);
router.get('/stats', subAdminMiddleware, getClinicStats);
router.get('/status/:status', subAdminMiddleware, getClinicsByStatus);
router.get('/:id', subAdminMiddleware, getClinicById);

// Verification routes (updated to match admin structure)
router.put('/:id/approve', subAdminMiddleware, approveClinic);
router.put('/:id/reject', subAdminMiddleware, rejectClinic);

// Document routes
router.get('/:id/documents', subAdminMiddleware, getDocumentByClinicId);
router.put('/:id/documents/approve-field', subAdminMiddleware, approveClinicDocumentField);
router.put('/:id/documents/reject-field', subAdminMiddleware, rejectClinicDocumentField);



module.exports = router;