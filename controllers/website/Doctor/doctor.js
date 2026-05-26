// controllers/doctorController.js
const Doctor = require("../../../modal/docter");
// const { calculateOnRoadDistance } = require("../../../controllers/utils/googleMapsDistance");


const calculateStraightLineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in KM
};
// Get all doctors with distance calculation
// Method: GET
// EndPoint: /doctor/get
const getDoctor = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(process.env.LIMIT) || 10;
    const skip = (page - 1) * limit;
    
    // Get user's location from query parameters
    const userLat = parseFloat(req.query.latitude);
    const userLng = parseFloat(req.query.longitude);
    
    // Check if user location is provided
    const hasUserLocation = !isNaN(userLat) && !isNaN(userLng);

    const doctorsWithRatings = await Doctor.aggregate([
      // Filter doctors with ClinicId = null
      {
        $match: {
          ClinicId: null
        }
      },
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
      // Add location validation check
      {
        $addFields: {
          hasValidLocation: {
            $and: [
              { $ne: ["$latitude", null] },
              { $ne: ["$longitude", null] },
              { $ne: ["$latitude", ""] },
              { $ne: ["$longitude", ""] }
            ]
          }
        }
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

    // If user location is provided, calculate distances for each doctor
    if (hasUserLocation) {
      // Map through doctors (No need for Promise.all/async here anymore)
      const doctorsWithDistances = doctorsWithRatings.map((doctor) => {
        try {
          // Check if doctor has valid location data
          if (doctor.hasValidLocation && 
              doctor.latitude && 
              doctor.longitude) {
            
            const doctorLat = parseFloat(doctor.latitude);
            const doctorLng = parseFloat(doctor.longitude);
            
            // Validate coordinates range
            if (!isNaN(doctorLat) && !isNaN(doctorLng)) {
              
              // DIRECT CALCULATION: Straight Line
              const distanceValue = calculateStraightLineDistance(
                userLat,
                userLng,
                doctorLat,
                doctorLng
              );
              
              return {
                ...doctor,
                distance: {
                  value: distanceValue,
                  text: `${distanceValue.toFixed(1)} km`,
                  duration: null,
                  durationText: null,
                  calculationMethod: 'STRAIGHT_LINE',
                  status: 'OK'
                }
              };
            }
          }
          
          // If doctor doesn't have valid location
          return {
            ...doctor,
            distance: {
              value: null,
              text: "Location unavailable",
              status: 'NO_LOCATION'
            }
          };
        } catch (error) {
          console.error(`Error calculating distance for doctor ${doctor._id}:`, error);
          return {
            ...doctor,
            distance: {
              value: null,
              text: "Calculation Error",
              status: 'ERROR'
            }
          };
        }
      });

      // Sort doctors by distance (nearest first)
      doctorsWithDistances.sort((a, b) => {
        const aDist = a.distance?.value;
        const bDist = b.distance?.value;
        
        // Handle null values (push to bottom)
        if (aDist == null && bDist == null) return 0;
        if (aDist == null) return 1;
        if (bDist == null) return -1;
        
        return aDist - bDist;
      });

      return res.send({
        success: 1,
        message: "Doctors fetched successfully with distances",
        details: doctorsWithDistances,
        userLocation: {
          latitude: userLat,
          longitude: userLng
        }
      });
    }

    // If no location provided, return doctors without distance
    return res.send({
      success: 1,
      message: "Doctors fetched successfully",
      details: doctorsWithRatings,
      note: "Provide latitude and longitude query parameters to get distances"
    });
  } catch (error) {
    console.error('Error in getDoctor API:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// Get Doctor Profile
// Method: GET
// EndPoint: /doctor/website/:id
const getdoctorProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findOne({ _id: id }).populate([
      { path: 'myDocumentId' },
      { path: 'qualification' },
      { path: 'specialist' },
      { path: 'ConsultationFeesId' }
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

module.exports = { getDoctor, getdoctorProfile };