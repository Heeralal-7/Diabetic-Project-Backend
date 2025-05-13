const {Router} = require('express')
const { middlewere } = require('../../../../middleware/auth')
const { applyCoupon } = require('../../../../controllers/app/user/Doctor/applycoupon')

const route = Router()

route.post('/apply' , middlewere ,applyCoupon )

module.exports = route