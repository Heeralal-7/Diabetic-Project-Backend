const {Router} = require('express')
const { middlewere } = require('../../../middleware/auth')
const { getbanner } = require('../../../controllers/app/user/banner')



const route = Router()

route.get('/bann' , middlewere , getbanner)



module.exports = route