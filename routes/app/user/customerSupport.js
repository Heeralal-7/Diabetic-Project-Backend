const { Router } = require("express");
const { middlewere } = require("../../../middleware/auth");
const { getPhone } = require("../../../controllers/app/user/customerSupport");

const route = Router();

route.get("/phone", middlewere, getPhone);

module.exports = route;
