const maxLimit= require("../../../modal/distanceLimit");
 
// ==================== EXISTING CODE (UNCHANGED) ====================
// Endpoint: /distance/post-distance-limit
const setDistanceLimit = async (req, res) => {
  try {
    const { doctorLimit, clinicLimit, foodLimit, pharmacyLimit, labLimit } = req.body;
    const limit = new maxLimit({
        doctorLimit,    
        clinicLimit,
        foodLimit,
        pharmacyLimit,
        labLimit,
    });
    await limit.save();
    return res.send({
        success: 1,
        message: "Distance limits set successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,  
        message: error.message,
    });
    }
};
 
// Endpoint: /distance/update-distance-limit/:id
// PUT: update distance limit using id
const updateDistanceLimit = async (req, res) => {
    try {
      const { id } = req.params;
      const { doctorLimit, clinicLimit, foodLimit, pharmacyLimit, labLimit } = req.body;
 
      const limit = await maxLimit.findByIdAndUpdate(
        id,
        { doctorLimit, clinicLimit, foodLimit, pharmacyLimit, labLimit },
        { new: true }
      );
 
      if (!limit) {
        return res.status(404).send({
          success: 0,
          message: "Distance limit not found"
        });
      }
 
      return res.status(200).send({
        success: 1,
        message: "Distance limits updated successfully",
        data: limit
      });
 
    } catch (error) {
      return res.status(500).send({
        success: 0,
        message: error.message
      });
    }
  };
 
// Endpoint: /distance/get-distance-limit
 const getDistanceLimit = async (req, res) => {
    try {
        const limit = await maxLimit.findOne().sort({ createdAt: -1 });
        if (!limit) {
            return res.send({
                success: 0,
                message: "Distance limit not found",
            });
        }
        return res.send({
            success: 1,
            data: limit,
        });
    } catch (error) {
        return res.send({
            success: 0,
            message: error.message,
        });
    }
};
 
module.exports = {
    setDistanceLimit,
    updateDistanceLimit,
    getDistanceLimit,
};
 