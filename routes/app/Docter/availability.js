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
router.post("/dates", doctorMiddleware, getAvailabiltyOfDoctorAndTime);
router.get("/", doctorMiddleware, getAllStartAndEndDate);

module.exports = router;
