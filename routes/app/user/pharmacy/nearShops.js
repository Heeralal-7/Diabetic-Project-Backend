const { Router } = require("express");
const { middlewere } = require("../../../../middleware/auth");
const { shopsNear } = require("../../../../controllers/app/user/pharmacy/nearShops");

const route = Router()

route.get("/get" , middlewere, shopsNear)

module.exports = route
