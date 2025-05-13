const {Router} = require('express')
const { qualification, getDoctorStats } = require('../../../controllers/admin/Doctor/qualification')

const route = Router()

route.post('/create' , qualification)
route.get("/getDoctorStats",getDoctorStats)

module.exports = route