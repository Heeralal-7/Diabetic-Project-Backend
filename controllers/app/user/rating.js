const Rating = require("../../../modal/rating");
const Doctor = require("../../../modal/docter")
const Clinic = require("../../../modal/clinic")
const Vendor = require("../../../modal/vandor")
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
 
// Get ratings by doctor, clinic, or vendor ID
// Method: GET
// EndPoint: /user-rating/getratings
// Query params: doctorId, vendorId, ClinicId (any one of them)
const getRatings = async (req, res) => {
  try {
    const { doctorId, vendorId, ClinicId } = req.query;
 
    // Validate that only one ID is provided
    const idCount = [doctorId, vendorId, ClinicId].filter(Boolean).length;
    if (idCount === 0) {
      return res.status(400).json({
        success: 0,
        message: "Please provide either doctorId, vendorId, or ClinicId"
      });
    }
    if (idCount > 1) {
      return res.status(400).json({
        success: 0,
        message: "Please provide only one ID (doctorId, vendorId, or ClinicId)"
      });
    }
 
    // Build query based on provided ID
    let query = {};
    let populateFields = "userId";
    let targetModel, targetId, targetName;
 
    if (doctorId) {
      query.doctorId = doctorId;
      targetModel = Doctor;
      targetId = doctorId;
      targetName = "doctor";
      populateFields += " doctorId";
    } else if (vendorId) {
      query.vendorId = vendorId;
      targetModel = Vendor;
      targetId = vendorId;
      targetName = "vendor";
      populateFields += " vendorId";
    } else if (ClinicId) {
      query.ClinicId = ClinicId;
      targetModel = Clinic;
      targetId = ClinicId;
      targetName = "clinic";
      populateFields += " ClinicId";
    }
 
    // Get target details
    const targetDetails = await targetModel.findById(targetId);
    if (!targetDetails) {
      return res.status(404).json({
        success: 0,
        message: `${targetName} not found`
      });
    }
 
    // Get all ratings for the target
    const ratings = await Rating.find(query)
      .populate(populateFields)
      .sort({ createdAt: -1 });
 
    // Calculate rating statistics
    let totalRatings = ratings.length;
    let averageRating = 0;
    let starCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
 
    if (totalRatings > 0) {
      const ratingSum = ratings.reduce((sum, rating) => {
        const ratingValue = parseFloat(rating.rating);
        const roundedRating = Math.round(ratingValue);
       
        if (starCount[roundedRating] !== undefined) {
          starCount[roundedRating] += 1;
        }
       
        return sum + ratingValue;
      }, 0);
     
      averageRating = (ratingSum / totalRatings).toFixed(1);
    }
 
    // Prepare response
    const response = {
      success: 1,
      message: `Ratings fetched successfully for ${targetName}`,
      data: {
        targetDetails: {
          id: targetDetails._id,
          name: targetDetails.name || targetDetails.labName || targetDetails.business || "N/A",
          type: targetName
        },
        ratingStatistics: {
          totalRatings,
          averageRating,
          starBreakdown: starCount
        },
        ratings: ratings.map(rating => ({
          _id: rating._id,
          rating: rating.rating,
          description: rating.description,
          user: rating.userId ? {
            _id: rating.userId._id,
            name: rating.userId.name || "Anonymous"
          } : null,
          createdAt: rating.createdAt,
          updatedAt: rating.updatedAt
        }))
      }
    };
 
    return res.status(200).json(response);
 
  } catch (error) {
    console.error("getRatings error:", error);
    return res.status(500).json({
      success: 0,
      message: error.message
    });
  }
};
 
