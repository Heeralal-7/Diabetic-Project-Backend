const { Router } = require("express");

const {
  createCouponOfDoctor,
  getCouponOfDoctor,
  acceptCloseCouponOfDoctor,
  deleteCouponOfDoctor,
  editCouponOfDoctor,
  expireCouponOfDoctor,
} = require("../../../controllers/app/Docter/coupon");
const { doctorMiddleware } = require("../../../middleware/auth");

const router = Router();

router.post("/create", doctorMiddleware, createCouponOfDoctor);
router.get("/all", doctorMiddleware, getCouponOfDoctor);
router.get("/coupon-status", doctorMiddleware, acceptCloseCouponOfDoctor);
router.delete("/delete/:id", doctorMiddleware, deleteCouponOfDoctor);
router.put("/edit/:id", doctorMiddleware, editCouponOfDoctor);
router.put("/expire/:id", doctorMiddleware, expireCouponOfDoctor);
module.exports = router;
