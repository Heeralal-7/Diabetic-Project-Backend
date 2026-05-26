// controllers/admin/User/footerContent.js
const SiteContent = require("../../../modal/footerContent");
 
// ✅ Path normalization function
const normalizePath = (pathString) => {
  if (!pathString || typeof pathString !== 'string') {
    return pathString;
  }
  return pathString.replace(/\\/g, '/');
};
 
// ==================== POLICY FUNCTIONS ====================
// CREATE (Only Privacy + Terms)
const createPolicy = async (req, res) => {
  try {
    const data = {
      privacyPolicy: req.body.privacyPolicy,
      termsAndConditions: req.body.termsAndConditions,
    };
 
    const newData = await SiteContent.create(data);
    res.json({
      success: true,
      message: "Policy created successfully",
      data: newData
    });
 
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
 
// GET both privacyPolicy + termsAndConditions
const getPolicy = async (req, res) => {
  try {
    const content = await SiteContent.findOne();
    res.json({
      success: true,
      data: {
        privacyPolicy: content?.privacyPolicy || "",
        termsAndConditions: content?.termsAndConditions || ""
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
 
// UPDATE both privacyPolicy + termsAndConditions
const updatePolicy = async (req, res) => {
  try {
    const updateData = {
      privacyPolicy: req.body.privacyPolicy,
      termsAndConditions: req.body.termsAndConditions,
    };
 
    const updated = await SiteContent.findOneAndUpdate(
      {},
      updateData,
      { new: true, upsert: true }
    );
 
    res.json({
      success: true,
      message: "Policy updated successfully",
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
 
// ==================== FOOTER CONTENT FUNCTIONS ====================
// CREATE Footer Content
const createContent = async (req, res) => {
  try {
    const files = req.files;
   
    const data = {
      easyHeading: req.body.easyHeading,
      easyContent: req.body.easyContent,
      easyIcon: files.easyIcon ? normalizePath(files.easyIcon[0].path) : "",
 
      affordableHeading: req.body.affordableHeading,
      affordableContent: req.body.affordableContent,
      affordableIcon: files.affordableIcon ? normalizePath(files.affordableIcon[0].path) : "",
 
      accessibleHeading: req.body.accessibleHeading,
      accessibleContent: req.body.accessibleContent,
      accessibleIcon: files.accessibleIcon ? normalizePath(files.accessibleIcon[0].path) : "",
    };
 
    const content = await SiteContent.create(data);
    res.status(201).json({
      success: true,
      message: "Footer content created successfully",
      data: content
    });
 
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
 
// GET Footer Content
const getContent = async (req, res) => {
  try {
    const content = await SiteContent.findOne();
 
    if (content) {
      // ✅ Normalize all image paths
      const normalizedContent = {
        ...content._doc,
        easyIcon: normalizePath(content.easyIcon),
        affordableIcon: normalizePath(content.affordableIcon),
        accessibleIcon: normalizePath(content.accessibleIcon),
        // ✅ Normalize banksLogos array paths
        banksLogos: content.banksLogos ? content.banksLogos.map(logo => ({
          ...logo._doc,
          url: normalizePath(logo.url),
          _id: logo._id.toString() // Ensure _id is string
        })) : []
      };
     
      res.json({
        success: true,
        data: normalizedContent
      });
    } else {
      res.json({
        success: true,
        data: null
      });
    }
 
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
 
// UPDATE Footer Content
const updateContent = async (req, res) => {
  try {
    const files = req.files;
    const { id } = req.params;
 
    const updateData = {
      easyHeading: req.body.easyHeading,
      easyContent: req.body.easyContent,
      affordableHeading: req.body.affordableHeading,
      affordableContent: req.body.affordableContent,
      accessibleHeading: req.body.accessibleHeading,
      accessibleContent: req.body.accessibleContent,
    };
 
    // File paths store karo aur normalize करो
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
      { new: true }
    );
 
    // ✅ Response में normalized paths return करें
    if (updated) {
      updated.easyIcon = normalizePath(updated.easyIcon);
      updated.affordableIcon = normalizePath(updated.affordableIcon);
      updated.accessibleIcon = normalizePath(updated.accessibleIcon);
      updated.banksLogos = updated.banksLogos ? updated.banksLogos.map(logo => ({
        ...logo._doc,
        url: normalizePath(logo.url),
        _id: logo._id.toString()
      })) : [];
    }
 
    res.json({
      success: true,
      message: "Footer content updated successfully",
      data: updated
    });
 
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
 
// ==================== MULTIPLE BANKS LOGOS FUNCTIONS ====================
 
// ✅ CREATE Multiple Banks Logo
const createBanksLogo = async (req, res) => {
  try {
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
      uploadedAt: new Date()
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
 
module.exports = {
  // Policy functions
  updatePolicy,
  createPolicy,
  getPolicy,
 
  // Footer content functions
  updateContent,
  getContent,
  createContent,
 
  // Multiple banks logos functions
  createBanksLogo,
  getBanksLogo,
  updateBanksLogo,
  updateBanksLogoImage,
  deleteBanksLogo,
  deleteAllBanksLogos,
  reorderBanksLogos
};
 