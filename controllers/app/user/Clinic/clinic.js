const Clinic = require("../../../../modal/clinic");
const Doctor = require("../../../../modal/docter");

//     userClinic/getClinic

const getClinic = async (req, res) => {
  try {
    const data = await Clinic.find()
      .populate({
        path: "SpecialistsId",
        select: "specialists", // Only return 'name' field along with _id
      });

    return res.send({
      success: 1,
      message: "All clinic data with specialists",
      details: data,
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
    const userId = req.user._id; // 🧑 Token se user ID
    const { clinicId } = req.query; // 🏥 Query params se clinic ID

    if (!clinicId) {
      return res
        .status(400)
        .json({ success: 0, message: "Clinic ID is required in query" });
    }

    // ✅ Doctors find karo jinke ClinicId match karta ho
    const doctors = await Doctor.find({ ClinicId: clinicId }).populate({
      path: "ConsultationFeesId",
      select: "onlineFees offlineFees", 
      // (MongoDB always includes _id by default, so you’ll get _id + these fields)
    });

    return res.json({
      success: 1,
      message: "Doctors fetched successfully",
      userId: userId, // token se
      clinicId: clinicId, // query se
      details: doctors,
    });
  } catch (error) {
    return res.status(500).json({
      success: 0,
      message: error.message,
    });
  }
};





module.exports = {getClinic,getDoctor}

