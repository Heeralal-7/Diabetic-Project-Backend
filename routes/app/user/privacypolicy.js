const { Router } = require("express");
const {
  privacypolicy,
  getPrivacyPolicy,
} = require("../../../controllers/app/user/privacypolicy");

const route = Router();

route.post("/create", privacypolicy);
route.get("/", getPrivacyPolicy);

module.exports = route;
