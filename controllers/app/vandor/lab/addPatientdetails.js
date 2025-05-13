const Patient = require("../../../../modal/addpatientdetails");

//create patient
//Method:Post
//Endpoints:/patient/new
const addpatient = async (req, res) => {
  try {
    const { name, dob, phone, gender, address, country, state, city, pinCode } =
      req.body;

    await Patient.create({
      name,
      dob,
      phone,
      gender,
      address,
      country,
      state,
      city,
      pinCode,
      pic: req.file ? `/user/lab/pic/${req.file.filename}` : "",
      userId: req.user._id,
    });

    return res.send({
      success: 1,
      message: "Created successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//get patient
//Method:Get
//Endpoints:/patient/fetch
const getPatient = async (req, res) => {
  try {
    const data = await Patient.find({ userId: req.user._id });

    if (!data) {
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

module.exports = { addpatient, getPatient };
