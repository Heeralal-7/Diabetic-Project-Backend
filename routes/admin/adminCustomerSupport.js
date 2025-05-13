const { Router } = require("express");
const { adminMiddleware } = require("../../middleware/auth");
const { adminPhone } = require("../../controllers/admin/customerSupport");

const route = Router();

route.post("/created", adminMiddleware, adminPhone);

module.exports = route;
