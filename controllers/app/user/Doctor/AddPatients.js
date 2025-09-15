const AddMember = require("../../../../modal/AddMembers");
const Patient = require("../../../../modal/doctorpatient");

// Create Member
// Method:Post
// EndPoint:/user-add-member
const createMember = async (req, res) => {
  try {
    const { name, yearOfBirth, phoneNumber, gender, address, city, pinCode } =
      req.body;

    
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
      details:addNew
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

// user-add-member/addpatient
const addpatient = async (req, res) => {
  try {
    const { name, dob, phone, gender, address, country, state, city, pinCode,problemDescription } =
      req.body;

   const details = await Patient.create({
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
      problemDescription,
      userId: req.user._id,
    });

    return res.send({
      success: 1,
      message: "Created successfully",
   details:details
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = { createMember, getAllMemberOfPatients,addpatient };
