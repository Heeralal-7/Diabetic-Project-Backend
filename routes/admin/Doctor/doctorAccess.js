const {Router} = require('express')
 
const { getDoctors,getDocumentByDoctorId,verifyDoctorAccount, rejectDoctorAccount,approveDocumentField,rejectDocumentField } = require('../../../controllers/admin/Doctor/doctorAccess')
const { adminMiddleware } = require('../../../middleware/auth')
const route = Router()
 
route.get('/getDoctors', adminMiddleware, getDoctors) // GET all doctors
route.get("/getDocumentByDoctorId/:id", adminMiddleware, getDocumentByDoctorId);// GET document by doctor ID
route.patch("/verifyDoctorAccount/:id", adminMiddleware, verifyDoctorAccount); // PATCH verify account
route.patch("/rejectDoctorAccount/:id", adminMiddleware, rejectDoctorAccount);  // PATCH reject account
route.patch("/approveDocumentField/:id",adminMiddleware, approveDocumentField);// approve document field
route.patch("/rejectDocumentField/:id",adminMiddleware, rejectDocumentField);// reject document field
 
module.exports = route
 