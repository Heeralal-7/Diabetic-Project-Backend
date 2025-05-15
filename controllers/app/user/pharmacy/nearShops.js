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


// Get all verified vendors
// Method: GET
// Endpoint: /shops/get
const getShops = async (req, res) => {
  try {
    // Fetch all verified vendors
    const vendors = await Vendor.find({ verify: true })
      .select('-password') // Exclude password field
      .populate('myDocumentId'); // Populate the document details if needed

    return res.json({
      success: 1,
      message: "Vendors fetched successfully",
      data: vendors
    });
  } catch (error) {
    return res.json({
      success: 0,
      message: error.message,
    });
  }
};

// You can also add filters if needed, for example:
const getShopsByLocation = async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.query;
    
    if (!latitude || !longitude) {
      return res.json({
        success: 0,
        message: "Location coordinates are required",
      });
    }

    const vendors = await Vendor.find({
      verify: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: radius ? parseInt(radius) : 10000 // Default 10km radius
        }
      }
    })
    .select('-password')
    .populate('myDocumentId');

    return res.json({
      success: 1,
      message: "Vendors fetched successfully",
      data: vendors
    });
  } catch (error) {
    return res.json({
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
