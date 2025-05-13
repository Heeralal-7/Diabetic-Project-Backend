const {Router} = require('express')
const { middlewere } = require('../../../middleware/auth')
const { userbp, getBp, deleteBp } = require('../../../controllers/app/user/userbp')

const route = Router()

route.post('/create-bp' , middlewere, userbp) 
route.get('/get-bp' , middlewere , getBp)
route.delete('/delete-bp/:id' , middlewere , deleteBp)

module.exports = route