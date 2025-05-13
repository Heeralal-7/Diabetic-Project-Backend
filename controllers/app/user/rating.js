const Rating = require("../../../modal/rating");

// Create Rating by user
// Method:Post
// EndPoint:/user-rating
const createRating = async (req, res) => {
  try {
    const { rating, description, doctorId, vendorId } = req.body;

    if (!rating || !description || !(doctorId || vendorId)) {
      return res.send({
        success: 0,
        message: "Please enter all the required fields",
      });
    }

    if (rating < 0 || rating > 5) {
      return res.send({
        success: 0,
        message: "Please enter a rating between 0 and 5",
      });
    }
    let query = {};
    if (doctorId) {
      query = {
        $and: [{ userId: req.user._id }, { doctorId }],
      };
    } else {
      query = {
        $and: [{ userId: req.user._id }, { vendorId }],
      };
    }

    const isExist = await Rating.findOne(query);

    if (isExist) {
      return res.send({
        success: 0,
        message: "You have already added your feedBack",
      });
    }
    const createRatingOfuser = await Rating.create({
      rating,
      description,
      doctorId,
      vendorId,
      userId: req.user._id,
    });
    return res.send({
      success: 1,
      message: "Rating created successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = { createRating };
