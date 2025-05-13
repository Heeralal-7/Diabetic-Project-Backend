const { Router } = require("express");
const multer = require("multer");

const { doctorMiddleware } = require("../../../../middleware/auth");
const {
  getAllDoctor,
  getSingleDoctor,
} = require("../../../../controllers/app/user/Doctor/user");

const route = Router();

route.get("/", doctorMiddleware, getAllDoctor);
route.get("/profile", doctorMiddleware, getSingleDoctor);

module.exports = route;
