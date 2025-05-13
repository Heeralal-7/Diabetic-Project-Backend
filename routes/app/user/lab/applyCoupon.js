const { Router } = require("express");
const { middlewere } = require("../../../../middleware/auth");
const {
  applyCouponUser,
} = require("../../../../controllers/app/user/labs/applyCoupon");

const route = Router();

route.post("/coupon", middlewere, applyCouponUser);

module.exports = route;
