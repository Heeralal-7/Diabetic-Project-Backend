const {Router} = require('express')
const { middlewere } = require('../../../../middleware/auth')
const { listKitchen, categoryKitchen, particularfood, searchfood, foodMenu } = require('../../../../controllers/app/user/food/topkitchen')



const route = Router()

route.get('/kitchen' , middlewere , listKitchen)
route.get('/catekitchen' , middlewere , categoryKitchen)
route.get('/particular/:id' , middlewere , particularfood)
route.get('/search' , middlewere , searchfood)
route.get('/menu/:id' , middlewere , foodMenu)

module.exports = route