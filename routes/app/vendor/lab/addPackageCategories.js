const {Router} = require('express')
const multer = require('multer')
const { importData } = require('../../../../controllers/app/vandor/lab/addPackageCategories')

const route = Router()

var storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null , './uploads')
    },
    filename:(req,file,cb)=>{
        cb(null,file.originalname)
    }
})

var upload = multer({storage:storage})

route.post('/importUser' ,upload.single('file'),importData)

module.exports = route