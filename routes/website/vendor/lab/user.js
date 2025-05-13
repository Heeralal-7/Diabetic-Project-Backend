const { Router } = require("express");
const {
  getVendors,
  getTest,
} = require("../../../../controllers/website/vandor/Lab/User");

const route = Router();

route.get("/", getVendors);
route.get("/website/:id", getTest);

module.exports = route;
