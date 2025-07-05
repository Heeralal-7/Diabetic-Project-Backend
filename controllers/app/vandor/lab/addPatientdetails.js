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

// Update patient address
// Method: Put
// Endpoint: /patient/update/:id
const updatePatientAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, addressType, address, state, city, pinCode } = req.body;
    const token = req.headers.token;

    if (!token) {
      return res.status(401).send({
        success: 0,
        message: "No authentication token found",
      });
    }

    const updatedAddress = await Patient.findByIdAndUpdate(
      id,
      {
        name,
        phone,
        addressType,
        address,
        state,
        city,
        pinCode,
      },
      { new: true }
    );

    if (!updatedAddress) {
      return res.status(404).send({
        success: 0,
        message: "Address not found",
      });
    }

    return res.send({
      success: 1,
      message: "Address updated successfully",
      details: updatedAddress,
    });
  } catch (error) {
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// Delete patient address
// Method: Delete
// Endpoint: /patient/delete/:id
const deletePatientAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers.token;

    if (!token) {
      return res.status(401).send({
        success: 0,
        message: "No authentication token found",
      });
    }

    const deletedAddress = await Patient.findByIdAndDelete(id);

    if (!deletedAddress) {
      return res.status(404).send({
        success: 0,
        message: "Address not found",
      });
    }

    return res.send({
      success: 1,
      message: "Address deleted successfully",
      details: deletedAddress,
    });
  } catch (error) {
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};
module.exports = { addpatient, getPatient, updatePatientAddress, deletePatientAddress };
