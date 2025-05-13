const Qualification = require("../../../modal/Qualification")



// Get Qualification
// Method:GET
// EndPoint:/
const getQualification = async (req, res) => {
    try {
        const data = await Qualification.find({})
        return res.send({
            success: 1,
            message: "Fetched successfully",
            details: data
        })
    } catch (error) {
        return res.send({
            success: 0,
            message: error.message
        })
    }
}
module.exports = { getQualification }