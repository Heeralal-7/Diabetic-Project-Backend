const Service = require("../../../../modal/addServices");

//Get medicine appointments
//Method:Get
//Endpoints:appointment/get
const getAppointments = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // Fetch the data with pagination
    const data = await Service.find({ vendorId: req.user._id })
      .skip(skip)
      .limit(Number(limit));

    // Get the total number of documents for this vendor

    return res.send({
      success: 1,
      message: "Fetched successfully",
      details: data,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = { getAppointments };
