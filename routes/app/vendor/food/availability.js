const {Router} = require('express')
const { VendorMiddleware } = require('../../../../middleware/auth')
const { createAvailability, getStartAndEndDate, getAvailabiltyOfVendorAndTime, removethestartandenddate } = require('../../../../controllers/app/vandor/food/availability')

const route = Router()

route.post('/available' , VendorMiddleware , createAvailability)
route.get('/startdate' , VendorMiddleware , getStartAndEndDate)
route.post('/timeavailability' , VendorMiddleware , getAvailabiltyOfVendorAndTime)
route.delete("/remove/:id",VendorMiddleware,removethestartandenddate)

module.exports = route