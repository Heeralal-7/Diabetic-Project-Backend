const {Router} = require('express')
const { middlewere } = require('../../../middleware/auth')
const { alertDoctor, updateAlertDoctor, getDoctor, deleteAlertDoctor } = require('../../../controllers/app/user/alertDoctor')
const { getDoctorBankAccount } = require('../../../controllers/app/Docter/AddAccount')


const route = Router()

route.post("/create" ,middlewere , alertDoctor )
route.patch("/update/:id" , middlewere , updateAlertDoctor)
route.get("/get" , middlewere , getDoctor)
route.delete("/delete/:id" , middlewere , deleteAlertDoctor)
module.exports = route