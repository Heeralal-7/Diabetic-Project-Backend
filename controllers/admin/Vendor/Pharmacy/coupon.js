const Vendor = require("../../../../modal/vandor");
const Admin = require("../../../../modal/adminlogin");
const Coupon = require("../../../../modal/Coupon");


const getPharmacyCoupon = async(req,res)=>{
   try {
    const data = await Coupon.find({vendorId:req.user._id})
    if(!data){
        return res.send({
            success:0,
            message:'No data found'
        })
    }

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

module.exports= {getPharmacyCoupon}