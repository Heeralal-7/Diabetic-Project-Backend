const { Router } = require("express");
const {
  getCoupon,
  searchVendorCoupon,
} = require("../../../../controllers/admin/Vendor/Lab/coupon");
const { adminMiddleware } = require("../../../../middleware/auth");

const route = Router();

route.get("/getcoupon/:id", getCoupon);
route.get("/search-coupon" , adminMiddleware, searchVendorCoupon)

module.exports = route;
