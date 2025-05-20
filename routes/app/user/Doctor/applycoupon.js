const {Router} = require('express')
const { middlewere } = require('../../../../middleware/auth')
const { applyCoupon, getCoupon } = require('../../../../controllers/app/user/Doctor/applycoupon')

const route = Router()

route.post('/apply' , middlewere ,applyCoupon )
route.get("/getCoupon",middlewere,getCoupon)
module.exports = route