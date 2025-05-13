const Organ = require("../../../../modal/organs")

const create = async(req,res)=>{
    try {
        const {organName} = req.body
        console.log(req.file)
        const data = await Organ.create({
            organName,
            organImage : req.file && req.file.filename ? `/vendor/organ/${req.file.filename}` : null
        })

        return res.send({
            success:1,
            messaga:'Created successfully'
        })
    } catch (error) {
        return res.send({
            success:0,
            message:error.message
        })
    }
}

//Get organ
//Method: Get
//Endpoint : organ/get
const getOrgan = async(req,res)=>{
    try {
        const data = await Organ.find()

        return res.send({
            success:1,
            message:'Fetched successfully',
            details:data
        })
    } catch (error) {
        return res.send({
            success:0,
            message:error.message
        })
    }
}

module.exports = {create, getOrgan}