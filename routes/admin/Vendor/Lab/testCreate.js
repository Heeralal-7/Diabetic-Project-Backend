const {Router} = require('express')
const { adminMiddleware } = require('../../../../middleware/auth')
const { testCreate} = require('../../../../controllers/admin/Vendor/Lab/testCreate')

const route = Router()

route.post('/create' , adminMiddleware, testCreate)



module.exports = route