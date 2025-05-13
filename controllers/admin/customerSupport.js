const Admin = require("../../modal/adminCustomerSupport");

//Create admin customer support
//Method:Get
//Endpoints:/customer/created
const adminPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    const data = await Admin.create({
      phone,
    });

    return res.send({
      success: 1,
      message: "Created successfully",
      details: data,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = { adminPhone };
