const Specialists = require("../../../modal/Specialists");
 
// Create specialization
// Method:Post
// EndPoint: /specialists/create
const specialist = async(req,res)=>{
try {
      
      const { specialists } = req.body;
      const specialistImage = req.file ? req.file.filename : "";
 
      if(!specialists){
      
        return res.status(400).send({
            success:0,
            message:'Specialist name is required'
        })
      }
      
      const doctor = await Specialists.create({
        specialists,
        specialistImage
      })
 
      return res.status(201).send({
        success:1,
        message:'Created successfully',
        data: doctor
      })
 
} catch (error) {
    return res.status(500).send({
        success:0,
        message: error.message || 'Internal server error'
    })
}
}
 
module.exports = {specialist}
 