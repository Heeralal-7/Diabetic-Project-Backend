const Users = require("../../../modal/user");

//Admin get all users
//Method:Get
//Endpoints:/admin-user/all
const getallUsers = async (req, res) => {
  try {
    // const page = parseInt(req.query.page) || 1;
    // const limit = parseInt(req.query.limit) || 10;

    // const skip = (page - 1) * limit;
    // const getAll = await Vendor.find({});
    const getAll = await Users.find({})


    return res.send({
      success: 1,
      message: "All vendor fetched successfully",
   
      details: getAll,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//fetch active user
//Method:Get
//Endpoints:/admin-user/active
const activeUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;
    const getAll = await Users.aggregate([
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

    const totalLength = await Users.countDocuments();
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

//fetch inactive user
//Method:Get
//Endpoints:/admin-user/inactive
const inActiveUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;
    const getAll = await Users.aggregate([
      {
        $match:{isActive:false}
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

    const totalLength = await Users.countDocuments();
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

// first 5 user login
//methods: get
//endpoint:/admin-user/firstlogin

const firstuser = async (req, res) => {
  try {
    // Fetch the last 5 users who recently created an account, selecting only the required fields
    const users = await Users.find({}, { name: 1, email: 1, number: 1, createdAt: 1 })
      .sort({ createdAt: -1 }) // Sort by creation date (newest first)
      .limit(5)
      .lean();

    // Format the response to include only the necessary fields
    const updatedUsers = users.map(user => ({
      name: user.name,
      email: user.email,
      number: user.number,
      registeredDate: user.createdAt || null, // Default to null if missing
    }));

    // Send the cleaned-up data in the response
    return res.send({
      success: 1,
      message: "Last 5 users who registered",
      details: updatedUsers,
    });
  } catch (error) {
    // Handle errors
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};


// Last 12 months user registration stats
//methods: get
//endpoint :/admin-user/allusersdata
const allusersdata = async (req, res) => {
  try {
    const currentDate = new Date();

    // Generate an array for the last 12 months (even across year boundaries)
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1, // Months are 1-based (1 for Jan, 2 for Feb, etc.)
      };
    }).reverse(); // Reverse to show Jan-Dec order

    // Aggregate user data by month and year
    const userStats = await Users.aggregate([
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
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }, // Sort by year and month
      },
    ]);

    // Map months array and populate stats
    const stats = months.map(({ year, month }) => {
      const stat = userStats.find(
        (d) => d._id.year === year && d._id.month === month
      );
      return {
        year,
        month,
        count: stat ? stat.count : 0, // Use 0 if no data is found for the month
      };
    });

    return res.send({
      success: 1,
      message: "Last 12 months user registration stats",
      details: stats,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};





module.exports = { getallUsers, activeUser, inActiveUser,firstuser,allusersdata };
