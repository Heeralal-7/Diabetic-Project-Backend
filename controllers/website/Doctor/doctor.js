const Doctor = require("../../../modal/docter")


// Get all doctor
// Method:GET
// EndPoint:/website
const getDoctor = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(process.env.LIMIT);
    const skip = (page - 1) * limit;

    const doctorsWithRatings = await Doctor.aggregate([
      // --- Do not include geoNear since no location filter ---

      // Join ratings
      {
        $lookup: {
          from: "ratings",
          localField: "_id",
          foreignField: "doctorId",
          as: "ratings",
        },
      },
      {
        $addFields: {
          ratings: {
            $map: {
              input: "$ratings",
              as: "rating",
              in: {
                rating: { $toDouble: "$$rating.rating" },
              },
            },
          },
        },
      },
      {
        $addFields: {
          ratingSum: { $sum: "$ratings.rating" },
          ratingCount: { $size: "$ratings" },
        },
      },
      {
        $addFields: {
          rating: {
            $cond: {
              if: { $gt: ["$ratingCount", 0] },
              then: { $round: [{ $divide: ["$ratingSum", "$ratingCount"] }, 1] },
              else: 0,
            },
          },
        },
      },

      // Join consultation fees
      {
        $lookup: {
          from: "consultationfees",
          localField: "_id",
          foreignField: "doctorId",
          as: "consultationFees",
        },
      },
      {
        $addFields: {
          ConsultationFeesId: { $arrayElemAt: ["$consultationFees", 0] },
        },
      },

      {
        $project: {
          ratings: 0,
          phnOtp: 0,
          ratingSum: 0,
          ratingCount: 0,
          consultationFees: 0,
        },
      },

      { $skip: skip },
      { $limit: limit },
    ]);

    if (!doctorsWithRatings.length) {
      return res.send({
        success: 0,
        message: "No doctor found",
      });
    }

    return res.send({
      success: 1,
      message: "Doctors fetched successfully",
      details: doctorsWithRatings,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//  
// Get Doctor Tests
// Method:GET
// EndPoint:/website/:id
const getdoctorProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the doctor with populated fields including ConsultationFeesId
    const doctor = await Doctor.findOne({ _id: id }).populate([
      { path: 'myDocumentId' },
      { path: 'qualification' },
      { path: 'specialist' },
      { path: 'ConsultationFeesId' } // ✅ Add this line
    ]);

    if (!doctor) {
      return res.send({
        success: 0,
        message: "No doctor found",
      });
    }

    return res.send({
      success: 1,
      message: "Fetched successfully",
      details: doctor,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};



module.exports = { getDoctor,getdoctorProfile };
