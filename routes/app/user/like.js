const { Router } = require("express");
const { middlewere } = require("../../../middleware/auth");
const { likeordislike } = require("../../../controllers/app/user/like");

const route = Router();

route.put("/likepost/:id", middlewere, likeordislike);

module.exports = route;
