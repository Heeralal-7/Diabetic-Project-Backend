const Contact = require("../../../modal/contactUs");
 
// =============================================
// HELPER FUNCTION FOR PERMISSION CHECKING
// =============================================
const checkContactPermission = (subAdmin, permissionType) => {
  if (!subAdmin) {
    return {
      allowed: false,
      message: "Sub-admin not authenticated"
    };
  }
 
  // Check for contact-specific permissions
  if (subAdmin.permissions?.contact?.[permissionType]) {
    return { allowed: true };
  }
 
  // OR check for general content permissions
  if (subAdmin.permissions?.content?.[permissionType]) {
    return { allowed: true };
  }
 
  // OR check for general users permissions
  if (subAdmin.permissions?.users?.[permissionType]) {
    return { allowed: true };
  }
 
  // OR check for site permissions
  if (subAdmin.permissions?.site?.[permissionType]) {
    return { allowed: true };
  }
 
  return {
    allowed: false,
    message: `No permission to ${permissionType} contact information`
  };
};
 
// =============================================
// POST - ADD CONTACT DETAILS
// Endpoint: /contactUsSub/create-contact
// =============================================
const addContact = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkContactPermission(subAdmin, 'create');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to create contact information"
        });
      }
    }
 
    // Prepare contact data
    const contactData = {
      ...req.body,
      createdBy: subAdmin?._id || req.admin?._id,
      createdByRole: subAdmin ? 'subadmin' : 'admin',
      createdAt: new Date()
    };
 
    // Check if contact already exists
    const existingContact = await Contact.findOne();
    if (existingContact) {
      return res.status(400).json({
        success: false,
        message: "Contact information already exists. Use update instead."
      });
    }
 
    const contact = await Contact.create(contactData);
 
    res.status(201).json({
      success: true,
      message: "Contact information created successfully",
      data: {
        id: contact._id,
        createdBy: contactData.createdBy,
        createdByRole: contactData.createdByRole,
        createdAt: contactData.createdAt
      }
    });
 
  } catch (err) {
    console.error('Add Contact Error:', err);
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};
 
// =============================================
// GET - GET CONTACT DETAILS
// Endpoint: /contactUsSub/get-contact
// =============================================
const getContact = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN (optional - depends on requirement)
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkContactPermission(subAdmin, 'view');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to view contact information"
        });
      }
    }
 
    const contact = await Contact.findOne().select('-createdBy -updatedBy -createdByRole -updatedByRole -__v');
 
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact information not found"
      });
    }
 
    res.json({
      success: true,
      message: "Contact information fetched successfully",
      data: contact,
      userRole: subAdmin ? 'subadmin' : (req.admin ? 'admin' : 'public')
    });
 
  } catch (err) {
    console.error(' Get Contact Error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
 
// =============================================
// PUT - UPDATE CONTACT DETAILS
// Endpoint: /contactUsSub/update-contact
// =============================================
const updateContact = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkContactPermission(subAdmin, 'edit');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to update contact information"
        });
      }
    }
 
    // Prepare update data
    const updateData = {
      ...req.body,
      updatedBy: subAdmin?._id || req.admin?._id,
      updatedByRole: subAdmin ? 'subadmin' : 'admin',
      updatedAt: new Date()
    };
 
    // Check if contact exists
    const existingContact = await Contact.findOne();
    if (!existingContact) {
      return res.status(404).json({
        success: false,
        message: "Contact information not found. Create it first."
      });
    }
 
    const contact = await Contact.findOneAndUpdate(
      {},
      updateData,
      {
        new: true,
        runValidators: true
      }
    );
 
    if (!contact) {
      return res.status(500).json({
        success: false,
        message: "Failed to update contact information"
      });
    }
 
    res.json({
      success: true,
      message: "Contact information updated successfully",
      data: {
        id: contact._id,
        updatedBy: updateData.updatedBy,
        updatedByRole: updateData.updatedByRole,
        updatedAt: updateData.updatedAt,
        updatedFields: Object.keys(req.body)
      }
    });
 
  } catch (err) {
    console.error(' Update Contact Error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
 
module.exports = {
  addContact,
  updateContact,
  getContact
};
 