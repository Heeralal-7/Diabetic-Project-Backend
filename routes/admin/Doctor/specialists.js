const {Router} = require('express')

const { specialist } = require('../../../controllers/admin/Doctor/specialists')

const route = Router()

route.post('/create' , specialist)

module.exports = route