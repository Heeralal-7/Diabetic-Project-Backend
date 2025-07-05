const Doctor = require("../../../../modal/docter");
const Rating = require("../../../../modal/rating");
 const Chat = require("../../../../modal/chat")
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
          consultationFees: 0, // remove raw array
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

// /user-doctor/getDoctor
const getDoctor = async (req, res) => {
  try {
    const user = req.user; // from middleware

    if (!user) {
      return res.status(401).json({ success: 0, message: "User not found from token" });
    }

    // Get all chats for this user
    const chats = await Chat.find({ userId: user._id }).lean();

    if (!chats || chats.length === 0) {
      return res.status(404).json({ success: 0, message: "No chat found for this user" });
    }

    const doctorDetails = [];

    for (const chat of chats) {
      if (!chat.messages || chat.messages.length === 0) continue;

      // Find last message in this chat
      const lastMessage = chat.messages[chat.messages.length - 1];

      // Get doctor info including regId
      const doctor = await Doctor.findById(chat.doctorId).select("name image regId");

      if (!doctor) continue;

      doctorDetails.push({
        doctorId: doctor._id,
        name: doctor.name,
        image: doctor.image,
        regId: doctor.regId || null,
        channelId: chat.channelId || null,
        lastMessage: {
          text: lastMessage.text || lastMessage.message || "",
          senderId: lastMessage.senderId,
          time: lastMessage.time || lastMessage.createdAt || null,
          from: lastMessage.senderId.toString() === doctor._id.toString() ? "doctor" : "user"
        }
      });
    }

    return res.status(200).json({
      success: 1,
      message: "Doctors who sent or received messages",
      data: doctorDetails
    });

  } catch (error) {
    return res.status(500).json({
      success: 0,
      message: error.message
    });
  }
};



module.exports = { getAllDoctor, getSingleDoctor, getDoctor };
  