const { Router } = require("express");

const { doctorMiddleware } = require("../../../middleware/auth");
const {
  getDoctorRating,
  getRatingFeedback,
  getAverage,
} = require("../../../controllers/app/Docter/rating");

const router = Router();

router.get("/rating", doctorMiddleware, getDoctorRating);
router.get("/feedback", doctorMiddleware, getRatingFeedback);
router.get("/getAverage",doctorMiddleware,getAverage)
module.exports = router;
