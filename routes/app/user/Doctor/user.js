const { Router } = require("express");
const multer = require("multer");

const { doctorMiddleware } = require("../../../../middleware/auth");
const { middlewere } = require("../../../../middleware/auth");

const {
  getAllDoctor,
  getSingleDoctor,
  getDoctor,
} = require("../../../../controllers/app/user/Doctor/user");

const route = Router();

route.get("/", middlewere, getAllDoctor);
route.get("/profile", doctorMiddleware, getSingleDoctor);
route.get("/getDoctor",middlewere,getDoctor)
module.exports = route;
