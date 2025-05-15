const {Router} = require('express')
const { VendorMiddleware } = require('../../../../middleware/auth')
const { getFoodOrder, changeOrderStatus, getOrder, orderHistory,getAcceptedOrders, assignDriverToOrder, getOrderWithDriver,getOnlineDrivers } = require('../../../../controllers/app/vandor/food/order')

const route = Router()

route.get('/order' , VendorMiddleware , getFoodOrder)
route.patch('/status/:id' , VendorMiddleware , changeOrderStatus)
route.get('/get-order' , VendorMiddleware , getOrder)
route.get('/orderHistory',VendorMiddleware,orderHistory)
route.get("/accepted-orders",VendorMiddleware ,getAcceptedOrders)

route.post('/assign-driver',VendorMiddleware,assignDriverToOrder)
route.get('/order-with-driver/:orderId', VendorMiddleware, getOrderWithDriver)
route.get('/online-drivers', VendorMiddleware, getOnlineDrivers)


module.exports = route