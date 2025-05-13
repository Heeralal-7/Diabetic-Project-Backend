const {Router} = require('express')
const { VendorMiddleware } = require('../../../../middleware/auth')
const { getAppointments } = require('../../../../controllers/app/vandor/pharmacy/appointments')

const route = Router()

route.get("/get" , VendorMiddleware , getAppointments)

module.exports = route