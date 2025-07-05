const Packages = require('../../../../modal/AddPackages')

//get vendor package
//Method:Get
//Endpoint:/vendor-package/vendor-package/:id
const getVendorPackage = async(req,res)=>{
    try {
        const id = req.params.id
        const data = await Packages.find({vendorId: id})
        if(!data){
            return res.send({
                success:0,
                message:'Packages are available'
            })
        }

        return res.send({
             success:1,
             message:'Fetched',
             details:data
        })
    } catch (error) {
        return res.send({
            success:0,
            message:error.message
        })
    }

}

module.exports = {getVendorPackage}