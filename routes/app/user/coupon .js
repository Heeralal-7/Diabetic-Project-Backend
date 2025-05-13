const { Router } = require("express");
const { middlewere } = require("../../../middleware/auth");
const { getCoupons } = require("../../../controllers/app/user/coupon");

const route = Router();

route.get("/get-coupon", middlewere, getCoupons);

module.exports = route;
