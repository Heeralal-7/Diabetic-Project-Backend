const Admin = require("../../modal/adminlogin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Vendor = require("../../modal/vandor")

const genrateToken = (id) => {
  return jwt.sign({ id }, process.env.SECRETKEY);
};

// Register Admin
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.send({
        success: 0,
        message: "Invalid credentials...",
      });
    }

    // Check user exists or not
    const checkUser = await Admin.findOne({ email });
    if (checkUser) {
      return res.send({
        success: 0,
        message: "Invalid credentials...",
      });
    }

    // Hashing the password
    const salt = await bcrypt.genSalt(10);
    const hashPass = await bcrypt.hash(password, salt);

    // Create Admin
    const newAdmin = await Admin.create({
      name,
      email,
      password: hashPass,
      image: req.file ? `/admin/profileImage/${req.file.filename}`: "",
    });
    return res.send({
      success: 1,
      message: "Admin created successfully...",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Login Admin
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.send({
        success: 0,
        message: "Invalid credentials...",
      });
    }
    // Check user exists or not
    let checkUser = await Admin.findOne({ email });
    if (!checkUser) {
      return res.send({
        success: 0,
        message: "Invalid credentials...",
      });
    }

    if (checkUser && (await bcrypt.compare(password, checkUser.password))) {
      const updateAdmin = await checkUser.updateOne(
        {
          token: genrateToken(checkUser._id),
        },
        { new: true }
      );
      const { token } = checkUser;
      return res.send({
        success: 1,
        message: "Admin Logged in successfully",
        details: {
          token,
        },
      });
    } else {
      return res.send({
        success: 0,
        message: "Unauthorized",
      });
    }
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

const getAdmin = async (req, res) => {
  try {
    const data = await Admin.findOne({ _id: req.user._id });
    if (!data) {
      return res.send({
        success: 0,
        message: "Invalid credentials...",
      });
    }
    return res.send({
      success: 1,
      message: "Admin details get successfully",
      details: data,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Update admin
//Methods:Patch
//Endpoints:admin/edit/id
const updateAdmin = async(req,res)=>{
   try {
    const {name , email}= req.body
    

    const user = await Admin.findById(req.user._id)

    if(!user){
      return res.send({
        success:0,
        message:'No user found'
      })
    }
    const data = await Admin.findByIdAndUpdate(req.user._id,{
       name,
       email,
       image: req.file ? `/admin/profileImage/${req.file.filename}`: user.image
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

//change password
//Method:Patch
//Endpoints:admin/change
const changePassword = async(req,res)=>{
  try {
    const {oldPassword , newPassword , confirmPassword} = req.body
    if(!oldPassword || !newPassword || !confirmPassword){
      return res.send({
        success:0,
        message:'All fields are required'
      })
    }
    
    const user = await Admin.findById(req.user._id)
    if(!user){
      return res.send({
        success:0,
        message:'User is not authenticated'
      })
    }

    const pass = await bcrypt.compare(oldPassword, user.password)
    if(!pass){
      return res.send({
        success:0,
        message:'Old password is incorrect'
      })
    }

    if(+newPassword !== +confirmPassword){
      return res.send({
        success:0,
        message:'Confirm password is not matched'
      })
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save(); 

    return res.send({
      success:1,
      message:'Password changed successfully'
    })
  } catch (error) {
    return res.send({
      success:0,
      message:error.message
    })
  }
}

const updateimage = async (req, res) => {
  try {
    // Extract image filename from the request
    const imageFilename = req.file ? req.file.filename : null;
    
    // Ensure imageFilename is available
    if (!imageFilename) {
      return res.status(400).send({
        success: 0,
        message: 'No image file provided'
      });
    }

    // Construct the image path
    const imagePath = `/admin/profileImage/${imageFilename}`;

    // Update all records with the new image path
    const result = await Admin.updateMany(
      {}, // Update all records
      { $set: { image: imagePath } } // Update the image field
    );

    // Send a success response
    return res.send({
      success: 1,
      message: 'Updated',
  
    });
  } catch (error) {
    // Handle errors
    return res.status(500).send({
      success: 0,
      message: error.message
    });
  }
};

//Change vendor status
//Method: Patch
//Endpoints:admin/status/id
const changevendorStatus =async(req,res)=>{
  try {
    const {id} = req.params
    const {isActive} = req.body
    const data = await Vendor.findByIdAndUpdate(id,{
      isActive
    },{new:true})

    return res.send({
      success:1,
      message:'Status changed successfully',
      details:data
    })
    
  } catch (error) {
    return res.send({
      success:0,
      message:error.message
    })
  }
}




module.exports = {
  registerAdmin,
  loginAdmin,
  getAdmin,
  updateimage,
  updateAdmin,
  changePassword,
  changevendorStatus
};
