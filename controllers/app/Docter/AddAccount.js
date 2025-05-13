const AddBank = require("../../../modal/AddBanks");
const Banks = require("../../../modal/Banks");

// Create Bank Account
// Method:Post
// EndPoints:/add-bank
const createAccount = async (req, res) => {
  try {
    const { bankName, accountHolderName, accountNumber, ifsc } = req.body;
    if (!bankName || !accountHolderName || !accountNumber || !ifsc) {
      return res.send({
        success: 0,
        message: "Please enter all the required fields ",
      });
    }
    const createAccount = await AddBank.create({
      bankName,
      accountHolderName,
      accountNumber,
      ifsc,
      doctorId: req.user._id,
    });
    return res.send({
      success: 1,
      message: "Bank account created successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Get Doctor Bank Account
// Method:Get
// EndPoints:/
const getDoctorBankAccount = async (req, res) => {
  try {
    const isExist = await AddBank.findOne({ doctorId: req.user._id });
    if (!isExist) {
      return res.send({
        success: 0,
        message: "No account found",
      });
    }
    return res.send({
      success: 1,
      message: "Accounts Fetched successfully",
      details: isExist,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Get All Banks Name
// Method:Get
// EndPoints:/
const getAllBanksName = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(process.env.LIMIT);
    const skip = (page - 1) * limit;
    // Fetch the paginated results
    const [allBanks, totalCount] = await Promise.all([
      Banks.find().skip(skip).limit(limit),
      Banks.countDocuments(), // Count total number of documents
    ]);

    return res.send({
      success: 1,
      message: "All Banks fetched successfully",
      details: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        banks: allBanks,
      },
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Search Bank by their name and code
// Method:Post
// EndPoints:/
const searchBank = async (req, res) => {
  try {
    let { q,page=1 } = req.query;
    const LIMIT = process.env.LIMIT;
    let skip = (page-1)* LIMIT
    if (!q) {
      return res.send({
        success: 0,
        message: "Search query is required",
      });
    }
    // Create a regex for case-insensitive search
    const searchQuery = new RegExp(q, "i"); // 'i' for case-insensitive

    // Perform the search in the database
    const results = await Banks.find({
      $or: [{ name: searchQuery }, { code: searchQuery }],
    }).skip(skip).limit(LIMIT);
    return res.send({
      success: 1,
      message: "Banks fetched successfully",
      details: results,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = {
  createAccount,
  getDoctorBankAccount,
  getAllBanksName,
  searchBank,
};
