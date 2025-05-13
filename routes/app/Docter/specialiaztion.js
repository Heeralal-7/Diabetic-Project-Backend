const {Router} = require("express")

const { getSpecialiaztion } = require("../../../controllers/app/Docter/specialiaztion")

const route= Router()
 
route.get('/' , getSpecialiaztion)

module.exports = route