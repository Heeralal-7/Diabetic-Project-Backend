const { Router } = require("express");
const {
  privacy,
  getPrivacy,
} = require("../../../controllers/app/Docter/privacypolicy");
const { doctorMiddleware } = require("../../../middleware/auth");
const route = Router();

route.post("/create", doctorMiddleware, privacy);
route.get("/", doctorMiddleware, getPrivacy);

module.exports = route;
