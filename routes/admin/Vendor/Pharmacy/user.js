const {Router} = require('express')
const {adminMiddleware} = require("../../../../middleware/auth")
const { getAllVendorsLists, getpharmacystats, inActivePharmacy } = require('../../../../controllers/admin/Vendor/Pharmacy/user')


const route = Router()

route.get("/vendors", adminMiddleware , getAllVendorsLists)
route.get("/getpharmacystats",adminMiddleware,getpharmacystats)
route.get("/inActivePharmacy",adminMiddleware,inActivePharmacy)
module.exports = route