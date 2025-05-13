const AddMember = require("../../../../modal/AddMembers");

// Create Member
// Method:Post
// EndPoint:/user-add-member
const createMember = async (req, res) => {
  try {
    const { name, yearOfBirth, phoneNumber, gender, address, city, pinCode } =
      req.body;

    if (
      !name ||
      !yearOfBirth ||
      !phoneNumber ||
      !gender ||
      !address ||
      !city ||
      !pinCode
    ) {
      return res.send({
        success: 0,
        message: "Please enter all the required fields",
      });
    }

    const addNew = await AddMember.create({
      name,
      yearOfBirth,
      phoneNumber,
      gender,
      address,
      city,
      pinCode,
      userId: req.user._id,
      image: req.file.image && `/user/avatar/${req.file.filename}`,
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

// Get all member of User
// Method:Post
// EndPoint:/user-add-member
const getAllMemberOfPatients = async (req, res) => {
  try {
    const all = await AddMember.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    return res.send({
      success: 1,
      message: "All Members  fetched successfully",
      details: all,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = { createMember, getAllMemberOfPatients };
