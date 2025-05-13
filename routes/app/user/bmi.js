const {Router} = require('express')
const { middlewere } = require('../../../middleware/auth')
const { bmi, getBmi } = require('../../../controllers/app/user/bmi')


const route = Router()

route.post("/calculate" , middlewere  ,bmi)
route.get("/get" , middlewere , getBmi)


module.exports = route