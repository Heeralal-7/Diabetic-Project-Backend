const { Router } = require("express");
const { getDoctor, getdoctorProfile } = require("../../../controllers/website/Doctor/doctor");


const route = Router();

route.get('/get' , getDoctor)
route.get('/website/:id', getdoctorProfile)

module.exports = route;