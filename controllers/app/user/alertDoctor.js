const AlertDoctor = require("../../../modal/alertDoctor");


//Create alert doctor
//Method:Post
//Endpoint:tag/create
const alertDoctor = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const doctor = await AlertDoctor.create({
      name,
      phone,
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


//Update alert doctor
//Method:Patch
//Endpoint:/tag/update/id
const updateAlertDoctor = async(req,res)=>{
  try {
    const {id} = req.params
    const {name,phone} = req.body
    const data = await AlertDoctor.findByIdAndUpdate(id,{
      name,
      phone
    },{new:true})

    return res.send({
        success:1,
        message:'Updated successfully'
     })
  } catch (error) {
    return res.send({
      success:0,
      message:error.message
    })
  }
}

//Get alert doctor
//Method:Get
//Endpoint:/tag/get
const getDoctor = async(req,res)=>{
  try {
    const doctor = await AlertDoctor.find({userId:req.user._id})

    return res.send({
      success:1,
      message:'Fetched successfully',
      data:doctor
    })
  } catch (error) {
    return res.send({
      success:0,
      message:error.message
    })
  }
}


//Delete alert doctor
//Method:Delete
//Endpoint:/tag/delete/id
const deleteAlertDoctor = async(req,res)=>{
  try {
    const {id} = req.params
    const doctor = await AlertDoctor.findByIdAndDelete(id)

    return res.send({
         success:1,
         message:"Deleted successfully"
     })
  } catch (error) {
    return res.send({
      success:0,
      message:error.message
    })
  }
}

module.exports = { alertDoctor, updateAlertDoctor, getDoctor, deleteAlertDoctor };
