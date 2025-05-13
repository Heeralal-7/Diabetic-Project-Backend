const {Router} = require('express')
const { adminMiddleware } = require('../../../middleware/auth')
const { getallUsers, activeUser, inActiveUser, firstuser, allusersdata } = require('../../../controllers/admin/User/user')

const route = Router()

route.get('/all' , adminMiddleware, getallUsers)
route.get('/active' , adminMiddleware , activeUser)
route.get('/inactive' , adminMiddleware , inActiveUser)
route.get('/firstlogin',adminMiddleware, firstuser)
route.get("/allusersdata",adminMiddleware,allusersdata)
module.exports = route