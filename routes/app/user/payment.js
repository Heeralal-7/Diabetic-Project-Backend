const {Router} = require("express");
const { payment, getPayment, getTotalEarnings } = require("../../../controllers/app/user/payment");

const {middlewere} = require("../../../middleware/auth")

const route = Router();

route.post("/payment",middlewere,payment)
route.get("/getPayment",getPayment)
route.get("/getTotalEarnings",getTotalEarnings)
module.exports = route