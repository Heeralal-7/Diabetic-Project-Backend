const Doctor = require("../../../modal/docter")


// Get all doctor
// Method:GET
// EndPoint:/website
const getDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.find({});
    if (!doctor) {
      return res.send({
        success: 0,
        message: "No doctor Found",
        details: doctor,
      });
    }

    return res.send({
      success: 1,
      message: "fetched successfully",
      details: doctor,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Get Doctor Tests
// Method:GET
// EndPoint:/website/:id
const getdoctorProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch the doctor along with the associated document using populate
    const doctor = await Doctor.findOne({ _id: id })
    .populate([
      { path: 'myDocumentId' },
      { path: 'qualification' },
      { path: 'specialist' }
    ])
    
    if (!doctor) {
      return res.send({
        success: 0,
        message: "No doctor found",
      });
    }

    return res.send({
      success: 1,
      message: "Fetched successfully",
      details: doctor,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};


module.exports = { getDoctor,getdoctorProfile };
