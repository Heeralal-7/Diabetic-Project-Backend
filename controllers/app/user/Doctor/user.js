const Doctor = require("../../../../modal/docter");
const Rating = require("../../../../modal/rating");
 const Chat = require("../../../../modal/chat")
const maxLimit = require("../../../../modal/distanceLimit");
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
// const getAllDoctor = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(process.env.LIMIT);
//     const skip = (page - 1) * limit;

//     const { latitude, longitude } = req.query;

//     if (!latitude || !longitude) {
//       return res.status(400).json({
//         success: 0,
//         message: "Latitude and Longitude are required",
//       });
//     }

//     const lat = parseFloat(latitude);
//     const lng = parseFloat(longitude);

//     const doctorsWithRatings = await Doctor.aggregate([
//       // Filter by nearby location within 5km
//       {
//         $geoNear: {
//           near: {
//             type: "Point",
//             coordinates: [lng, lat],
//           },
//           distanceField: "distance",
//           spherical: true,
//           maxDistance: 5000, // 5 km in meters
//         },
//       },

//       // Round and add distance (optional)
//       {
//         $addFields: {
//           distance: {
//             $round: [{ $divide: ["$distance", 1000] }, 2], // km
//           },
//         },
//       },

//       // Join ratings
//       {
//         $lookup: {
//           from: "ratings",
//           localField: "_id",
//           foreignField: "doctorId",
//           as: "ratings",
//         },
//       },
//       {
//         $addFields: {
//           ratings: {
//             $map: {
//               input: "$ratings",
//               as: "rating",
//               in: {
//                 rating: { $toDouble: "$$rating.rating" },
//               },
//             },
//           },
//         },
//       },
//       {
//         $addFields: {
//           ratingSum: { $sum: "$ratings.rating" },
//           ratingCount: { $size: "$ratings" },
//         },
//       },
//       {
//         $addFields: {
//           rating: {
//             $cond: {
//               if: { $gt: ["$ratingCount", 0] },
//               then: { $round: [{ $divide: ["$ratingSum", "$ratingCount"] }, 1] },
//               else: 0,
//             },
//           },
//         },
//       },

//       // Join consultation fees
//       {
//         $lookup: {
//           from: "consultationfees",
//           localField: "_id",
//           foreignField: "doctorId",
//           as: "consultationFees",
//         },
//       },
//       {
//         $addFields: {
//           ConsultationFeesId: { $arrayElemAt: ["$consultationFees", 0] },
//         },
//       },

//       {
//         $project: {
//           ratings: 0,
//           phnOtp: 0,
//           ratingSum: 0,
//           ratingCount: 0,
//           consultationFees: 0,
//         },
//       },

//       { $skip: skip },
//       { $limit: limit },
//     ]);

//     if (!doctorsWithRatings.length) {
//       return res.send({
//         success: 0,
//         message: "No doctor is there...",
//       });
//     }

//     return res.send({
//       success: 1,
//       message: "All Doctors fetched successfully",
//       details: doctorsWithRatings,
//     });
//   } catch (error) {
//     return res.send({
//       success: 0,
//       message: error.message,
//     });
//   }
// };



// Get single Doctor by their id
// Method:Get
// EndPoint:user-doctor/profile?id=id



// Utility function for distance calculation


// Utility function for distance calculation



// Improved distance calculation function

// Improved distance calculation function


const calculateStraightLineDistance = (lat1, lon1, lat2, lon2) => {
  try {
    // Convert to radians
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return parseFloat(distance.toFixed(2));
  } catch (error) {
    console.error("Distance calculation error:", error);
    return null;
  }
};

