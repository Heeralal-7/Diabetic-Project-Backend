const {Router} = require("express");
const {ClinicMiddleware} = require("../../../middleware/auth");
const { getAllClinicAppointments, acceptOrRejctAppointment, reassignDoctor, getClinicOrderHistory, getClinicRating, getRatingFeedbackclinic } = require("../../../controllers/app/Clinic/ClinicAppiontment");
const router = Router();


router.get("/getAllClinicAppointments",ClinicMiddleware,getAllClinicAppointments)
router.post("/acceptOrRejctAppointment",ClinicMiddleware,acceptOrRejctAppointment)
router.post("/reassignDoctor",ClinicMiddleware,reassignDoctor)
router.get("/getClinicOrderHistory",ClinicMiddleware,getClinicOrderHistory)
router.get("/getClinicRating",ClinicMiddleware,getClinicRating)
router.get("/getRatingFeedbackclinic",ClinicMiddleware,getRatingFeedbackclinic)
module.exports = router            