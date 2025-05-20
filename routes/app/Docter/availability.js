const { Router } = require("express");

// const { doctorMiddleware } = require("../../../middleware/auth");
const {
  createAvailability,
  getAllStartAndEndDate,
  getAvailabiltyOfDoctorAndTime,
} = require("../../../controllers/app/Docter/availability");
const { doctorMiddleware } = require("../../../middleware/auth");

const router = Router();

router.post("/create", doctorMiddleware, createAvailability);
router.get("/dates", doctorMiddleware, getAllStartAndEndDate);

router.post("/getAvailabilty", doctorMiddleware, getAvailabiltyOfDoctorAndTime);
 
module.exports = router;
