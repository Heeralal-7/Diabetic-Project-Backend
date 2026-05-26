const {Router} = require('express')
const { qualification, getDoctorStats } = require('../../../controllers/admin/Doctor/qualification')
const locationFilterMiddleware = require('../../../middleware/locationFilter')

const route = Router()

route.post('/create' , qualification)
route.get("/getDoctorStats",locationFilterMiddleware ,getDoctorStats)

module.exports = route