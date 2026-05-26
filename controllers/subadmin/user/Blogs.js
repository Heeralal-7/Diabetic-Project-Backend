const Admin = require("../../../modal/adminlogin");
const MainForm = require("../../../modal/mainForm");
const Subheading = require("../../../modal/subheading");

// ----------------------------------------------
// ✅ Subadmin → Create Blog
// ----------------------------------------------
const createBlogSubadmin = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    if (!subAdmin) {
      return res.status(401).send({ success: 0, message: "Sub-admin not authenticated" });
    }

    if (!subAdmin.permissions?.users?.edit) {
      return res.status(403).send({ success: 0, message: "No permission to create blog" });
    }

    const { title, description, created_by, type, conclusion } = req.body;

    if (!title || !description || !created_by || !type || !conclusion) {
      return res.send({ success: 0, message: "All fields are mandatory" });
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
      message: "Blog created successfully",
      _id: blog._id,
    });

  } catch (error) {
    return res.send({ success: 0, message: error.message });
  }
};
 
// ----------------------------------------------
// ✅ Add Subheading
// ----------------------------------------------
const createSubheadingSubadmin = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    if (!subAdmin.permissions?.users?.edit) {
      return res.status(403).send({ success: 0, message: "No permission to add subheading" });
    }

    const { title, description, mainFormId } = req.body;

    const mainForm = await MainForm.findById(mainFormId);
    if (!mainForm) return res.send({ success: 0, message: "Mainform not found" });

    const newSubheading = await Subheading.create({
      title,
      description,
      mainFormId,
    });

    mainForm.subheadingId.push(newSubheading._id);
    await mainForm.save();

    return res.send({
      success: 1,
      message: "Subheading added successfully",
      data: newSubheading,
    });

  } catch (error) {
    return res.send({ success: 0, message: error.message });
  }
};

// ----------------------------------------------
// ✅ Get all blogs (pagination)
// ----------------------------------------------
const getBlogSubadmin = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    if (!subAdmin.permissions?.users?.view) {
      return res.status(403).send({ success: 0, message: "No permission to view blogs" });
    }

    const page = +req.query.page || 1;
    const limit = +req.query.limit || 10;
    const skip = (page - 1) * limit;

    const data = await MainForm.aggregate([
      { $match: {} },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const total = await MainForm.countDocuments();
    const pages = Math.ceil(total / limit);

    return res.send({
      success: 1,
      message: "Fetched",
      pages,
      details: data,
    });

  } catch (error) {
    return res.send({ success: 0, message: error.message });
  }
};

// ----------------------------------------------
// ✅ Search Blogs
// ----------------------------------------------
const searchBlogSubadmin = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    if (!subAdmin.permissions?.users?.view) {
      return res.status(403).send({ success: 0, message: "No permission to search blogs" });
    }

    const { q } = req.query;
    let query = {};

    if (q) {
      const regex = new RegExp(q, "i");
      query = {
        $or: [
          { title: regex },
          { description: regex },
          { type: regex },
          { conclusion: regex },
          { created_by: regex },
        ],
      };
    }

    const search = await MainForm.find(query);

    return res.send({
      success: 1,
      message: "Results fetched successfully",
      details: search,
    });

  } catch (error) {
    return res.send({ success: 0, message: error.message });
  }
};

// ----------------------------------------------
// ✅ Get Single Blog
// ----------------------------------------------
const getParticularBlogSubadmin = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    if (!subAdmin.permissions?.users?.view) {
      return res.status(403).send({ success: 0, message: "No permission to view blog" });
    }

    const { id } = req.params;

    const data = await MainForm.findById(id).populate("subheadingId");

    return res.send({
      success: 1,
      message: "Fetched successfully",
      details: data,
    });

  } catch (error) {
    return res.send({ success: 0, message: error.message });
  }
};

// ----------------------------------------------
// ✅ Delete Blog
// ----------------------------------------------
const deleteBlogSubadmin = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    if (!subAdmin.permissions?.users?.edit) {
      return res.status(403).send({ success: 0, message: "No permission to delete blog" });
    }

    const { id } = req.params;

    await MainForm.findByIdAndDelete(id);

    return res.send({
      success: 1,
      message: "Deleted successfully",
    });

  } catch (error) {
    return res.send({ success: 0, message: error.message });
  }
};

// ----------------------------------------------
// ✅ Update Blog
// ----------------------------------------------
const updateBlogSubadmin = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    if (!subAdmin.permissions?.users?.edit) {
      return res.status(403).send({ success: 0, message: "No permission to update blog" });
    }

    const { id } = req.params;
    const { title, description, created_by, type, conclusion } = req.body;

    const updateData = await MainForm.findByIdAndUpdate(
      id,
      {
        title,
        description,
        created_by,
        type,
        conclusion,
        blogimage:
          req.file && `/subadmin/blogimage/${req.file.filename}`,
      },
      { new: true }
    );

    return res.send({
      success: 1,
      message: "Updated successfully",
      data: updateData,
    });

  } catch (error) {
    return res.send({ success: 0, message: error.message });
  }
};

// ----------------------------------------------
// ✅ Update Subheading
// ----------------------------------------------
const updateSubheadingSubadmin = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    if (!subAdmin.permissions?.users?.edit) {
      return res.status(403).send({ success: 0, message: "No permission to update subheading" });
    }

    const { id } = req.params;
    const { title, description, mainFormId } = req.body;

    await Subheading.findByIdAndUpdate(
      id,
      { title, description, mainFormId },
      { new: true }
    );

    return res.send({
      success: 1,
      message: "Updated successfully",
    });

  } catch (error) {
    return res.send({ success: 0, message: error.message });
  }
};

// ----------------------------------------------
// ✅ Get Subheading List
// ----------------------------------------------
const getSubheadingSubadmin = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    if (!subAdmin.permissions?.users?.view) {
      return res.status(403).send({ success: 0, message: "No permission to view subheadings" });
    }

    const { id } = req.params;

    const blog = await MainForm.findById(id).populate("subheadingId");

    return res.send({
      success: 1,
      details: blog.subheadingId,
    });

  } catch (error) {
    return res.send({ success: 0, message: error.message });
  }
};

// ----------------------------------------------
// ✅ Delete Subheading
// ----------------------------------------------
const deleteSubheadingSubadmin = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    if (!subAdmin.permissions?.users?.edit) {
      return res.status(403).send({ success: 0, message: "No permission to delete subheading" });
    }

    const { mainFormId, subheadingId } = req.params;

    const mainForm = await MainForm.findById(mainFormId);
    if (!mainForm) return res.status(404).send({ success: 0, message: "MainForm not found" });

    mainForm.subheadingId = mainForm.subheadingId.filter(id => id.toString() !== subheadingId);
    await mainForm.save();

    await Subheading.findByIdAndDelete(subheadingId);

    return res.send({
      success: 1,
      message: "Subheading deleted successfully",
    });

  } catch (error) {
    return res.send({ success: 0, message: error.message });
  }
};

module.exports = {
  createBlogSubadmin,
  createSubheadingSubadmin,
  getBlogSubadmin,
  searchBlogSubadmin,
  getParticularBlogSubadmin,
  deleteBlogSubadmin,
  updateBlogSubadmin,
  updateSubheadingSubadmin,
  getSubheadingSubadmin,
  deleteSubheadingSubadmin,
};