// POST Endpoint: /user-doctor
const getAllDoctor = async (req, res) => {
  try {
    const page = parseInt(req.body.page) || parseInt(req.query.page) || 1;
    const limit = parseInt(process.env.LIMIT) || 10;
    const skip = (page - 1) * limit;
    
    // Get parameters from request
    const { 
      latitude, 
      longitude, 
      search,
      clinicId = null
    } = req.body || req.query || {};
    
    const searchQuery = search;

    // Check if valid location is provided
    const userLat = parseFloat(latitude);
    const userLng = parseFloat(longitude);
    const hasUserLocation = !isNaN(userLat) && !isNaN(userLng);

    // Get distance limit from database
    const distanceLimit = await maxLimit.findOne().sort({ createdAt: -1 });
    const maxDistance = distanceLimit ? distanceLimit.doctorLimit : 40; // Default 40km

    // Build match conditions
    const matchConditions = {};
    
    // Condition: doctors with ClinicId = null (default)
    if (clinicId === null || clinicId === 'null' || clinicId === undefined) {
      matchConditions.ClinicId = null;
    } else if (clinicId) {
      matchConditions.ClinicId = clinicId;
    }
    
    // Add search condition if provided
    if (searchQuery) {
      matchConditions.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { specialization: { $regex: searchQuery, $options: 'i' } },
        { address: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    // Start aggregation pipeline
    const aggregationPipeline = [];

    // Add match conditions if any
    if (Object.keys(matchConditions).length > 0) {
      aggregationPipeline.push({
        $match: matchConditions
      });
    }

    // Add location validation - check only for location.coordinates
    aggregationPipeline.push({
      $addFields: {
        hasValidLocation: {
          $and: [
            { $ne: ["$location", null] },
            { $ne: ["$location.coordinates", null] },
            { $isArray: "$location.coordinates" },
            { $eq: [{ $size: "$location.coordinates" }, 2] },
            { $ne: [{ $arrayElemAt: ["$location.coordinates", 0] }, null] },
            { $ne: [{ $arrayElemAt: ["$location.coordinates", 1] }, null] }
          ]
        },
        // Extract coordinates from location object
        locationLng: { $arrayElemAt: ["$location.coordinates", 0] },
        locationLat: { $arrayElemAt: ["$location.coordinates", 1] }
      }
    });

    // Join ratings
    aggregationPipeline.push(
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
      // Project required fields - remove old lat/lng fields
      {
        $project: {
          ratings: 0,
          phnOtp: 0,
          ratingSum: 0,
          ratingCount: 0,
          consultationFees: 0,
          latitude: 0,    // Remove old latitude field
          longitude: 0,   // Remove old longitude field
          parsedLatitude: 0,
          parsedLongitude: 0,
          hasValidSimpleLocation: 0
        },
      }
    );

    // Apply pagination
    aggregationPipeline.push({ $skip: skip });
    aggregationPipeline.push({ $limit: limit });

    let doctors = await Doctor.aggregate(aggregationPipeline);

    if (!doctors.length) {
      return res.send({
        success: 0,
        message: "No doctors found",
      });
    }

    // Manual distance calculation if location provided
    if (hasUserLocation) {
      const doctorsWithDistance = [];
      
      for (const doctor of doctors) {
        let distance = null;
        
        // Use location.coordinates for distance calculation
        if (doctor.hasValidLocation && doctor.locationLat && doctor.locationLng) {
          const docLat = doctor.locationLat;
          const docLng = doctor.locationLng;
          
          if (!isNaN(docLat) && !isNaN(docLng)) {
            distance = calculateStraightLineDistance(userLat, userLng, docLat, docLng);
          }
        }
        
        if (distance !== null) {
          // Remove the temporary location fields we added
          const { hasValidLocation, locationLat, locationLng, ...doctorData } = doctor;
          doctorsWithDistance.push({
            ...doctorData,
            distance: distance
          });
        }
      }

      // Filter by distance limit
      const filteredDoctors = doctorsWithDistance.filter(doctor => 
        doctor.distance && doctor.distance <= maxDistance
      );

      // Sort by distance
      filteredDoctors.sort((a, b) => {
        if (!a.distance) return 1;
        if (!b.distance) return -1;
        return a.distance - b.distance;
      });

      return res.send({
        success: 1,
        message: "Doctors fetched successfully",
        details: filteredDoctors,
        distanceLimit: maxDistance,
        userLocation: { 
          latitude: userLat, 
          longitude: userLng 
        },
        totalDoctors: filteredDoctors.length,
        pagination: {
          page,
          limit,
          hasMore: filteredDoctors.length === limit
        }
      });
    }

    // If no location provided, return all doctors (remove temporary fields)
    const doctorsWithoutTempFields = doctors.map(doctor => {
      const { hasValidLocation, locationLat, locationLng, ...doctorData } = doctor;
      return doctorData;
    });

    return res.send({
      success: 1,
      message: "All Doctors fetched successfully",
      details: doctorsWithoutTempFields,
      totalDoctors: doctorsWithoutTempFields.length,
      pagination: {
        page,
        limit,
        hasMore: doctorsWithoutTempFields.length === limit
      }
    });

  } catch (error) {
    console.error('Error in getAllDoctor API:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};


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
  