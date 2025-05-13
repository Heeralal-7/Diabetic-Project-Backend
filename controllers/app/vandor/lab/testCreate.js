const Testcreate = require("../../../../modal/testCreate");


//Get selected test according to category
//Method: Get
//Endpoint: /test/category
const testCategory = async (req, res) => {
  try {
    const category = req.params.category;

    if (!category) {
      return res.send({
        success: 0,
        message: "Category are required",
      });
    }
    const report = await Testcreate.find({ category });
    if (!report) {
      return res.send({
        success: 0,
        message: "No category found",
      });
    }

    return res.send({
      success: 1,
      message: "Categories found",
      report,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = { testCategory };
