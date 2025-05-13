const Weight = require("../../../modal/userWeight");


//user create weight
//Method:Post
//Endpoint:/weight/create-weight
const createWeight = async (req, res) => {
  try {
    const { weight, height, date } = req.body;

    const data = await Weight.create({
      weight,
      height,
      date,
      userId:req.user.id
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




module.exports = { createWeight };
