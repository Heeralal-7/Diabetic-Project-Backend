const SiteContent = require("../../../modal/footerContent");

// =============================================
// HELPER FUNCTION FOR PERMISSION CHECKING
// =============================================
const checkFooterPermission = (subAdmin, permissionType) => {
  if (!subAdmin) {
    return {
      allowed: false,
      message: "Sub-admin not authenticated"
    };
  }

  // Check for footer-specific permissions
  if (subAdmin.permissions?.footer?.[permissionType]) {
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
    message: `No permission to ${permissionType} footer content`
  };
};

// ✅ Path normalization function
const normalizePath = (pathString) => {
  if (!pathString || typeof pathString !== 'string') {
    return pathString;
  }
  return pathString.replace(/\\/g, '/');
};

// =============================================
// MULTIPLE BANKS LOGOS FUNCTIONS (SUBADMIN)
// =============================================

// ✅ CREATE Multiple Banks Logo
const createBanksLogo = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkFooterPermission(subAdmin, 'create');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to create bank logos"
        });
      }
    }

    // Check for files array
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one logo image"
      });
    }

    // Get existing content or create new
    let content = await SiteContent.findOne();
    
    if (!content) {
      content = await SiteContent.create({ banksLogos: [] });
    }

    // Add each uploaded file to banksLogos array
    const newLogos = req.files.map((file, index) => ({
      url: normalizePath(file.path),
      name: file.originalname || `Bank Logo ${index + 1}`,
      order: content.banksLogos.length + index,
      isActive: true,
      uploadedAt: new Date(),
      createdBy: subAdmin?._id || req.admin?._id,
      createdByRole: subAdmin ? 'subadmin' : 'admin'
    }));

    // Add new logos to existing array
    content.banksLogos = [...content.banksLogos, ...newLogos];
    await content.save();

    // Prepare response with stringified _id
    const responseLogos = content.banksLogos.map(logo => ({
      ...logo._doc,
      _id: logo._id.toString(),
      url: normalizePath(logo.url)
    }));

    res.json({
      success: true,
      message: `Successfully uploaded ${newLogos.length} bank logo(s)`,
      data: {
        banksLogos: responseLogos
      }
    });

  } catch (error) {
    console.error("Error in createBanksLogo:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ✅ GET All Banks Logos
const getBanksLogo = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN (if you want to restrict view)
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkFooterPermission(subAdmin, 'view');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to view bank logos"
        });
      }
    }

    const content = await SiteContent.findOne();
    
    const banksLogos = content?.banksLogos ? content.banksLogos.map(logo => ({
      ...logo._doc,
      _id: logo._id.toString(),
      url: normalizePath(logo.url)
    })) : [];

    res.json({
      success: true,
      data: {
        banksLogos: banksLogos,
        totalCount: banksLogos.length,
        activeCount: banksLogos.filter(logo => logo.isActive).length
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ✅ UPDATE Single Bank Logo (Name, Order, Status)
const updateBanksLogo = async (req, res) => {
  try {
    const { logoId } = req.params;
    const { name, order, isActive } = req.body;

    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkFooterPermission(subAdmin, 'edit');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to update bank logos"
        });
      }
    }

    if (!logoId) {
      return res.status(400).json({
        success: false,
        message: "Logo ID is required"
      });
    }

    const content = await SiteContent.findOne();
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: "No content found"
      });
    }

    // Find the specific logo
    const logo = content.banksLogos.id(logoId);
    
    if (!logo) {
      return res.status(404).json({
        success: false,
        message: "Bank logo not found"
      });
    }

    // Update fields
    if (name !== undefined) logo.name = name;
    if (order !== undefined) logo.order = order;
    if (isActive !== undefined) logo.isActive = isActive;
    
    // Add updated by info
    logo.updatedBy = subAdmin?._id || req.admin?._id;
    logo.updatedByRole = subAdmin ? 'subadmin' : 'admin';
    logo.updatedAt = new Date();

    await content.save();

    res.json({
      success: true,
      message: "Bank logo updated successfully",
      data: {
        logo: {
          ...logo._doc,
          _id: logo._id.toString(),
          url: normalizePath(logo.url)
        }
      }
    });

  } catch (error) {
    console.error("Error in updateBanksLogo:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ✅ UPDATE Bank Logo Image (Replace image)
const updateBanksLogoImage = async (req, res) => {
  try {
    const { logoId } = req.params;
    const file = req.file;
    
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkFooterPermission(subAdmin, 'edit');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to update bank logos"
        });
      }
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a new logo image"
      });
    }

    if (!logoId) {
      return res.status(400).json({
        success: false,
        message: "Logo ID is required"
      });
    }

    const content = await SiteContent.findOne();
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: "No content found"
      });
    }

    // Find the specific logo
    const logo = content.banksLogos.id(logoId);
    
    if (!logo) {
      return res.status(404).json({
        success: false,
        message: "Bank logo not found"
      });
    }

    // Update the image URL
    logo.url = normalizePath(file.path);
    logo.uploadedAt = new Date();
    logo.updatedBy = subAdmin?._id || req.admin?._id;
    logo.updatedByRole = subAdmin ? 'subadmin' : 'admin';

    await content.save();

    res.json({
      success: true,
      message: "Bank logo image updated successfully",
      data: {
        logo: {
          ...logo._doc,
          _id: logo._id.toString(),
          url: normalizePath(logo.url)
        }
      }
    });

  } catch (error) {
    console.error("Error in updateBanksLogoImage:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ✅ DELETE Single Bank Logo
const deleteBanksLogo = async (req, res) => {
  try {
    const { logoId } = req.params;

    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkFooterPermission(subAdmin, 'delete');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to delete bank logos"
        });
      }
    }

    if (!logoId) {
      return res.status(400).json({
        success: false,
        message: "Logo ID is required"
      });
    }

    const content = await SiteContent.findOne();
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: "No content found"
      });
    }

    // Find and remove the logo
    const logo = content.banksLogos.id(logoId);
    
    if (!logo) {
      return res.status(404).json({
        success: false,
        message: "Bank logo not found"
      });
    }

    // Remove the logo using pull
    content.banksLogos.pull({ _id: logoId });
    
    // Reorder remaining logos
    content.banksLogos.forEach((logo, index) => {
      logo.order = index;
    });

    await content.save();

    res.json({
      success: true,
      message: "Bank logo deleted successfully",
      data: {
        deletedLogoId: logoId,
        remainingCount: content.banksLogos.length
      }
    });

  } catch (error) {
    console.error("Error in deleteBanksLogo:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ✅ DELETE ALL Bank Logos
const deleteAllBanksLogos = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkFooterPermission(subAdmin, 'delete');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to delete bank logos"
        });
      }
    }

    const content = await SiteContent.findOne();
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: "No content found"
      });
    }

    const deletedCount = content.banksLogos.length;
    content.banksLogos = [];
    await content.save();

    res.json({
      success: true,
      message: `All ${deletedCount} bank logos deleted successfully`,
      data: {
        deletedCount: deletedCount
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ✅ REORDER Bank Logos
const reorderBanksLogos = async (req, res) => {
  try {
    const { logoOrders } = req.body;

    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkFooterPermission(subAdmin, 'edit');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to reorder bank logos"
        });
      }
    }

    if (!Array.isArray(logoOrders)) {
      return res.status(400).json({
        success: false,
        message: "Invalid logo orders data"
      });
    }

    const content = await SiteContent.findOne();
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: "No content found"
      });
    }

    // Update order for each logo
    logoOrders.forEach(({ logoId, order }) => {
      const logo = content.banksLogos.id(logoId);
      if (logo) {
        logo.order = order;
        logo.updatedAt = new Date();
      }
    });

    // Sort by order
    content.banksLogos.sort((a, b) => a.order - b.order);
    await content.save();

    // Prepare response
    const responseLogos = content.banksLogos.map(logo => ({
      ...logo._doc,
      _id: logo._id.toString(),
      url: normalizePath(logo.url)
    }));

    res.json({
      success: true,
      message: "Bank logos reordered successfully",
      data: {
        banksLogos: responseLogos
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// =============================================
// CREATE POLICY (Privacy + Terms)
// ENDPOINT : /footerSub/create-policy
// =============================================
const createPolicy = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkFooterPermission(subAdmin, 'create');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to create policies"
        });
      }
    }

    const data = {
      privacyPolicy: req.body.privacyPolicy || "",
      termsAndConditions: req.body.termsAndConditions || "",
      createdBy: subAdmin?._id || req.admin?._id,
      createdByRole: subAdmin ? 'subadmin' : 'admin'
    };

    const newData = await SiteContent.create(data);

    res.status(201).json({
      success: true,
      message: "Policy created successfully",
      data: {
        id: newData._id,
        createdBy: data.createdBy,
        createdByRole: data.createdByRole
      }
    });
  } catch (error) {
    console.error('❌ Create Policy Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// =============================================
// GET POLICY (Privacy + Terms)
// ENDPOINT : /footerSub/get-policy
// =============================================
const getPolicy = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN (if you want to restrict view)
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkFooterPermission(subAdmin, 'view');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to view policies"
        });
      }
    }

    const content = await SiteContent.findOne().select('privacyPolicy termsAndConditions updatedAt');

    res.json({
      success: true,
      privacyPolicy: content?.privacyPolicy || "",
      termsAndConditions: content?.termsAndConditions || "",
      lastUpdated: content?.updatedAt || null
    });
  } catch (error) {
    console.error('❌ Get Policy Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// =============================================
// UPDATE POLICY (Privacy + Terms)
// ENDPOINT : /footerSub/update-policy
// =============================================
const updatePolicy = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkFooterPermission(subAdmin, 'edit');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to update policies"
        });
      }
    }

    const updateData = {
      privacyPolicy: req.body.privacyPolicy || "",
      termsAndConditions: req.body.termsAndConditions || "",
      updatedBy: subAdmin?._id || req.admin?._id,
      updatedByRole: subAdmin ? 'subadmin' : 'admin',
      updatedAt: new Date()
    };

    const updated = await SiteContent.findOneAndUpdate(
      {},
      updateData,
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Policy updated successfully",
      data: {
        id: updated._id,
        updatedBy: updateData.updatedBy,
        updatedByRole: updateData.updatedByRole,
        updatedAt: updateData.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ Update Policy Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// =============================================
// GET FOOTER CONTENT
// ENDPOINT : /footerSub/get-footer
// =============================================
const getContent = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN (optional)
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkFooterPermission(subAdmin, 'view');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to view footer content"
        });
      }
    }

    const content = await SiteContent.findOne().select('-createdBy -updatedBy -createdByRole -updatedByRole');

    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Footer content not found"
      });
    }

    // Convert to object and normalize paths
    const contentObj = content.toObject();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
   
    // Normalize paths
    const normalizeAndAddUrl = (field) => {
      if (contentObj[field]) {
        contentObj[field] = normalizePath(contentObj[field]);
        contentObj[`${field}Url`] = `${baseUrl}/${contentObj[field]}`;
      }
    };
    
    // Normalize all image fields
    ['easyIcon', 'affordableIcon', 'accessibleIcon'].forEach(field => {
      normalizeAndAddUrl(field);
    });
    
    // Normalize banksLogos array
    if (contentObj.banksLogos && Array.isArray(contentObj.banksLogos)) {
      contentObj.banksLogos = contentObj.banksLogos.map(logo => ({
        ...logo,
        _id: logo._id.toString(),
        url: normalizePath(logo.url),
        urlFull: `${baseUrl}/${normalizePath(logo.url)}`
      }));
    }

    res.json({
      success: true,
      message: "Footer content fetched successfully",
      data: contentObj
    });
  } catch (error) {
    console.error('❌ Get Content Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// =============================================
// CREATE FOOTER CONTENT
// ENDPOINT : /footerSub/create-footer
// =============================================
const createContent = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkFooterPermission(subAdmin, 'create');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to create footer content"
        });
      }
    }

    const files = req.files;

    // Text fields directly req.body se lo
    const data = {
      easyHeading: req.body.easyHeading || "",
      easyContent: req.body.easyContent || "",
      easyIcon: files.easyIcon ? normalizePath(files.easyIcon[0].path) : "",

      affordableHeading: req.body.affordableHeading || "",
      affordableContent: req.body.affordableContent || "",
      affordableIcon: files.affordableIcon ? normalizePath(files.affordableIcon[0].path) : "",

      accessibleHeading: req.body.accessibleHeading || "",
      accessibleContent: req.body.accessibleContent || "",
      accessibleIcon: files.accessibleIcon ? normalizePath(files.accessibleIcon[0].path) : "",

      createdBy: subAdmin?._id || req.admin?._id,
      createdByRole: subAdmin ? 'subadmin' : 'admin'
    };

    const content = await SiteContent.create(data);
   
    res.status(201).json({
      success: true,
      message: "Footer content created successfully",
      data: {
        id: content._id,
        createdBy: data.createdBy,
        createdByRole: data.createdByRole,
        sections: ['easy', 'affordable', 'accessible']
      }
    });
  } catch (error) {
    console.error('❌ Create Content Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// =============================================
// UPDATE FOOTER CONTENT
// ENDPOINT : /footerSub/update-footer/:id
// =============================================
const updateContent = async (req, res) => {
  try {
    const { id } = req.params;
   
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkFooterPermission(subAdmin, 'edit');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to update footer content"
        });
      }
    }

    const files = req.files;

    const updateData = {
      easyHeading: req.body.easyHeading || "",
      easyContent: req.body.easyContent || "",
      affordableHeading: req.body.affordableHeading || "",
      affordableContent: req.body.affordableContent || "",
      accessibleHeading: req.body.accessibleHeading || "",
      accessibleContent: req.body.accessibleContent || "",
     
      updatedBy: subAdmin?._id || req.admin?._id,
      updatedByRole: subAdmin ? 'subadmin' : 'admin',
      updatedAt: new Date()
    };

    // Only update icon paths if files are provided
    if (files && files.easyIcon) {
      updateData.easyIcon = normalizePath(files.easyIcon[0].path);
    }
    if (files && files.affordableIcon) {
      updateData.affordableIcon = normalizePath(files.affordableIcon[0].path);
    }
    if (files && files.accessibleIcon) {
      updateData.accessibleIcon = normalizePath(files.accessibleIcon[0].path);
    }

    const updated = await SiteContent.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Footer content not found"
      });
    }

    res.json({
      success: true,
      message: "Footer content updated successfully",
      data: {
        id: updated._id,
        updatedBy: updateData.updatedBy,
        updatedByRole: updateData.updatedByRole,
        updatedAt: updateData.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ Update Content Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  // Policy functions
  updateContent,
  getContent,
  createContent,
  updatePolicy,
  createPolicy,
  getPolicy,
  
  // Banks logos functions
  createBanksLogo,
  getBanksLogo,
  updateBanksLogo,
  updateBanksLogoImage,
  deleteBanksLogo,
  deleteAllBanksLogos,
  reorderBanksLogos
};
