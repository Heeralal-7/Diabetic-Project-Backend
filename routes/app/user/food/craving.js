const {Router} = require('express')
const { middlewere } = require('../../../../middleware/auth')
const { getParticularFood, filter, addToCart, getCartItem, checkData, removeCart, getCartData, addExtraItems, getMeal,updateQuantity } = require('../../../../controllers/app/user/food/craving')


const route = Router()

route.get('/foodName', middlewere , getParticularFood)
route.get('/sort', middlewere ,filter )
route.post('/cartfood/:id',middlewere,addToCart)
route.get('/foodItem' , middlewere , getCartItem)
route.get('/check' , middlewere , checkData)
route.patch('/remove' , middlewere , removeCart)
route.get('/getcart', middlewere, getCartData)
route.post('/addExtraItems/:foodItemId' ,middlewere,addExtraItems);
route.get("/getMeal",middlewere,getMeal);
route.put("/updateQuantity", middlewere, updateQuantity);//for only website

module.exports = route