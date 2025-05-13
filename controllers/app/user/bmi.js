const BMI = require("../../../modal/bmi");

//Calculate bmi
//Method:Post
//Endpoint: /bmi/calculate
const bmi = async (req, res) => {
  try {
    const { gender, height, weight, age } = req.body;

    // Validate input fields
    if (!gender || !height || !weight || !age) {
      return res.send({
        success: 0,
        message: "All fields are required",
      });
    }

    const heightInMeters = height / 100;

    // Validate height
    if (heightInMeters <= 0) {
      return res.send({
        success: 0,
        message: "Height must be a positive number greater than zero",
      });
    }
    const bmiValue = weight / (heightInMeters * heightInMeters);

    let category = "";
    if (bmiValue < 18.5) {
      category = "Underweight";
    } else if (bmiValue >= 18.5 && bmiValue < 24.9) {
      category = "Normal weight";
    } else if (bmiValue >= 25 && bmiValue < 29.9) {
      category = "Overweight";
    } else if (bmiValue >= 30 && bmiValue < 34.9) {
      category = "Moderately Obese";
    } else if (bmiValue >= 35 && bmiValue < 39.9) {
      category = "Severely Obese";
    } else if (bmiValue >= 40) {
      category = "Morbidly Obese";
    }

    const bmiReport = await BMI.create({
      userId: req.user._id,
      height,
      weight,
      gender,
      age,
      bmi: bmiValue.toFixed(2),
      category: category,
    });
    return res.send({
      success: 1,
      message: "BMI calculated successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Get bmi
//Method:Get
//Endpoint: /bmi/get
const getBmi = async (req, res) => {
  try {
    const data = await BMI.find({ userId: req.user._id });
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

module.exports = { bmi, getBmi };
