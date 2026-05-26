const SciencePage = require("../../../modal/SciencePage");

// ----------------------------------------------
// ✅ GET SCIENCE PAGE (Subadmin)
// ----------------------------------------------
const getSciencePageSubadmin = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ⛔ Permission check
    if (!subAdmin.permissions?.users?.view) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view Science Page section",
      });
    }

    let sciencePage = await SciencePage.findOne({ isActive: true });

    if (!sciencePage) {
      return res.status(404).send({
        success: 0,
        message: "No active science page found",
      });
    }

    return res.status(200).send({
      success: 1,
      message: "Science page fetched successfully",
      data: sciencePage,
    });
  } catch (error) {
    console.error("❌ Error fetching science page:", error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ----------------------------------------------
// ✅ UPDATE SCIENCE PAGE (Subadmin)
// ----------------------------------------------
const updateSciencePageSubadmin = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ⛔ Permission check
    if (!subAdmin.permissions?.users?.edit) {
      return res.status(403).send({
        success: 0,
        message: "No permission to update Science Page section",
      });
    }

    const updateData = req.body;

    // Find active science page
    let sciencePage = await SciencePage.findOne({ isActive: true });

    if (!sciencePage) {
      return res.status(404).send({
        success: 0,
        message: "No active science page found",
      });
    }

    // Normal fields update
    const fieldsToUpdate = [
      'heroTitle', 'heroSubtitle', 'impactTitle', 'grantTitle', 
      'grantSubtitle', 'researchTitle', 'researchDescription', 'statsTitle'
    ];

    fieldsToUpdate.forEach(field => {
      if (updateData[field] !== undefined) {
        sciencePage[field] = updateData[field];
      }
    });

    // Update card/stat using index update
    if (updateData.impactCard) {
      const { index, ...cardData } = updateData.impactCard;
      if (sciencePage.impactCards[index]) {
        Object.assign(sciencePage.impactCards[index], cardData);
      }
    }

    if (updateData.teamCard) {
      const { index, ...cardData } = updateData.teamCard;
      if (sciencePage.teamCards[index]) {
        Object.assign(sciencePage.teamCards[index], cardData);
      }
    }

    if (updateData.statistic) {
      const { index, ...statData } = updateData.statistic;
      if (sciencePage.statistics[index]) {
        Object.assign(sciencePage.statistics[index], statData);
      }
    }

    // Replace whole arrays
    if (Array.isArray(updateData.impactCards)) sciencePage.impactCards = updateData.impactCards;
    if (Array.isArray(updateData.teamCards)) sciencePage.teamCards = updateData.teamCards;
    if (Array.isArray(updateData.statistics)) sciencePage.statistics = updateData.statistics;

    // File uploads
    if (req.files) {
      if (req.files.heroBackgroundImage) {
        sciencePage.heroBackgroundImage = req.files.heroBackgroundImage[0].filename;
      }
      if (req.files.grantBackgroundImage) {
        sciencePage.grantBackgroundImage = req.files.grantBackgroundImage[0].filename;
      }
      if (req.files.researchImages) {
        sciencePage.researchImages = req.files.researchImages.map(file => file.filename);
      }
    }

    sciencePage.lastUpdatedBy = subAdmin._id;
    await sciencePage.save();

    return res.status(200).send({
      success: 1,
      message: "Science page updated successfully",
      data: sciencePage,
    });

  } catch (error) {
    console.error("❌ Error updating science page:", error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ----------------------------------------------
// ✅ ADD ITEM (Subadmin)
// ----------------------------------------------
const addSciencePageItemSubadmin = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ⛔ Permission check
    if (!subAdmin.permissions?.users?.edit) {
      return res.status(403).send({
        success: 0,
        message: "No permission to modify Science Page",
      });
    }

    const { type, data } = req.body;

    let sciencePage = await SciencePage.findOne({ isActive: true });

    if (!sciencePage) {
      return res.status(404).send({
        success: 0,
        message: "Science page not found",
      });
    }

    switch (type) {
      case 'impactCard':
        sciencePage.impactCards.push(data);
        break;
      case 'teamCard':
        sciencePage.teamCards.push(data);
        break;
      case 'statistic':
        sciencePage.statistics.push(data);
        break;
      default:
        return res.status(400).send({
          success: 0,
          message: "Invalid type",
        });
    }

    sciencePage.lastUpdatedBy = subAdmin._id;
    await sciencePage.save();

    return res.status(200).send({
      success: 1,
      message: `${type} added successfully`,
      data: sciencePage,
    });

  } catch (error) {
    console.error("❌ Error adding item:", error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ----------------------------------------------
// ✅ REMOVE ITEM (Subadmin)
// ----------------------------------------------
const removeSciencePageItemSubadmin = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ⛔ Permission check
    if (!subAdmin.permissions?.users?.edit) {
      return res.status(403).send({
        success: 0,
        message: "No permission to modify Science Page",
      });
    }

    const { type, index } = req.body;

    let sciencePage = await SciencePage.findOne({ isActive: true });

    if (!sciencePage) {
      return res.status(404).send({
        success: 0,
        message: "Science page not found",
      });
    }

    switch (type) {
      case 'impactCard':
        sciencePage.impactCards.splice(index, 1);
        break;
      case 'teamCard':
        sciencePage.teamCards.splice(index, 1);
        break;
      case 'statistic':
        sciencePage.statistics.splice(index, 1);
        break;
      default:
        return res.status(400).send({
          success: 0,
          message: "Invalid type",
        });
    }

    sciencePage.lastUpdatedBy = subAdmin._id;
    await sciencePage.save();

    return res.status(200).send({
      success: 1,
      message: `${type} removed successfully`,
      data: sciencePage,
    });

  } catch (error) {
    console.error("❌ Error removing science item:", error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ----------------------------------------------
// ✅ UPLOAD IMAGES (Subadmin)
// ----------------------------------------------
const uploadScienceImagesSubadmin = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ⛔ Permission check
    if (!subAdmin.permissions?.users?.edit) {
      return res.status(403).send({
        success: 0,
        message: "No permission to upload images",
      });
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send({
        success: 0,
        message: "No files uploaded",
      });
    }

    const uploadedFiles = [];

    if (req.files.heroBackgroundImage) {
      uploadedFiles.push({
        type: 'heroBackgroundImage',
        filename: req.files.heroBackgroundImage[0].filename,
      });
    }

    if (req.files.grantBackgroundImage) {
      uploadedFiles.push({
        type: 'grantBackgroundImage',
        filename: req.files.grantBackgroundImage[0].filename,
      });
    }

    if (req.files.researchImages) {
      req.files.researchImages.forEach(file => {
        uploadedFiles.push({
          type: 'researchImage',
          filename: file.filename,
        });
      });
    }

    return res.status(200).send({
      success: 1,
      message: "Images uploaded successfully",
      data: uploadedFiles,
    });
  } catch (error) {
    console.error("❌ Error uploading images:", error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = {
  getSciencePageSubadmin,
  updateSciencePageSubadmin,
  addSciencePageItemSubadmin,
  removeSciencePageItemSubadmin,
  uploadScienceImagesSubadmin,
};
