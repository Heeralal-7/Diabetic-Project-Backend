const {Router} = require('express')
const { middlewere } = require('../../../../middleware/auth')
const { listKitchen, categoryKitchen, particularfood, searchfood, foodMenu } = require('../../../../controllers/app/user/food/topkitchen')



const route = Router()

route.post('/kitchen' , listKitchen)
route.get('/catekitchen' , categoryKitchen)
route.get('/particular/:id' , particularfood)
route.get('/search' , searchfood)
route.get('/menu/:id' , foodMenu)

module.exports = route