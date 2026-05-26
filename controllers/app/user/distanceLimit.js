const maxLimit = require("../../../modal/distanceLimit");
 
// Endpoint: /distance/getUser-distance-limit
 const getUserDistanceLimit = async (req, res) => {
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
   
    getUserDistanceLimit,
   
};
 