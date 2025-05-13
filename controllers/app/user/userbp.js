const BP = require("../../../modal/userbp");
const Weight = require("../../../modal/userWeight");
const BMI = require("../../../modal/bmi");

//User create bp
//Method:Post
//Endpoints: /bp/create-bp
const userbp = async (req, res) => {
  try {
    const { date, systolic, diastolic } = req.body;

    if (!date || !systolic || !diastolic) {
      return res.send({
        success: 0,
        message: "All fields are required",
      });
    }

    if (systolic <= 0 || diastolic <= 0) {
      return res.send({
        success: 0,
        message: "Systolic and diastolic values must be positive numbers.",
      });
    }
    const data = await BP.create({
      userId: req.user._id,
      date,
      systolic,
      diastolic,
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

//User get bp,weight and bmi
//Method:Get
//Endpoints: /bp/get-bp
const getBp = async (req, res) => {
  try {
    const data = await BP.find({ userId: req.user._id });
    const data1 = await Weight.find({ userId: req.user._id });
    const data2 = await BMI.find({ userId: req.user._id });

    const mergedData = {
      bloddpressure: data,
      weight: data1,
      bmi: data2,
    };

    return res.send({
      success: 1,
      message: "Fetched successfully",
      details: mergedData,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//User delete bp
//Method:Delete
//Endpoints:/bp/delete-bp/id
const deleteBp = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await BP.findByIdAndDelete(id);

    return res.send({
      success: 0,
      message: "Deleted successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = { userbp, getBp, deleteBp };
