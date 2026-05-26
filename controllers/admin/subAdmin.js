const SubAdmin = require("../../modal/subAdmin");
const Location = require("../../modal/location");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.SECRETKEY);
};

// Create Sub-Admin - UPDATED WITH NEW PERMISSIONS STRUCTURE
const createSubAdmin = async (req, res) => {
  try {
    let { 
      name, 
      email, 
      password, 
      permissions, 
      locationAccess 
    } = req.body;

    console.log('Received data:', req.body);

    // Parse permissions and locationAccess if they are strings (from FormData)
    if (permissions && typeof permissions === 'string') {
      try {
        permissions = JSON.parse(permissions);
      } catch (error) {
        console.error('Error parsing permissions:', error);
        return res.send({
          success: 0,
          message: "Invalid permissions format",
        });
      }
    }

    if (locationAccess && typeof locationAccess === 'string') {
      try {
        locationAccess = JSON.parse(locationAccess);
      } catch (error) {
        console.error('Error parsing locationAccess:', error);
        return res.send({
          success: 0,
          message: "Invalid locationAccess format",
        });
      }
    }

    // Validation
    if (!name || !email || !password) {
      return res.send({
        success: 0,
        message: "Name, email and password are required",
      });
    }

    // Trim inputs
    name = name.trim();
    email = email.trim();

    // Check if sub-admin already exists
    const existingSubAdmin = await SubAdmin.findOne({ email });
    if (existingSubAdmin) {
      return res.send({
        success: 0,
        message: "Sub-admin with this email already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashPass = await bcrypt.hash(password, salt);

    // ✅ UPDATED PERMISSIONS STRUCTURE WITH VENDOR TYPE SUPPORT
    const defaultPermissions = {
      vendors: {
        lab: { view: false, create: false, edit: false, delete: false },
        pharmacy: { view: false, create: false, edit: false, delete: false },
        food: { view: false, create: false, edit: false, delete: false }
      },
      clinics: { view: false, create: false, edit: false, delete: false },
      doctors: { view: false, create: false, edit: false, delete: false },
      users: { view: false, create: false, edit: false, delete: false }
    };

    // ✅ MERGE PROVIDED PERMISSIONS WITH DEFAULT STRUCTURE
    const finalPermissions = permissions ? mergePermissions(defaultPermissions, permissions) : defaultPermissions;

    // Create sub-admin
    const newSubAdmin = await SubAdmin.create({
      name,
      email,
      password: hashPass,
      permissions: finalPermissions,
      locationAccess: locationAccess || {
        countries: [],
        states: [],
        cities: []
      },
      image: req.file ? `/subadmin/profileImage/${req.file.filename}` : "",
      createdBy: req.user._id
    });

    return res.send({
      success: 1,
      message: "Sub-admin created successfully",
      data: {
        id: newSubAdmin._id,
        name: newSubAdmin.name,
        email: newSubAdmin.email,
        permissions: newSubAdmin.permissions,
        locationAccess: newSubAdmin.locationAccess
      }
    });
  } catch (error) {
    console.error('Create sub-admin error:', error);
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ HELPER FUNCTION TO MERGE PERMISSIONS
const mergePermissions = (defaultPerms, providedPerms) => {
  const merged = JSON.parse(JSON.stringify(defaultPerms));
  
  // Merge vendors permissions
  if (providedPerms.vendors) {
    if (providedPerms.vendors.lab) {
      merged.vendors.lab = { ...merged.vendors.lab, ...providedPerms.vendors.lab };
    }
    if (providedPerms.vendors.pharmacy) {
      merged.vendors.pharmacy = { ...merged.vendors.pharmacy, ...providedPerms.vendors.pharmacy };
    }
    if (providedPerms.vendors.food) {
      merged.vendors.food = { ...merged.vendors.food, ...providedPerms.vendors.food };
    }
  }
  
  // Merge other modules
  if (providedPerms.clinics) {
    merged.clinics = { ...merged.clinics, ...providedPerms.clinics };
  }
  if (providedPerms.doctors) {
    merged.doctors = { ...merged.doctors, ...providedPerms.doctors };
  }
  if (providedPerms.users) {
    merged.users = { ...merged.users, ...providedPerms.users };
  }
  
  return merged;
};

// Get All Sub-Admins - NO CHANGES NEEDED
const getAllSubAdmins = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const subAdmins = await SubAdmin.find(query)
      .select("-password")
      .populate("createdBy", "name email")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await SubAdmin.countDocuments(query);

    return res.send({
      success: 1,
      message: "Sub-admins fetched successfully",
      data: {
        subAdmins,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Get Sub-Admin by ID - NO CHANGES NEEDED
const getSubAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const subAdmin = await SubAdmin.findById(id)
      .select("-password")
      .populate("createdBy", "name email");

    if (!subAdmin) {
      return res.send({
        success: 0,
        message: "Sub-admin not found",
      });
    }

    return res.send({
      success: 1,
      message: "Sub-admin details fetched successfully",
      data: subAdmin
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Update Sub-Admin Permissions - UPDATED WITH NEW STRUCTURE
const updateSubAdminPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions, locationAccess } = req.body;

    const subAdmin = await SubAdmin.findById(id);
    if (!subAdmin) {
      return res.send({
        success: 0,
        message: "Sub-admin not found",
      });
    }

    // ✅ VALIDATE AND MERGE PERMISSIONS
    let finalPermissions = subAdmin.permissions;
    if (permissions) {
      finalPermissions = mergePermissions(subAdmin.permissions, permissions);
    }

    const updatedSubAdmin = await SubAdmin.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(permissions && { permissions: finalPermissions }),
          ...(locationAccess && { locationAccess })
        }
      },
      { new: true }
    ).select("-password");

    return res.send({
      success: 1,
      message: "Sub-admin permissions updated successfully",
      data: updatedSubAdmin
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Update Sub-Admin Status - NO CHANGES NEEDED
const updateSubAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const subAdmin = await SubAdmin.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select("-password");

    if (!subAdmin) {
      return res.send({
        success: 0,
        message: "Sub-admin not found",
      });
    }

    return res.send({
      success: 1,
      message: `Sub-admin ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: subAdmin
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Delete Sub-Admin - NO CHANGES NEEDED
const deleteSubAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const subAdmin = await SubAdmin.findByIdAndDelete(id);
    if (!subAdmin) {
      return res.send({
        success: 0,
        message: "Sub-admin not found",
      });
    }

    return res.send({
      success: 1,
      message: "Sub-admin deleted successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Sub-Admin Login - NO CHANGES NEEDED
const loginSubAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.send({
        success: 0,
        message: "Email and password are required",
      });
    }

    const subAdmin = await SubAdmin.findOne({ email });
    if (!subAdmin || !subAdmin.isActive) {
      return res.send({
        success: 0,
        message: "Invalid credentials or account inactive",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, subAdmin.password);
    if (!isPasswordValid) {
      return res.send({
        success: 0,
        message: "Invalid credentials",
      });
    }

    // Update token
    const token = generateToken(subAdmin._id);
    await SubAdmin.findByIdAndUpdate(subAdmin._id, { token });

    return res.send({
      success: 1,
      message: "Login successful",
      data: {
        token,
        subAdmin: {
          id: subAdmin._id,
          name: subAdmin.name,
          email: subAdmin.email,
          permissions: subAdmin.permissions,
          locationAccess: subAdmin.locationAccess
        }
      }
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = {
  createSubAdmin,
  getAllSubAdmins,
  getSubAdminById,
  updateSubAdminPermissions,
  updateSubAdminStatus,
  deleteSubAdmin,
  loginSubAdmin
};