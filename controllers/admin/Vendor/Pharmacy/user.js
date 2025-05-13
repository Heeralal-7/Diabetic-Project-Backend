const Vendor = require("../../../../modal/vandor");
const Admin = require("../../../../modal/adminlogin");


//Get pharmacy vendor
//Method:Get
//Endpoints:/admin-pharmacy-all/vendors
const getAllVendorsLists = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;
    // const getAll = await Vendor.find({});
    const getAll = await Vendor.aggregate([
      {
        $match: { vendor: "Pharmacy" },
      },
      {
        $match:{isActive:true}
           },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);

    const totalLength = await Vendor.countDocuments();
    const pages = Math.ceil(totalLength / limit);
    return res.send({
      success: 1,
      message: "All vendor fetched successfully",
      pages,
      details: getAll,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};



// Get pharmacy stats of monthly
//Methods : Get
//end point : admin-pharmacy-all/getpharmacystats
const getpharmacystats = async(req,res)=>{
  try {
    const currentDate = new Date();
    const months = Array.from({length: 12},(_,i)=>{
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() -i,1);
      return {
        year: date.getFullYear(),
        month: date.getMonth() +1,
      };
    }).reverse();
     
       const pharmacystats = await Vendor.aggregate([
        {
          $match:{vendor :"Pharmacy"},
        },
        {
          $addFields:{
            year:{$year:"$createdAt"},
            month:{$month:"$createdAt"},
          },
        },
        {
          $group:{
            _id:{year :"$year", month:"$month"},
            count:{$sum:1},
            vendors:{$push:"$$ROOT"},
          },
        },
        {
       $sort:{"_id.year":1, "_id.month":1},
        },
       ]);
   
         const stats = months.map(({year,month})=>{
          const stat = pharmacystats.find(
            (item)=> item._id.year === year && item._id.month === month
          );
          return{
            year,
            month,
            count :stat ? stat.count :0,
            vendors : stat ? stat.vendors: [],
          };
         }) ;

       return res.send({
        success:1,
        message:"monthly data",
        details:stats,
       });
           
  } catch (error) {
    return res.send({

      success:0,
      message:error.message
    })
  }
}
// get inactive pharmacy
// Methods : get
// end-point : admin-pharmacy-all/inActivePharmacy
const inActivePharmacy = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; 
    const skip = (page - 1) * limit; 

    
    const getAll = await Vendor.aggregate([
      { $match: { vendor: "Pharmacy", isActive: false } }, // Filter for inactive labs
      { $sort: { createdAt: -1 } }, // Sort by newest first
      { $skip: skip }, // Skip documents for pagination
      { $limit: limit }, // Limit the number of documents per page
    ]);

    // Count total inactive labs for pagination
    const totalLength = await Vendor.countDocuments({
      vendor: "Pharmacy",
      isActive: false,
    }); 

    const pages = Math.ceil(totalLength / limit); // Calculate total pages

    return res.send({
      success: 1,
      message: "All inactive Pharmacy fetched successfully",
      pages,
      details: getAll, // Return the fetched labs
    });
  } catch (error) {
    console.error("Error in inActivlabs:", error.message);
    return res.status(500).send({
      success: 0,
      message: error.message, // Return error message for debugging
    });
  }
};





module.exports = { getAllVendorsLists,getpharmacystats,inActivePharmacy };
