const { Router } = require("express");

const {
  createCouponOfDoctor,
  getCouponOfDoctor,
  acceptCloseCouponOfDoctor,
} = require("../../../controllers/app/Docter/coupon");
const { doctorMiddleware } = require("../../../middleware/auth");

const router = Router();

router.post("/create", doctorMiddleware, createCouponOfDoctor);
router.get("/all", doctorMiddleware, getCouponOfDoctor);
router.get("/coupon-status", doctorMiddleware, acceptCloseCouponOfDoctor);

module.exports = router;
