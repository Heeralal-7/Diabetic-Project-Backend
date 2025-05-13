const {Router} = require('express')
const {testCategory } = require('../../../../controllers/app/vandor/lab/testCreate')

const route = Router()

route.get('/:category' , testCategory)

module.exports = route