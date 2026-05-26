const {Router} = require('express')
const { middlewere } = require('../../../../middleware/auth')
const { current, history } = require('../../../../controllers/app/user/labs/myLabtest')

const route = Router()

route.get("/data" , current)
route.get("/history" , history)

module.exports = route