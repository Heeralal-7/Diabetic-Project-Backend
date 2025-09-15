const {Router} = require('express')
 
const { getDoctors,getDocumentByDoctorId,verifyDoctorAccount, rejectDoctorAccount,approveDocumentField,rejectDocumentField, createInsurance, Membership, getMembership, calculateDiscountedPrice,getCouponsByDoctorId } = require('../../../controllers/admin/Doctor/doctorAccess')
const { adminMiddleware } = require('../../../middleware/auth')
// middlewere
const { middlewere } = require('../../../middleware/auth')

const route = Router()
 
route.get('/getDoctors', adminMiddleware, getDoctors) // GET all doctors
route.get("/getDocumentByDoctorId/:id", adminMiddleware, getDocumentByDoctorId);// GET document by doctor ID
route.patch("/verifyDoctorAccount/:id", adminMiddleware, verifyDoctorAccount); // PATCH verify account
route.patch("/rejectDoctorAccount/:id", adminMiddleware, rejectDoctorAccount);  // PATCH reject account
route.patch("/approveDocumentField/:id",adminMiddleware, approveDocumentField);// approve document field
route.patch("/rejectDocumentField/:id",adminMiddleware, rejectDocumentField);// reject document field
route.get("/getCouponsByDoctorId", adminMiddleware, getCouponsByDoctorId); // GET coupons by doctor ID
route.post("/addInsuranceType", adminMiddleware, createInsurance); // POST add insurance type
 route.post("/Membership",adminMiddleware,Membership)
 route.get("/getMembership",middlewere,getMembership);
 route.post("/calculateDiscountedPrice",middlewere,calculateDiscountedPrice)
module.exports = route
 