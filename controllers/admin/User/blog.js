const Admin = require("../../../modal/adminlogin");
const MainForm = require("../../../modal/mainForm");
const Subheading = require("../../../modal/subheading");

//Create blog by admin
//Method:Post
//Endpoint:/admin-blog/create-blog
const blog = async (req, res) => {
  try {
    const { title, description, created_by, type, conclusion } = req.body;
    if(!title || !description || !created_by || !type || !conclusion){
      return res.send({
        success:0,
        message:'All fields are mandatory' 
      })
    }

    const admin = await Admin.findById(req.user._id);
    if (!admin) {
      return res.send({
        success: 0,
        message: "Admin not authorized",
      });
    }
    const blog = await MainForm.create({
      title,
      description,
      created_by,
      type,
      conclusion,
      blogimage: req.file && `/admin/blogimage/${req.file.filename}`,
    });

    return res.send({
      success: 1,
      message: "created successfully",
      _id: blog._id,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Create subheadingblog by admin
//Method:Post
//Endpoint:/admin-blog/add-subheading
const createsubheading = async (req, res) => {
  try {
    const { title, description, mainFormId } = req.body;

  

    // Check if the admin is authorized
    const admin = await Admin.findById(req.user._id);
    if (!admin) {
      return res.send({
        success: 0,
        message: "Admin is not authorized",
      });
    }

    // Check if the Mainform exists
    const mainForm = await MainForm.findById(mainFormId);
    if (!mainForm) {
      return res.send({
        success: 0,
        message: "Mainform not found",
      });
    }

    let val = [...mainForm.subheadingId];

    // Create a new subheading
    const newSubheading = await Subheading.create({
      title,
      description,
      mainFormId,
    });

    await val.push(newSubheading._id);

    await MainForm.findByIdAndUpdate(
      mainFormId,
      { subheadingId: val },
      { new: true }
    );

    return res.send({
      success: 1,
      message: "Subheading added successfully",
      data: newSubheading,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Get admin blog
//Method:Get
//Endpoint:/admin-blog/getadminblog
const getBlog = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;
    const data = await MainForm.aggregate([
      {
        $match: {},
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);

    const totlalength = await MainForm.countDocuments();
    const pages = Math.ceil(totlalength / limit);
    return res.send({
      success: 1,
      message: "Fetched",
      pages,
      details: data,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Search admin blog
//Method:Get
//Endpoint:/admin-blog/search-blog?q
const searchUserBlog = async (req, res) => {
  try {
    const { q } = req.query;
    let query = {};
    if (q) {
      const regex = new RegExp(q, "i");
      query = {
        $or: [
          { title: { $regex: regex } },
          { description: { $regex: regex } },
          { type: { $regex: regex } },
          { conclusion: { $regex: regex } },
          { created_by: { $regex: regex } },
        ],
      };
    }
    const search = await MainForm.find(query);

    if (!search) {
      return res.send({
        success: 0,
        message: "No result found",
      });
    }
    return res.send({
      success: 1,
      message: "Results fetched successfully",
      details: search,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//get particulat blog
//Method:Get
//Endpoint: /admin-blog/get-blog/id
const getParticularBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await MainForm.findById(id).populate("subheadingId");
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

//delete particular blog
//Method:Delete
//Endpoint:admin-blog/delete-blog/id

const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await MainForm.findByIdAndDelete(id);
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

//Update particular blog
//Method:Patch
//Endpoint:/admin-blog/update-blog/id

const updateBlog = async (req, res) => {
  try {
    const { title, description, created_by, type, conclusion } = req.body;

    const { id } = req.params;

    const user = await Admin.findById(req.user._id);
    if (!user) {
      return res.send({
        success: 0,
        message: "Admin not found",
      });
    }

    const updateData = await MainForm.findByIdAndUpdate(
      id,
      {
        title: title || user.title,
        description: description || user.description,
        created_by: created_by || user.created_by,
        type: type || user.type,
        conclusion: conclusion || user.conclusion,
        blogimage:
          (req.file && `/admin/blogimage/${req.file.filename}`) ||
          user.blogimage,
      },
      { new: true }
    );

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

//Update subheading blog
//Method:Patch
//Endpoint:/admin-blog/update-subheading/id
const updateSubheading = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, mainFormId } = req.body;

    const data = await Subheading.findByIdAndUpdate(
      id,
      {
        title,
        description,
        mainFormId,
      },
      { new: true }
    );

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

//Get subheading
//Method:Get
//Endpoint:/admin-blog/get/id
const getSubheading = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await MainForm.findById(id).populate("subheadingId");
    return res.send({
      success: 1,
      details: blog.subheadingId,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Delete subheading
//Method:Delete
//Endpoint:/admin-blog/remove/id
const deleteSubheading = async (req, res) => {
  try {
    const { mainFormId, subheadingId } = req.params;

    // Validate if `subheadingId` is a valid MongoDB ObjectId
   
    // Find the MainForm document
    const mainForm = await MainForm.findById(mainFormId);

    if (!mainForm) {
      return res.status(404).send({
        success: 0,
        message: "MainForm not found",
      });
    }

    // Check if the subheadingId exists in the MainForm's subheadingId array
    if (!mainForm.subheadingId.includes(subheadingId)) {
      return res.status(404).send({
        success: 0,
        message: "Subheading not found in MainForm",
      });
    }

    // Remove the subheading ID from the MainForm document
    mainForm.subheadingId = mainForm.subheadingId.filter(id => id.toString() !== subheadingId);
    await mainForm.save();

    // Delete the Subheading document
    const deletedSubheading = await Subheading.findByIdAndDelete(subheadingId);

    if (!deletedSubheading) {
      return res.status(404).send({
        success: 0,
        message: "Subheading not found",
      });
    }

    return res.send({
      success: 1,
      message: "Subheading deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting subheading:", error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};
module.exports = {
  blog,
  createsubheading,
  getBlog,
  searchUserBlog,
  getParticularBlog,
  deleteBlog,
  updateBlog,
  updateSubheading,
  getSubheading,
  deleteSubheading,
};
