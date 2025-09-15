const { Router } = require("express");
const { doctorMiddleware } = require("../../../middleware/auth");
const {
  getAllDoctorAppointments,
  acceptOrRejctAppointment,
  addPrescribe,
  postPonedAppointment,
  paymentDone,
  getpayment,
  
} = require("../../../controllers/app/Docter/appointments");

const router = Router();

router.get("/", doctorMiddleware, getAllDoctorAppointments);
router.patch("/accept-reject", doctorMiddleware, acceptOrRejctAppointment);
router.post("/prescribe", doctorMiddleware, addPrescribe);
router.post("/postponed", doctorMiddleware, postPonedAppointment);
router.get("/getpayment",getpayment)
router.post("/paymentDone",paymentDone)
module.exports = router;
