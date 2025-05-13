const Appointment = require("../../../../modal/Appointment");

//Current lab test
//Method:Get
//Endpoints:/labtest/data
const current = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; 

    const skip = (page - 1) * limit;

    const data = await Appointment.find({ userId: req.user._id })
      .skip(skip)
      .limit(parseInt(limit));

      if (data.length === 0) {
      return res.send({
        success: 0,
        message: "No data found",
      });
    }

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

//History for lab test
//Method:Get
//Endpoints:/labtest/history
const history = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const data = await Appointment.find({
      userId: req.user._id,
      status: { $in: [2, 3] },
    })
      .skip(skip)
      .limit(parseInt(limit));

    // If no data is found
    if (data.length === 0) {
      return res.send({
        success: 0,
        message: "No data found",
      });
    }

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

module.exports = { current, history };
