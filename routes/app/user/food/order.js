const {Router} = require('express')
const { middlewere } = require('../../../../middleware/auth')
const { bookOrder, available, getOrder, getOrderById, getdiscountorder,deleteCartItem, getordertype, getAcceptedOrders, orderHistorydriver } = require('../../../../controllers/app/user/food/order')

//VendorMiddleware
const { VendorMiddleware } = require('../../../../middleware/auth')

const route = Router()


route.post('/order' ,middlewere, bookOrder )
route.post('/avail' , middlewere , available)
route.get('/getOrder' , middlewere , getOrder)
route.get('/getOrder/:orderId', middlewere, getOrderById)
route.get("/getdiscountorder",middlewere,getdiscountorder)
route.post("/deleteCartItem", middlewere,deleteCartItem)
route.get("/getordertype",VendorMiddleware,getordertype)
route.get("/orderHistorydriver",middlewere,orderHistorydriver)
module.exports = route