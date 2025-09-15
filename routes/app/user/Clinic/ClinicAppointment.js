const {Router} = require("express");
const { appointment, getAllUserAppointments } = require("../../../../controllers/app/user/Clinic/Appointment");
const {middlewere} = require("../../../../middleware/auth")
const router = Router();

router.post("/appointment",middlewere,appointment)
router.get("/getAllUserAppointments",middlewere,getAllUserAppointments)

module.exports = router