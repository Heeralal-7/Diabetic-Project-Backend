const { Router } = require("express");
const { driverMiddleware } = require("../../../middleware/auth");
const { getHistory } = require("../../../controllers/app/driver/History");

const route = Router();

route.get("/get/:id", driverMiddleware, getHistory);

module.exports = route;
