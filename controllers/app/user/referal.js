const TempOtp = require("../../../modal/TempOtp")

const getReferal = async(req,res)=>{
    try {
        const {id} = req.params

        const data  = await 
    } catch (error) {
        return res.send({
            success:0,
            message:error.message
        })
    }
}