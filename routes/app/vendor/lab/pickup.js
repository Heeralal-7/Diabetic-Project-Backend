const { Router } = require("express");
const { VendorMiddleware } = require("../../../../middleware/auth");
const {
  pickup,
  getPickup,
  updatePick,
  deletePick,
} = require("../../../../controllers/app/vandor/lab/pickup");

const route = Router();

route.post("/create", VendorMiddleware, pickup);
route.get("/", VendorMiddleware, getPickup);
route.patch("/update/:id", VendorMiddleware, updatePick);
route.delete("/delete/:id", VendorMiddleware, deletePick);

module.exports = route;
