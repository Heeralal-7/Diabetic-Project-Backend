const Prescription = require("../../../modal/userprescription");

//user upload prescription for record
//Method:post
//Endpoints:/user-prescription/create-pres
const userPrescription = async (req, res) => {
  try {
    const { type } = req.body;

    const data = await Prescription.create({
      type,
      image: `/user/recordprescription/${req.file.filename}`,
      userId: req.user._id,
    });

    return res.send({
      success: 1,
      message: "Created successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};


//User get the prescription report
//Method:Get
//Endpoints:/user-prescription/get
const getPrescription = async (req, res) => {
  try {
    const userId = req.user._id;
    const data = await Prescription.find({ userId });
    if (!data) {
      return res.send({
        success: 0,
        message: "Data not found",
      });
    }

    return res.send({
      success: 1,
      message: "Fetched successfully",
      details: data,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};



//User delete prescription
//Method:Delete
//Endpoint:/user-prescription/delete/id
const deletePrescription = async(req,res)=>{
  try {
    const {id} = req.params

    const data = await Prescription.findByIdAndDelete(id)

    return res.send({
       success:1,
       message:'Deleted successfully'
    })
  } catch (error) {
    return res.send({
      success:0,
      message:error.message
    })
  }
}

module.exports = { userPrescription, getPrescription, deletePrescription };
