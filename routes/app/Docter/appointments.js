const { Router } = require("express");
const { doctorMiddleware } = require("../../../middleware/auth");
const {
  getAllDoctorAppointments,
  acceptOrRejctAppointment,
  addPrescribe,
  postPonedAppointment,
} = require("../../../controllers/app/Docter/appointments");

const router = Router();

router.get("/", doctorMiddleware, getAllDoctorAppointments);
router.patch("/accept-reject", doctorMiddleware, acceptOrRejctAppointment);
router.post("/prescribe", doctorMiddleware, addPrescribe);
router.post("/", doctorMiddleware, postPonedAppointment);

module.exports = router;