// Alternative version with pagination
// Method: GET
// EndPoint: /user-rating/getratings-paginated
const getRatingsPaginated = async (req, res) => {
  try {
    const { doctorId, vendorId, ClinicId, page = 1, limit = 10 } = req.query;
 
    // Validate that only one ID is provided
    const idCount = [doctorId, vendorId, ClinicId].filter(Boolean).length;
    if (idCount === 0) {
      return res.status(400).json({
        success: 0,
        message: "Please provide either doctorId, vendorId, or ClinicId"
      });
    }
    if (idCount > 1) {
      return res.status(400).json({
        success: 0,
        message: "Please provide only one ID (doctorId, vendorId, or ClinicId)"
      });
    }
 
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;
 
    // Build query
    let query = {};
    let targetModel, targetId, targetName;
 
    if (doctorId) {
      query.doctorId = doctorId;
      targetModel = Doctor;
      targetId = doctorId;
      targetName = "doctor";
    } else if (vendorId) {
      query.vendorId = vendorId;
      targetModel = Vendor;
      targetId = vendorId;
      targetName = "vendor";
    } else if (ClinicId) {
      query.ClinicId = ClinicId;
      targetModel = Clinic;
      targetId = ClinicId;
      targetName = "clinic";
    }
 
    // Get target details
    const targetDetails = await targetModel.findById(targetId);
    if (!targetDetails) {
      return res.status(404).json({
        success: 0,
        message: `${targetName} not found`
      });
    }
 
    // Get ratings with pagination
    const [ratings, totalRatings] = await Promise.all([
      Rating.find(query)
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      Rating.countDocuments(query)
    ]);
 
    // Calculate statistics
    let averageRating = 0;
    let starCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
 
    if (totalRatings > 0) {
      const allRatings = await Rating.find(query);
      const ratingSum = allRatings.reduce((sum, rating) => {
        const ratingValue = parseFloat(rating.rating);
        const roundedRating = Math.round(ratingValue);
       
        if (starCount[roundedRating] !== undefined) {
          starCount[roundedRating] += 1;
        }
       
        return sum + ratingValue;
      }, 0);
     
      averageRating = (ratingSum / totalRatings).toFixed(1);
    }
 
    const response = {
      success: 1,
      message: `Ratings fetched successfully for ${targetName}`,
      data: {
        targetDetails: {
          id: targetDetails._id,
          name: targetDetails.name || targetDetails.labName || targetDetails.business || "N/A",
          type: targetName
        },
        ratingStatistics: {
          totalRatings,
          averageRating,
          starBreakdown: starCount
        },
        ratings: ratings.map(rating => ({
          _id: rating._id,
          rating: rating.rating,
          description: rating.description,
          user: rating.userId ? {
            _id: rating.userId._id,
            name: rating.userId.name || "Anonymous"
          } : null,
          createdAt: rating.createdAt
        })),
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(totalRatings / pageSize),
          totalItems: totalRatings,
          itemsPerPage: pageSize
        }
      }
    };
 
    return res.status(200).json(response);
 
  } catch (error) {
    console.error("getRatingsPaginated error:", error);
    return res.status(500).json({
      success: 0,
      message: error.message
    });
  }
};
 
// 🆕 NEW API: Update Rating
// Method: PUT
  // EndPoint: /user-rating/edit/:ratingId
  const updateRating = async (req, res) => {
    try {
      const { ratingId } = req.params;
      const { rating, description } = req.body;
      const userId = req.user._id;
 
      // 1️⃣ Check if rating or description is provided
      if (rating == null && description == null) {
        return res.status(400).json({
          success: 0,
          message: "Please provide rating or description to update.",
        });
      }
 
      // 2️⃣ Validate rating range if rating is provided
      if (rating != null && (rating < 0 || rating > 5)) {
        return res.status(400).json({
          success: 0,
          message: "Please enter a rating between 0 and 5",
        });
      }
 
      // 3️⃣ Find the existing rating and ensure it belongs to the current user
      const existingRating = await Rating.findOne({ _id: ratingId, userId });
 
      if (!existingRating) {
        return res.status(404).json({
          success: 0,
          message: "Rating not found or you are not authorized to update it.",
        });
      }
 
      // 4️⃣ Update the fields
      existingRating.rating = rating !== null && rating !== undefined ? rating : existingRating.rating;
      existingRating.description = description !== null && description !== undefined ? description : existingRating.description;
 
      await existingRating.save();
 
      // 5️⃣ Respond
      return res.status(200).json({
        success: 1,
        message: "Rating updated successfully",
        details: existingRating,
      });
    } catch (error) {
      console.error("updateRating error:", error);
      return res.status(500).json({
        success: 0,
        message: error.message,
      });
    }
  };
 
// 🆕 NEW API: Delete Rating
// Method: DELETE
// EndPoint: /user-rating/delete/:ratingId
const deleteRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const userId = req.user._id;
 
    // 1️⃣ Find and delete the rating, ensuring it belongs to the current user
    const deletedRating = await Rating.findOneAndDelete({ _id: ratingId, userId });
 
    if (!deletedRating) {
      return res.status(404).json({
        success: 0,
        message: "Rating not found or you are not authorized to delete it.",
      });
    }
 
    // 2️⃣ Respond
    return res.status(200).json({
      success: 1,
      message: "Rating deleted successfully",
      details: deletedRating,
    });
  } catch (error) {
    console.error("deleteRating error:", error);
    return res.status(500).json({
      success: 0,
      message: error.message,
    });
  }
};
 
 
 
 
module.exports = { createRating,gettoprated,getRatings,getRatingsPaginated,updateRating, deleteRating };
 
 