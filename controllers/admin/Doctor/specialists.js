const Specialists = require("../../../modal/Specialists")


// Create specialization
// Method:Post
// EndPoint:/create
const specialist = async(req,res)=>{
try {
      const {specialists}= req.body
      if(!specialists){
        return res.send({
            success:0,
            message:'All fields are required'
        })
      }
      const doctor = await Specialists.create({
        specialists
      })
      return res.send({
        success:1,
        message:'Created successfully'
      })
} catch (error) {
    return res.send({
        success:0,
        message:'error.message'
    })
}
}



module.exports = {specialist}