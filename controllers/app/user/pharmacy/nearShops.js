const Vendor = require("../../../../modal/vandor");
const Service = require("../../../../modal/addServices");

//Get all pharmacy
//Method:Get
//Endpoints:/shops/get
const shopsNear = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);

    const skip = (pageNumber - 1) * pageSize;

    const user = await Vendor.find({ vendor: "Pharmacy" })
      .skip(skip)
      .limit(pageSize);

    if (!user) {
      return res.send({
        success: 0,
        message: "No pharmacy found",
      });
    }

    const pharmacyDetails = await Promise.all(
      user.map(async (vendor) => {
        const tests = await Service.find({ vendorId: vendor._id });

        return {
          ...vendor._doc,
          tests,
        };
      })
    );

    return res.send({
      success: 1,
      message: "Fetched successfully",
      details: pharmacyDetails,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};


const particularProducts = async(req,res)=>{
   try {
      
   } catch (error) {
      return res.send({
         success:0,
         message:error.message
      })
   }
}

module.exports = { shopsNear, particularProducts };
