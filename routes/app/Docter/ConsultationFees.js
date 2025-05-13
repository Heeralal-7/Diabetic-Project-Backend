const { Router } = require("express");
const {
  createFees,
  getFees,
  updateFees,
  deleteFees,
} = require("../../../controllers/app/Docter/ConsultationFees");
const { doctorMiddleware } = require("../../../middleware/auth");

const route = Router();

route.post("/create", doctorMiddleware, createFees);
route.get("/get", doctorMiddleware, getFees);
route.patch("/update/:id", doctorMiddleware, updateFees);
route.delete("/delete/:id", doctorMiddleware, deleteFees);
module.exports = route;
