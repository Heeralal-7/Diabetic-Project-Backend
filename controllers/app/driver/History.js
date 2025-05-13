const History = require("../../../modal/History");

const getHistory = async (req, res) => {
  try {
    const history = await History.findOne({ driverId: req.user._id }).populate(
      "appointmentId"
    );
    if (!history) {
      return res.send({
        success: 0,
        message: "History not found yet",
      });
    }

    return res.send({
      success: 1,
      message: "History fetched successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};
module.exports = { getHistory };
