const ConsultationFees = require("../../../modal/ConsultationFees");
const Doctor = require("../../../modal/docter");

// Create fees
// Method:Post
// EndPoint: /fees/create
const createFees = async (req, res) => {
  try {
    const { onlineFees, offlineFees } = req.body;
    const doctorId = req.user._id;

    // 1) Check if doctor exists (based on token)
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.send({
        success: 0,
        message: "Doctor is not authenticated",
      });
    }

    // 2) Check if fees already exist for this doctor
    const existingFees = await ConsultationFees.findOne({ doctorId });
    if (existingFees) {
      return res.send({
        success: 0,
        message:
          "You have already created charges. Please delete the existing one to create new.",
      });
    }

    // 3) Create new ConsultationFees document
    const createdFees = await ConsultationFees.create({
      onlineFees,
      offlineFees,
      doctorId,
    });

    // 4) Now update the Doctor document so that ConsultationFeesId points to the newly created document
    doctor.ConsultationFeesId = createdFees._id;
    await doctor.save();

    return res.send({
      success: 1,
      message: "Fees created and linked to doctor successfully",
      data: createdFees,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};
  
// Get fees
// Method:Get
// EndPoint: /fees/get
const getFees = async (req, res) => {
  try {
    const docter = await ConsultationFees.find({
      $and: [{ doctorId: req.user._id }, { status: "0" }],
    });
    if (!docter) {
      return res.send({
        success: 0,
        message: "Doctor is not authenticated",
      });
    }

    return res.send({
      success: 1,
      message: "Fetched successfully",
      details: docter,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Update fees
// Method:Patch
// EndPoint: /fees/update
const updateFees = async (req, res) => {
  try {
    const { id } = req.params;
    const { onlineFees, offlineFees,  } = req.body;

    // Check if the doctor is authenticated
    const doctor = await Doctor.findById(req.user._id);
    if (!doctor) {
      return res.send({
        success: 0,
        message: "Doctor is not authenticated",
      });
    }

    // Create an update object with the fields that need to be updated
    const updateFields = {};

    if (onlineFees) {
      updateFields.onlineFees = onlineFees;
    }

    if (offlineFees) {
      updateFields.offlineFees = offlineFees;
    }

    // Update the ConsultationFees document with the filtered fields
    await ConsultationFees.findByIdAndUpdate(id, updateFields, { new: true });

    return res.send({
      success: 1,
      message: "Updated successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Delete fees
// Method:delete
// EndPoint: /fees/delete
const deleteFees = async (req, res) => {
  try {
    const { id } = req.params;
    const docter = await Doctor.findById({ _id: req.user._id });
    if (!docter) {
      return res.send({
        success: 0,
        message: "Doctor is not authenticated",
      });
    }

    await ConsultationFees.findByIdAndDelete(id);

    return res.send({
      success: 1,
      message: "Deleted successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = { createFees, getFees, updateFees, deleteFees };
