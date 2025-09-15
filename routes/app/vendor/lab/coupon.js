const { Router } = require("express");

const { VendorMiddleware } = require("../../../../middleware/auth");
const {
  createCoupon,
  getCouponOfVendor,
  acceptCloseCoupon,
  deleteCoupon
} = require("../../../../controllers/app/vandor/lab/coupon");

const router = Router();

router.post("/create", VendorMiddleware, createCoupon);
router.get("/", VendorMiddleware, getCouponOfVendor);
router.get("/coupon-status", VendorMiddleware, acceptCloseCoupon)
router.delete("/delete/:id", VendorMiddleware, deleteCoupon);

module.exports = router;
