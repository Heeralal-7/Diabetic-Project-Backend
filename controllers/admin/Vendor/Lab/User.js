const Vendor = require("../../../../modal/vandor");
const Admin = require("../../../../modal/adminlogin");
const Addtest = require("../../../../modal/addTest");
const Users = require("../../../../modal/user")

// Get all vendor lists
// Method:Get
// EndPoint:/admin-vendor-all
const getAllVendorsLists = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;
    // const getAll = await Vendor.find({});
    const getAll = await Vendor.aggregate([
      {
        $match: { vendor: "Lab" },
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

// Search Vendor
// Method:Get
// EndPoint:/admin-vendor-all/search
const searchVendor = async (req, res) => {
  try {
    const { q, page = 1, limit } = req.query;
    let query = {};
    if (q) {
      const regex = new RegExp(q, "i");
      query = {
        $or: [
          { name: { $regex: regex } },
          { email: { $regex: regex } },
          { country: { $regex: regex } },
          { state: { $regex: regex } },
          { country: { $regex: regex } },
          { city: { $regex: regex } },
        ],
      };
    }
    const options = {
      sort: { createdAt: -1 },
      skip: (page - 1) * limit,
      limit: parseInt(limit),
    };
    const search = await Vendor.find(query, null, options);

    if (!search) {
      return res.send({
        success: 0,
        message: "No result found",
      });
    }
    return res.send({
      success: 1,
      message: "Results fetched successfully",
      details: search,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Get particular vendor
// Method:Get
// EndPoint:/admin-vendor-all/get-vendor/:id
const getVendor = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findById(req.user._id);
    if (!admin) {
      return res.send({
        success: 0,
        message: "Admin is not authenticated",
      });
    }
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.send({
        success: 0,
        message: "Failed to fetch vendor",
      });
    }

    return res.send({
      success: 1,
      message: "Fetched successfully",
      details: vendor,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Search Vendor test
// Method:Get
// EndPoint:/admin-vendor-all/search-test
const searchVendorTest = async (req, res) => {
  try {
    const { q } = req.query;
    let query = {};
    if (q) {
      const regex = new RegExp(q, "i");
      query = {
        $or: [
          { testCategory: { $regex: regex } },
          { testName: { $regex: regex } },
          { testType: { $regex: regex } },
          { sampleRequired: { $regex: regex } },
          { description: { $regex: regex } },
          { amount: { $regex: regex } },
        ],
      };
    }
    const search = await Addtest.find(query);

    if (!search) {
      return res.send({
        success: 0,
        message: "No result found",
      });
    }
    return res.send({
      success: 1,
      message: "Results fetched successfully",
      details: search,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// search vendor test
// Method:Put
//endpoint: admin-vendor-all/active/:id

const status = async (req, res) => {
  try {
    const { id } = req.params;

    let user = await Vendor.findById(id) || await Users.findById(id);
    if (!user) {
      return res.send({
        success: 0,
        message: "No user found",
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    return res.send({
      success: 1,
      message: `${user.isActive ? "Enabled" : "Disabled"} successfully`,
      details: { id: user._id, isActive: user.isActive },
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};


//search Vendor-lab for  12 month  
//Method: get
// endpoint: admin-vendor-all/getlabstats
const getlabstats = async (req, res) => {
  try {
    const currentDate = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      };
    }).reverse();

    // Aggregate lab statistics
    const labstats = await Vendor.aggregate([
      {
        $match: { vendor: "Lab" }, // Use "vendor" to match the field in your database
      },
      {
        $addFields: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: { year: "$year", month: "$month" },
          count: { $sum: 1 },
          vendors: { $push: "$$ROOT" }, // Include all vendor details
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);
    

    // Map lab stats to the last 12 months, filling in missing months with 0 counts
    const stats = months.map(({ year, month }) => {
      const stat = labstats.find(
        (item) => item._id.year === year && item._id.month === month
      );
      return {
        year,
        month,
        count: stat ? stat.count : 0, // Default to 0 if no data exists for the month
        vendors: stat ? stat.vendors : [], // Default to empty array if no vendors
      };
    });

    return res.send({
      success: 1,
      data: stats,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};



// get all inactive vendors labs 
// methods : get
// endpoint : admin-vendor-all/inActivlabs

const inActivlabs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default limit to 10
    const skip = (page - 1) * limit; // Calculate the number of documents to skip

    // Use aggregation pipeline to filter and paginate
    const getAll = await Vendor.aggregate([
      { $match: { vendor: "Lab", isActive: false } }, // Filter for inactive labs
      { $sort: { createdAt: -1 } }, // Sort by newest first
      { $skip: skip }, // Skip documents for pagination
      { $limit: limit }, // Limit the number of documents per page
    ]);

    // Count total inactive labs for pagination
    const totalLength = await Vendor.countDocuments({
      vendor: "Lab",
      isActive: false,
    });

    const pages = Math.ceil(totalLength / limit); // Calculate total pages

    return res.send({
      success: 1,
      message: "All inactive labs fetched successfully",
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





module.exports = {
  getAllVendorsLists,
  searchVendor,
  getVendor,
  searchVendorTest,
  status,
  getlabstats,
  inActivlabs
};
