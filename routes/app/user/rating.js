const { Router } = require("express");
const multer = require("multer");
const { middlewere } = require("../../../middleware/auth");
const { createRating, gettoprated } = require("../../../controllers/app/user/rating");

const route = Router();

route.post("/", middlewere, createRating);
route.get("/gettoprated",middlewere,gettoprated)
// route.patch('/updatestatus', VendorMiddleware,updateAppointmentStatus)

module.exports = route;
