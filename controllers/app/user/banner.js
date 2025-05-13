const Banner = require('../../../modal/adminBanner')


//get all banner
//Method:get
//Endpoint: /tbanner/bann
//type 0 for banner 1 and type 1 for banner 2 (in lab section)
//type 2 for main banner in user (home page)
//type 3,4,5,6 is for pharmacy banner 1,2,3,4
//type 7 for presecription page banner

const getbanner = async(req,res)=>{
    try {
        const {type} = req.body
        
        const data = await Banner.find({type})
        
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




module.exports = {getbanner}