const {Router} = require('express')
const { middlewere } = require('../../../../middleware/auth')
const { getprescribedTest, popularPackage, search, selectedtastlab } = require('../../../../controllers/app/user/labs/onSearch')


const route   = Router()

route.get('/presTest' , middlewere , getprescribedTest)
route.get('/package' , middlewere , popularPackage)
route.get('/search' , middlewere , search)
route.get('/selected' , middlewere , selectedtastlab)

module.exports = route