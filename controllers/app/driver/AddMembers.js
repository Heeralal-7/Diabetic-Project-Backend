const AddMembers = require("../../../modal/AddMembers");

// Add member in appointment
// Method:
// EndPoint
const addMembersInAppointment = async (req, res) => {
  try {
    const {
      name,
      dob,
      phoneNumber,
      gender,
      address,
      city,
      pinCode,
      test,
      packageId,
      appointmentId,
    } = req.body;

    if (
      !name ||
      !dob ||
      !phoneNumber ||
      !gender ||
      !address ||
      !city ||
      !pinCode ||
      !test ||
      !packageId ||
      appointmentId
    ) {
      return res.send({
        success: 0,
        message: "Please enter all the required fields",
      });
    }

    const AddMem = await AddMembers.create({
      name,
      dob,
      phoneNumber,
      gender,
      address,
      city,
      pinCode,
      test,
      packageId,
      appointmentId,
      image: req.file.image[0].filename,
    });
    return res.send({
      success: 1,
      message: "Member added successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = { addMembersInAppointment };
