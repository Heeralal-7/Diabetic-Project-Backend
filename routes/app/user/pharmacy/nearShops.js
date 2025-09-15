const { Router } = require("express");
const { middlewere } = require("../../../../middleware/auth");
const { shopsNear, getAvailableProducts,getVendorsByProduct,addToCart,checkCartVendorConflict,getCartByUser,removeCartItem,checkout,confirmOrder,updateCartQuantity,getAvailableMedicines,getVendorsByMedicine,getVendoravailability,getOrderHistory,getVendorProducts,getVendorMedicines,trackOrder, getPopularProducts, getPopularMedicines, clearCart } = require("../../../../controllers/app/user/pharmacy/nearShops");
 
const route = Router()
 
route.get("/get" , middlewere, shopsNear)
 
route.get('/getProducts', middlewere, getAvailableProducts)
route.get("/getVendorDetails", middlewere, getVendorsByProduct)
 
route.get('/medicine/getMedicines', middlewere, getAvailableMedicines)
route.get("/medicine/getVendorDetails", middlewere, getVendorsByMedicine)
 
 
route.post("/checkCartVendor", middlewere, checkCartVendorConflict)
route.post("/addToCart", middlewere, addToCart)
route.get("/getCart", middlewere, getCartByUser)
route.patch("/updateCartQuantity", middlewere, updateCartQuantity)
route.delete("/removeCart", middlewere, removeCartItem)
 
route.post("/checkout", middlewere, checkout)
 
route.post("/confirmOrder", middlewere, confirmOrder)
route.post("/getCart", middlewere, getCartByUser)
route.get("/getVendorAvailability", middlewere, getVendoravailability)
route.get("/order-history", middlewere, getOrderHistory)
route.get("/track-order", middlewere, trackOrder)
 
 
route.get("/vendor/products", middlewere, getVendorProducts)
route.get("/vendor/medicines", middlewere, getVendorMedicines)
 
 route.get("/popularProducts", middlewere, getPopularProducts)
 route.get("/medicine/popularMedicines", middlewere, getPopularMedicines)
route.delete("/clearCart", middlewere, clearCart);
 
 
 
 
module.exports = route
 
 