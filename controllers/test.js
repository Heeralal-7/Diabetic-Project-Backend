const Driver = require("../modal/driver");
const Doctor = require("../modal/docter");
const ConsultationFees = require("../modal/ConsultationFees");
const Bank = require("../modal/Banks");
const Appointment = require("../modal/Appointment");
const BookedSlot = require("../modal/BookedSlot");
const generateToken04 = require("../zego/server");

const updateDriver = async (req, res) => {
  try {
    const result = await BookedSlot.updateMany(
      {},
      { $set: { appointmentId: null } }
    );
    return res.send({
      success: 1,
      message: "updated successfuly",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = { updateDriver };
