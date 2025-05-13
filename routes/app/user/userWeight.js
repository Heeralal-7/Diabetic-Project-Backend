const {Router} = require('express')
const { middlewere } = require('../../../middleware/auth')
const { createWeight } = require('../../../controllers/app/user/userWeight')

const route = Router()

route.post('/create-weight' , middlewere ,createWeight )

module.exports = route