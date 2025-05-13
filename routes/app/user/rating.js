const { Router } = require("express");
const multer = require("multer");
const { middlewere } = require("../../../middleware/auth");
const { createRating } = require("../../../controllers/app/user/rating");

const route = Router();

route.post("/", middlewere, createRating);

// route.patch('/updatestatus', VendorMiddleware,updateAppointmentStatus)

module.exports = route;
