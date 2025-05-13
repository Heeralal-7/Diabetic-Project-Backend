const { Router } = require("express");
const {
  privacy,
  getPrivacy,
} = require("../../../controllers/app/Docter/privacypolicy");

const route = Router();

route.post("/create", privacy);
route.get("/", getPrivacy);

module.exports = route;
