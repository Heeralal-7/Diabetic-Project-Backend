const Rating = require("../../../modal/rating");

const getAverage = async (data, doctorId) => {
  try {
    const ratings = await Rating.find({
      $and: [{ rating: data }, { doctorId }],
    });
    // console.log(ratings);
    // Check if there are no ratings found
    if (ratings.length === 0) {
      return { average: 0 };
    }
    let sum = 0;

    // Iterate over each rating document
    ratings.forEach((d) => {
      const numericRating = Number(d.rating);

      // Ensure the rating is between 0 and 5
      if (numericRating >= 0 && numericRating <= 5) {
        sum += numericRating;
      }
    });

    const count = ratings.length;
    // Calculate the average rating
    const avg = sum / count;

    // Return the calculated average
    return { average: avg };
  } catch (error) {
    // Log any errors and return null as the average
    console.error("Error calculating average rating:", error);
  }
};

// Get Doctor rating feedback
// Method:Get
// EndPoint://doctor-rating/feedback?page=&limit=
const getRatingFeedback = async (req, res) => {
  try {
    let { page, limit } = req.query;
    page = parseInt(page, 10) || 1;
    limit = +limit || 5;

    const skip = (page - 1) * limit;

    const getAllRating = await Rating.find({ doctorId: req.user._id })
      .populate({
        path: "userId",
        select: "name image",
      })
      .sort({
        rating: -1,
      })
      .skip(skip)
      .limit(limit);
    if (!getAllRating) {
      return res.send({
        success: 0,
        message: "Not found Rating yet",
      });
    }
    return res.send({
      success: 1,
      message: "Feedback fetched successfully",
      details: getAllRating,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Get rating of Doctor
// Method:Get
// EndPoint://doctor-rating/
const getDoctorRating = async (req, res) => {
  try {
    const isExist = await Rating.find({ doctorId: req.user._id })
      .populate({
        path: "userId",
        select: "name image",
      })
      .sort({
        rating: -1,
      });
    // console.log(isExist);
    if (!isExist) {
      return res.send({
        success: 0,
        message: "No Rating found",
      });
    }

    let sum = 0;
    isExist.forEach((rating) => {
      sum += +rating.rating;
    });
    // Overall rating
    const totalCount = isExist.length;
    let averageRating;
    if (totalCount > 0) {
      averageRating = Math.floor(Math.ceil(sum / totalCount));
    } else {
      averageRating = 0;
    }

    const category = ["0", "1", "2", "3", "4", "5"];
    const doctorId = req.user._id;
    let excellent = await getAverage(category["4"], doctorId);
    let good = await getAverage(category["3"], doctorId);
    let average = await getAverage(category["2"], doctorId);
    let belowAverage = await getAverage(category["1"], doctorId);
    let poor = await getAverage(category["0"], doctorId);

    return res.send({
      success: 1,
      message: "Rating fetched successfully",
      overallRating: +averageRating,
      excellent: excellent.average,
      average: average.average,
      good: good.average,
      belowAverage: belowAverage.average,
      poor: poor.average,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = { getDoctorRating, getRatingFeedback };
