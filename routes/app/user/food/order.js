const {Router} = require('express')
const { middlewere } = require('../../../../middleware/auth')
const { bookOrder, available, getOrder, getOrderById, getdiscountorder,deleteCartItem, getordertype, getAcceptedOrders, orderHistorydriver } = require('../../../../controllers/app/user/food/order')

//VendorMiddleware
const { VendorMiddleware } = require('../../../../middleware/auth')

const route = Router()


route.post('/order' , bookOrder )
route.post('/avail' ,  available)
route.get('/getOrder' ,  getOrder)
route.get('/getOrder/:orderId',  getOrderById)
route.get("/getdiscountorder",getdiscountorder)
route.post("/deleteCartItem", deleteCartItem)
route.get("/getordertype",VendorMiddleware,getordertype)
route.get("/orderHistorydriver",orderHistorydriver)
module.exports = route