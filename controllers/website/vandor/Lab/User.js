const Vendor = require("../../../../modal/vandor");
const Addtest = require("../../../../modal/addTest");

// Get all vendor
// Method:GET
// EndPoint:/website
const getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({
      vendor: { $regex: "^lab$", $options: "i" } // case-insensitive match for "lab"
    }).populate('vendor');

    if (!vendors || vendors.length === 0) {
      return res.send({
        success: 0,
        message: "No Lab Vendor Found",
        details: [],
      });
    }
   
    return res.send({
      success: 1,
      message: "Lab vendors fetched successfully",
      details: vendors,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};


// Get Vendor Tests
// Method:GET
// EndPoint:/website/:id
const getTest = async (req, res) => {
  try {
    const vendorId = req.params.id;
    const vendor = await Addtest.find({ vendorId: vendorId });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    return res.send({
      message: "Fetched successfully",
      success: 1,
      details: vendor,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



module.exports = { getVendors, getTest };
