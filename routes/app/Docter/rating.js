const { Router } = require("express");

const { doctorMiddleware } = require("../../../middleware/auth");
const {
  getDoctorRating,
  getRatingFeedback,
} = require("../../../controllers/app/Docter/rating");

const router = Router();

router.get("/", doctorMiddleware, getDoctorRating);
router.get("/feedback", doctorMiddleware, getRatingFeedback);

module.exports = router;
