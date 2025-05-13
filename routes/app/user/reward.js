const { Router } = require("express");
const { middlewere } = require("../../../middleware/auth");
const { rewards } = require("../../../controllers/app/user/rewards");

const route = Router();

route.get("/create-reward", middlewere, rewards);

module.exports = route;
