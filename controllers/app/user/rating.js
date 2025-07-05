const Rating = require("../../../modal/rating");
const Doctor = require("../../../modal/docter")
// Create Rating by user
// Method:Post
// EndPoint:/user-rating
const createRating = async (req, res) => {
  try {
    const { rating, description, doctorId, vendorId, ClinicId } = req.body;
    const userId = req.user._id;

    // 1️⃣ Validate required fields
    if (rating == null || description == null) {
      return res.status(400).json({
        success: 0,
        message: "Please enter all the required fields",
      });
    }

    // 2️⃣ Validate rating range
    if (rating < 0 || rating > 5) {
      return req.status(400).json({
        success: 0,
        message: "Please enter a rating between 0 and 5",
      });
    }

    // 3️⃣ Build existence-check query depending on target
    let query;
    if (doctorId) {
      query = { userId, doctorId };
    } else if (vendorId) {
      query = { userId, vendorId };
    } else if (ClinicId) {
      query = { userId, ClinicId };
    } else {
      return res.status(400).json({
        success: 0,
        message: "Please provide a doctorId, vendorId, or clinicId",
      });
    }

    // 4️⃣ Prevent duplicate ratings
    const isExist = await Rating.findOne(query);
    if (isExist) {
      return res.status(409).json({
        success: 0,
        message: "You have already submitted feedback for this target.",
      });
    }

    // 5️⃣ Create the rating
    const newRating = await Rating.create({
      rating,
      description,
      userId,
      doctorId: doctorId || undefined,
      vendorId: vendorId || undefined,
      ClinicId: ClinicId || undefined,
    });

    // 6️⃣ Respond
    return res.status(201).json({
      success: 1,
      message: "Rating created successfully",
      details: newRating,
    });
  } catch (error) {
    console.error("createRating error:", error);
    return res.status(500).json({
      success: 0,
      message: error.message,
    });
  }
};


// user-rating/gettoprated
const gettoprated = async (req, res) => {
  try {
    // Step 1: Get ratings where rating > 3 and populate doctor data
    const ratings = await Rating.find({ rating: { $gt: 3 } }).populate("doctorId");

    const doctorRatingsMap = new Map();

    ratings.forEach((item) => {
      const doctor = item.doctorId;
      const ratingValue = parseFloat(item.rating);

      if (doctor && !isNaN(ratingValue)) {
        const doctorId = doctor._id.toString();

        if (!doctorRatingsMap.has(doctorId)) {
          doctorRatingsMap.set(doctorId, {
            doctor: doctor,
            ratingSum: 0,
            ratingCount: 0,
            starCount: {
              1: 0,
              2: 0,
              3: 0,
              4: 0,
              5: 0
            }
          });
        }

        const entry = doctorRatingsMap.get(doctorId);

        entry.ratingCount += 1;
        entry.ratingSum += ratingValue;

        const roundedRating = Math.round(ratingValue);
        if (entry.starCount[roundedRating] !== undefined) {
          entry.starCount[roundedRating] += 1;
        }
      }
    });

    // Step 2: Final response
    const result = Array.from(doctorRatingsMap.values()).map(entry => ({
      ...entry.doctor._doc,
      totalRatings: entry.ratingCount,
      averageRating: (entry.ratingSum / entry.ratingCount).toFixed(1),
      starBreakdown: entry.starCount
    }));

    return res.send({
      success: 1,
      data: result
    });

  } catch (error) {
    return res.send({
      success: 0,
      message: error.message
    });
  }
};


module.exports = { createRating,gettoprated };
