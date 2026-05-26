const Clinic = require("../../../../modal/clinic");
const Doctor = require("../../../../modal/docter");
const maxLimit = require("../../../../modal/distanceLimit");

// Distance calculation function
const calculateStraightLineDistance = (lat1, lon1, lat2, lon2) => {
  try {
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

// POST
// all clinic with distance and pagination /
//  Endpoint: /userClinic/getAllClinic
const getAllClinic = async (req, res) => {
  try {
    const page = parseInt(req.body.page) || parseInt(req.query.page) || 1;
    const limit = parseInt(process.env.LIMIT) || 10;
    const skip = (page - 1) * limit;
    
    // Get parameters from request
    const { 
      latitude, 
      longitude, 
      search
    } = req.body || req.query || {};
    
    const searchQuery = search;

    // Check if valid location is provided
    const userLat = parseFloat(latitude);
    const userLng = parseFloat(longitude);
    const hasUserLocation = !isNaN(userLat) && !isNaN(userLng);

    // Get distance limit from database
    const distanceLimit = await maxLimit.findOne().sort({ createdAt: -1 });
    const maxDistance = distanceLimit ? distanceLimit.clinicLimit : 50; // Default 50km (clinicLimit)

    // Build match conditions
    const matchConditions = {};
    
    // Add search condition if provided
    if (searchQuery) {
      matchConditions.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { clinicName: { $regex: searchQuery, $options: 'i' } },
        { address: { $regex: searchQuery, $options: 'i' } },
        { city: { $regex: searchQuery, $options: 'i' } }
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

    // Join Specialists - show full details
    aggregationPipeline.push({
      $lookup: {
        from: "specialists",
        localField: "SpecialistsId",
        foreignField: "_id",
        as: "SpecialistsId",
      },
    });

    // Join Doctors - but only get IDs, not full details
    aggregationPipeline.push({
      $lookup: {
        from: "doctors",
        localField: "DoctorId",
        foreignField: "_id",
        as: "DoctorId",
        pipeline: [
          {
            $project: {
              _id: 1, // Only return doctor ID
              name: 1 // Optional: keep name if needed
            }
          }
        ]
      },
    });

    // Join ConsultationFees
    aggregationPipeline.push({
      $lookup: {
        from: "consultationfees",
        localField: "ConsultationFeesId",
        foreignField: "_id",
        as: "ConsultationFeesId",
      },
    });

    // Add ratings calculation for clinics
    aggregationPipeline.push(
      {
        $lookup: {
          from: "ratings",
          let: { clinicId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$clinicId", "$$clinicId"] }
              }
            }
          ],
          as: "ratings",
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
      }
    );

    // Project required fields - remove all lat/lng fields and doctor details
    aggregationPipeline.push({
      $project: {
        ratings: 0,
        phnOtp: 0,
        ratingSum: 0,
        ratingCount: 0,
        latitude: 0,    // Remove old latitude field
        longitude: 0,   // Remove old longitude field
        // Remove doctor fields except _id and name (if kept)
        "DoctorId.phnOtp": 0,
        "DoctorId.password": 0,
        "DoctorId.token": 0,
        "DoctorId.email": 0,
        "DoctorId.phoneNumber": 0,
        "DoctorId.alternatePhoneNumber": 0,
        "DoctorId.address": 0,
        "DoctorId.latitude": 0,
        "DoctorId.longitude": 0,
        "DoctorId.location": 0,
        "DoctorId.certificateImage": 0,
        "DoctorId.licenceCertificate": 0,
        "DoctorId.signature": 0,
        "DoctorId.myDocumentId": 0,
        "DoctorId.amount": 0,
        "DoctorId.Accountverify": 0,
        "DoctorId.ConsultationFeesId": 0,
        "DoctorId.rejectReason": 0,
        "DoctorId.regId": 0,
        "DoctorId.chatStatus": 0,
        "DoctorId.loginType": 0,
        "DoctorId.ClinicId": 0,
        "DoctorId.bankDetails": 0,
        "DoctorId.createdAt": 0,
        "DoctorId.updatedAt": 0,
        "DoctorId.__v": 0
      },
    });

    // Apply pagination
    aggregationPipeline.push({ $skip: skip });
    aggregationPipeline.push({ $limit: limit });

    let clinics = await Clinic.aggregate(aggregationPipeline);

    if (!clinics.length) {
      return res.send({
        success: 0,
        message: "No clinics found",
      });
    }

    // Manual distance calculation if location provided
    if (hasUserLocation) {
      const clinicsWithDistance = [];
      
      for (const clinic of clinics) {
        let distance = null;
        
        // Use location.coordinates for distance calculation
        if (clinic.location && clinic.location.coordinates && clinic.location.coordinates.length === 2) {
          const clinicLng = clinic.location.coordinates[0];
          const clinicLat = clinic.location.coordinates[1];
          
          if (!isNaN(clinicLat) && !isNaN(clinicLng)) {
            distance = calculateStraightLineDistance(userLat, userLng, clinicLat, clinicLng);
          }
        }
        
        if (distance !== null) {
          clinicsWithDistance.push({
            ...clinic,
            distance: distance
          });
        }
      }

      // Filter by distance limit
      const filteredClinics = clinicsWithDistance.filter(clinic => 
        clinic.distance && clinic.distance <= maxDistance
      );

      // Sort by distance
      filteredClinics.sort((a, b) => {
        if (!a.distance) return 1;
        if (!b.distance) return -1;
        return a.distance - b.distance;
      });

      return res.send({
        success: 1,
        message: "Clinics fetched successfully",
        details: filteredClinics,
        distanceLimit: maxDistance,
        userLocation: { 
          latitude: userLat, 
          longitude: userLng 
        },
        totalClinics: filteredClinics.length,
        pagination: {
          page,
          limit,
          hasMore: filteredClinics.length === limit
        }
      });
    }

    // If no location provided, return all clinics
    return res.send({
      success: 1,
      message: "All Clinics fetched successfully",
      details: clinics,
      totalClinics: clinics.length,
      pagination: {
        page,
        limit,
        hasMore: clinics.length === limit
      }
    });

  } catch (error) {
    console.error('Error in getAllClinic API:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};
// userClinic/getClinic
const getClinic = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    // Check if location is provided
    const hasUserLocation = latitude && longitude && 
                          !isNaN(parseFloat(latitude)) && 
                          !isNaN(parseFloat(longitude));

    // सभी क्लिनिक fetch करें (Specialists को populate करते हुए)
    // हमने $geoNear हटा दिया है ताकि हम JS में खुद कैलकुलेट कर सकें
    const allClinics = await Clinic.aggregate([
      {
        $lookup: {
          from: "specialists",
          localField: "SpecialistsId",
          foreignField: "_id",
          as: "SpecialistsId",
        },
      }
    ]);

    if (hasUserLocation) {
      const userLat = parseFloat(latitude);
      const userLng = parseFloat(longitude);

      // Map through clinics and calculate distance
      const clinicsWithDistance = allClinics.map((clinic) => {
        try {
          // Check if clinic has valid coordinates
          // MongoDB GeoJSON format usually is coordinates: [lng, lat]
          if (!clinic.location || 
              !clinic.location.coordinates || 
              clinic.location.coordinates.length !== 2) {
            return {
              ...clinic,
              distance: {
                value: null,
                text: "Location unavailable",
                status: 'NO_LOCATION'
              }
            };
          }

          const clinicLng = parseFloat(clinic.location.coordinates[0]);
          const clinicLat = parseFloat(clinic.location.coordinates[1]);

          // Validate coordinates
          if (isNaN(clinicLat) || isNaN(clinicLng)) {
            return {
              ...clinic,
              distance: {
                value: null,
                text: "Invalid Coordinates",
                status: 'ERROR'
              }
            };
          }

          // DIRECT CALCULATION: Straight Line only
          const distanceValue = calculateStraightLineDistance(
            userLat,
            userLng,
            clinicLat,
            clinicLng
          );

          return {
            ...clinic,
            distance: {
              value: distanceValue,
              text: `${distanceValue.toFixed(1)} km`,
              duration: null,
              durationText: null,
              calculationMethod: 'STRAIGHT_LINE',
              status: 'OK'
            }
          };

        } catch (error) {
          console.error(`Error calculating distance for clinic ${clinic._id}:`, error);
          return {
            ...clinic,
            distance: {
              value: null,
              text: "Calculation Error",
              status: 'ERROR'
            }
          };
        }
      });

      // Sort by distance (nearest first)
      clinicsWithDistance.sort((a, b) => {
        const aDist = a.distance?.value ?? 999999;
        const bDist = b.distance?.value ?? 999999;
        return aDist - bDist;
      });

      return res.send({
        success: 1,
        message: "Clinics fetched successfully with distances",
        details: clinicsWithDistance,
        userLocation: { latitude: userLat, longitude: userLng }
      });

    } else {
      // No location provided - fetch all clinics without distance
      return res.send({
        success: 1,
        message: "All clinic data with specialists",
        details: allClinics.map(clinic => ({
          ...clinic,
          distance: null
        })),
        note: "Provide latitude and longitude query parameters to get distances"
      });
    }
  } catch (error) {
    console.error("Error in getClinic API:", error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

const getuserclinic = async (req, res) => {
  try {
    const clinics = await Clinic.aggregate([
      {
        $lookup: {
          from: "specialists", // your collection name in MongoDB
          localField: "SpecialistsId",
          foreignField: "_id",
          as: "SpecialistsId",
        },
      },
      {
        $addFields: {
          distance: null,
        },
      },
    ]);

    return res.send({
      success: 1,
      message: "All clinic data with specialists",
      details: clinics,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// userClinic/getDoctor
const getDoctor = async (req, res) => {
  try {
    const userId = req.user._id; 
    const { clinicId } = req.query; 

    if (!clinicId) {
      return res
        .status(400)
        .json({ success: 0, message: "Clinic ID is required in query" });
    }

    const doctors = await Doctor.find({ ClinicId: clinicId }).populate({
      path: "ConsultationFeesId",
      select: "onlineFees offlineFees", 
    });

    return res.json({
      success: 1,
      message: "Doctors fetched successfully",
      userId: userId, 
      clinicId: clinicId, 
      details: doctors,
    });
  } catch (error) {
    return res.status(500).json({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = { getClinic, getDoctor, getuserclinic, getAllClinic };