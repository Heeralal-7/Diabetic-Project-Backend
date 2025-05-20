const Doctor = require("../../../../modal/docter");
const Rating = require("../../../../modal/rating");

// const doctorRating = async (doctorId) => {
//   try {
//     const isExist = await Rating.find({ doctorId })
//       .populate({
//         path: "userId",
//         select: "name image",
//       })
//       .sort({
//         rating: -1,
//       });
//     // console.log(isExist);
//     if (!isExist) {
//       console.log("no rating found");
//     }

//     let sum = 0;
//     isExist.forEach((rating) => {
//       sum += +rating.rating;
//     });
//     // Overall rating
//     const totalCount = isExist.length;
//     let averageRating;
//     if (totalCount > 0) {
//       averageRating = Math.floor(sum / totalCount);
//     } else {
//       averageRating = 0;
//     }
//     return averageRating;
//   } catch (error) {
//     console.log(error.message);
//   }
// };

// Get All Doctor
// Method:Get
// EndPoint:/user-doctor

// const getAllDoctor = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(process.env.LIMIT);
//     const skip = (page - 1) * limit;
//     const allDoctor = await Doctor.find({})
//       .select("-phnOtp")
//       .skip(skip)
//       .limit(limit);
//     if (allDoctor && allDoctor.length == 0) {
//       return res.send({
//         success: 0,
//         message: "No doctor is there...",
//       });
//     }

//     const finalResult = await Promise.all(
//       allDoctor.map(async (d) => {
//         let rating = await doctorRating(d._id);
//         return { ...d.toObject(), rating };
//       })
//     );
//     return res.send({
//       success: 1,
//       message: "All Doctor fetched successfully",
//       details: finalResult,
//     });
//   } catch (error) {
//     return res.send({
//       success: 0,
//       message: error.message,
//     });
//   }
// };

/*
Get All Doctor
Method:Get
EndPoint:/user-doctor
*/
const getAllDoctor = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(process.env.LIMIT);
    const skip = (page - 1) * limit;

    const doctorsWithRatings = await Doctor.aggregate([
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
                rating: { $toInt: "$$rating.rating" },
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
              then: { $ceil: { $divide: ["$ratingSum", "$ratingCount"] } },
              else: 0,
            },
          },
        },
      },

      // Join consultationfees
      {
        $lookup: {
          from: "consultationfees",
          localField: "_id",
          foreignField: "doctorId",
          as: "consultationFees",
        },
      },
      {
        $project: {
          ratings: 0,
          phnOtp: 0,
          ratingSum: 0,
          ratingCount: 0,
        },
      },
      { $skip: skip },
      { $limit: limit },
    ]);

    if (!doctorsWithRatings.length) {
      return res.send({
        success: 0,
        message: "No doctor is there...",
      });
    }

    return res.send({
      success: 1,
      message: "All Doctors fetched successfully",
      details: doctorsWithRatings,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};


// Get single Doctor by their id
// Method:Get
// EndPoint:user-doctor/profile?id=id
const getSingleDoctor = async (req, res) => {
  try {
    const { id } = req.query;
    const isExist = await Doctor.findById(id);
    if (!isExist) {
      return res.send({
        success: 0,
        message: "No Doctor found",
      });
    }
    return res.send({
      success: 1,
      message: "Doctor fetched successfully",
      details: isExist,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = { getAllDoctor, getSingleDoctor };
