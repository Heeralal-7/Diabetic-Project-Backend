const {Router} = require("express")
const { getQualification } = require("../../../controllers/app/Docter/qualification")

const route= Router()
 
route.get('/' , getQualification)

module.exports = route