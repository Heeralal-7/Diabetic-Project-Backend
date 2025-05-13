const Specialists = require("../../../modal/Specialists")



// Get specialiaztion
// Method:GET
// EndPoint:/
const getSpecialiaztion = async(req,res)=>{
try {
       const data = await Specialists.find({})
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

module.exports = {getSpecialiaztion}