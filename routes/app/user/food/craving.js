const {Router} = require('express')
const { middlewere } = require('../../../../middleware/auth')
const { getParticularFood, filter, addToCart, getCartItem, checkData, removeCart, getCartData, addExtraItems, getMeal,updateQuantity } = require('../../../../controllers/app/user/food/craving')


const route = Router()

route.get('/foodName',  getParticularFood)
route.get('/sort', filter )
route.post('/cartfood/:id',middlewere,addToCart)
route.get('/foodItem' ,  getCartItem)
route.get('/check' ,  checkData)
route.patch('/remove' ,  removeCart)
route.get('/getcart',  getCartData)
route.post('/addExtraItems/:foodItemId' ,addExtraItems);
route.get("/getMeal",getMeal);
route.put("/updateQuantity",  updateQuantity);//for only website

module.exports = route