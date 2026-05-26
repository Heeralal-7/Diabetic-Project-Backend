const Vendor = require("../../../../modal/vandor");
const Admin = require("../../../../modal/adminlogin");
const SubAdmin = require("../../../../modal/subAdmin");

//Get pharmacy vendor - UPDATED WITH SUB-ADMIN SUPPORT
//Method:Get
//Endpoints:/admin-pharmacy-all/vendors
const getAllVendorsLists = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const locationFilters = req.locationFilters || {};

    const skip = (page - 1) * limit;

    console.log("💊 Fetching pharmacy vendors with filters:", locationFilters);

    const getAll = await Vendor.aggregate([
      {
        $match: { 
          vendor: "Pharmacy",
          isActive: true,
          ...locationFilters
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const totalLength = await Vendor.countDocuments({
      vendor: "Pharmacy",
      isActive: true,
      ...locationFilters
    });
    
    const pages = Math.ceil(totalLength / limit);
    
    console.log(`✅ Found ${getAll.length} pharmacy vendors`);

    return res.send({
      success: 1,
      message: "Pharmacy vendors fetched successfully",
      pages,
      details: getAll,
      appliedFilters: locationFilters
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Get pharmacy stats of monthly - UPDATED WITH SUB-ADMIN SUPPORT
//Methods : Get
//end point : admin-pharmacy-all/getpharmacystats
const getpharmacystats = async(req,res)=>{
  try {
    const currentDate = new Date();
    
    // ✅ BUILD LOCATION QUERY FOR SUB-ADMIN
    let locationQuery = {};
    if (req.subAdmin && req.subAdmin.locationAccess) {
      const { locationAccess } = req.subAdmin;
      if (locationAccess.countries && locationAccess.countries.length > 0) {
        locationQuery.country = { $in: locationAccess.countries };
      }
      if (locationAccess.states && locationAccess.states.length > 0) {
        locationQuery.state = { $in: locationAccess.states };
      }
      if (locationAccess.cities && locationAccess.cities.length > 0) {
        locationQuery.city = { $in: locationAccess.cities };
      }
    }

    // ✅ OVERRIDE WITH GLOBAL FILTERS FROM QUERY PARAMETERS
    const { country, state, city } = req.query;
    if (country && country.trim() !== '') {
      locationQuery.country = country.trim();
    }
    if (state && state.trim() !== '') {
      locationQuery.state = state.trim();
    }
    if (city && city.trim() !== '') {
      locationQuery.city = city.trim();
    }

    console.log("💊 Fetching pharmacy stats with filters:", locationQuery);

    const months = Array.from({length: 12},(_,i)=>{
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() -i,1);
      return {
        year: date.getFullYear(),
        month: date.getMonth() +1,
      };
    }).reverse();
     
    const pharmacystats = await Vendor.aggregate([
      {
        $match: {
          vendor: "Pharmacy",
          ...locationQuery // ✅ Apply location filters
        },
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

    // ✅ Calculate total pharmacies with filters
    const totalPharmacies = await Vendor.countDocuments({
      vendor: "Pharmacy",
      ...locationQuery
    });
   
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
    });

    console.log(`✅ Pharmacy stats fetched: ${totalPharmacies} total pharmacies with filters`);

    return res.send({
      success:1,
      message: locationQuery.country ? 
        `Monthly pharmacy registration stats for ${locationQuery.country}${locationQuery.state ? `, ${locationQuery.state}` : ''}${locationQuery.city ? `, ${locationQuery.city}` : ''}` :
        "Monthly pharmacy registration stats",
      details:stats,
      totalPharmacies: totalPharmacies,
      appliedFilters: locationQuery
    });
           
  } catch (error) {
    console.error("❌ Error in getpharmacystats:", error);
    return res.send({
      success:0,
      message:error.message
    })
  }
}

// get inactive pharmacy - UPDATED WITH SUB-ADMIN SUPPORT
// Methods : get
// end-point : admin-pharmacy-all/inActivePharmacy
const inActivePharmacy = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { country, state, city } = req.query;
    const skip = (page - 1) * limit;

    // ✅ BUILD LOCATION QUERY
    let locationQuery = {};
    if (req.subAdmin && req.subAdmin.locationAccess) {
      const { locationAccess } = req.subAdmin;
      if (locationAccess.countries && locationAccess.countries.length > 0) {
        locationQuery.country = { $in: locationAccess.countries };
      }
      if (locationAccess.states && locationAccess.states.length > 0) {
        locationQuery.state = { $in: locationAccess.states };
      }
      if (locationAccess.cities && locationAccess.cities.length > 0) {
        locationQuery.city = { $in: locationAccess.cities };
      }
    }
    
    // ✅ OVERRIDE WITH QUERY PARAMETERS
    if (country) locationQuery.country = country;
    if (state) locationQuery.state = state;
    if (city) locationQuery.city = city;
    
    const getAll = await Vendor.aggregate([
      { 
        $match: { 
          vendor: "Pharmacy", 
          isActive: false,
          ...locationQuery
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const totalLength = await Vendor.countDocuments({
      vendor: "Pharmacy",
      isActive: false,
      ...locationQuery
    });

    const pages = Math.ceil(totalLength / limit);

    return res.send({
      success: 1,
      message: "All inactive Pharmacy fetched successfully",
      pages,
      details: getAll,
    });
  } catch (error) {
    console.error("Error in inActivePharmacy:", error.message);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = { 
  getAllVendorsLists,
  getpharmacystats,
  inActivePharmacy 
};