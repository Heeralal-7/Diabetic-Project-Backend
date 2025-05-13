const Customer = require("../../../modal/adminCustomerSupport");


//Get admin customer support
//Method:Get
//Endpoints:/customer/phone
const getPhone = async (req, res) => {
  try {
    const data = await Customer.find();

    return res.send({
      success: 1,
      message: "Fetched",
      details: data,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = { getPhone };
