const SciencePage = require("../../../modal/SciencePage");

// ✅ GET SCIENCE PAGE CONTENT (Public - for both admin and user)
const getSciencePage = async (req, res) => {
  try {
    let sciencePage = await SciencePage.findOne({ isActive: true });

    if (!sciencePage) {
      // Create default content only once if none exists
      sciencePage = await SciencePage.create({
        heroTitle: "Advancing Diabetes Research",
        heroSubtitle: "Transforming lives through innovative science and research",
        impactTitle: "Our Impact",
        grantTitle: "Research Grants",
        grantSubtitle: "Supporting groundbreaking diabetes research",
        researchTitle: "Latest Research",
        researchDescription: "Explore our latest findings and breakthroughs",
        statsTitle: "Clinical Results",
        isActive: true,
        impactCards: [
          {
            image: "https://www.diabetesaustralia.com.au/wp-content/uploads/2022_da_wdd_icon_numbers_australia_1.0.svg",
            number: "1,500,000",
            description: "People living with diabetes in Australia. We amplify their voice and champion the cause to drive change."
          },
          {
            image: "https://www.diabetesaustralia.com.au/wp-content/uploads/Prevention.png",
            number: "120,000",
            description: "People diagnosed with diabetes each year. We provide education, care and support to help them live well with diabetes."
          },
          {
            image: "https://www.diabetesaustralia.com.au/wp-content/uploads/Science.png",
            number: "400,000",
            description: "Australians at high risk of diabetes. We are committed to supporting them to prevent or delay the onset of type 2 diabetes."
          },
          {
            image: "https://www.diabetesaustralia.com.au/wp-content/uploads/2022_da_wdd_icon_numbers_people_1.0.svg",
            number: "$36,000",
            description: "Invested in over 500 research projects over the past 12 years through the Diabetes Australia Research Program."
          }
        ],
        teamCards: [
          {
            name: "Michael German, M.D.",
            institution: "University of California, San Francisco"
          },
          {
            name: "Anne Henneken, M.D.",
            institution: "The Scripps Research Institute"
          },
          {
            name: "Rohit Kurlkarni, M.D.",
            institution: "Joslin diabetes center/Harvard Medical School"
          },
          {
            name: "Amelia Linnemann, Ph.D.",
            institution: "University of Indiana School of Medicine"
          }
        ],
        statistics: [
          {
            percentage: "51.9%",
            description: "Reduction in hypoglycemia incident post Health Coach counselling",
            source: "Advanced Technologies & Treatments for Diabetes"
          },
          {
            percentage: "9.45%",
            description: "Reduction in fasting sugar levels within just 45 days",
            source: "American Diabetes Association"
          },
          {
            percentage: "15%",
            description: "Advanced Technologies & Treatments for Diabetes",
            source: "Advanced Technologies & Treatments for Diabetes"
          },
          {
            percentage: "1.9%p",
            description: "Reduction in estimated HbA1c levels within 1 year",
            source: "Advanced Technologies & Treatments for Diabetes"
          }
        ]
      });
    }

    return res.status(200).send({
      success: 1,
      message: "Science page content fetched successfully",
      data: sciencePage
    });
  } catch (error) {
    console.error("❌ Error fetching science page:", error);
    return res.status(500).send({
      success: 0,
      message: error.message
    });
  }
};

// ✅ UPDATE SCIENCE PAGE CONTENT (Admin only)
// ✅ UPDATE SCIENCE PAGE CONTENT (Admin only) - FIXED VERSION
const updateSciencePage = async (req, res) => {
  try {
    const updateData = req.body;

    // Find active science page or create one if doesn't exist
    let sciencePage = await SciencePage.findOne({ isActive: true });

    if (!sciencePage) {
      // If no active page exists, create a basic one first
      sciencePage = await SciencePage.create({
        isActive: true,
        impactCards: [],
        teamCards: [],
        statistics: [],
        researchImages: [],
        grantBackgroundImaage:[],
      });
    }

    // Update individual fields if provided
    const fieldsToUpdate = [
      'heroTitle', 'heroSubtitle', 'impactTitle', 'grantTitle', 
      'grantSubtitle', 'researchTitle', 'researchDescription', 'statsTitle'
    ];

    fieldsToUpdate.forEach(field => {
      if (updateData[field] !== undefined) {
        sciencePage[field] = updateData[field];
      }
    });

    // Update individual array elements if provided with index
    if (updateData.impactCard) {
      const { index, ...cardData } = updateData.impactCard;
      if (index !== undefined && sciencePage.impactCards[index]) {
        Object.keys(cardData).forEach(key => {
          sciencePage.impactCards[index][key] = cardData[key];
        });
      }
    }

    if (updateData.teamCard) {
      const { index, ...cardData } = updateData.teamCard;
      if (index !== undefined && sciencePage.teamCards[index]) {
        Object.keys(cardData).forEach(key => {
          sciencePage.teamCards[index][key] = cardData[key];
        });
      }
    }

    if (updateData.statistic) {
      const { index, ...statData } = updateData.statistic;
      if (index !== undefined && sciencePage.statistics[index]) {
        Object.keys(statData).forEach(key => {
          sciencePage.statistics[index][key] = statData[key];
        });
      }
    }

    // Handle complete array updates if provided
    if (updateData.impactCards && Array.isArray(updateData.impactCards)) {
      sciencePage.impactCards = updateData.impactCards;
    }

    if (updateData.teamCards && Array.isArray(updateData.teamCards)) {
      sciencePage.teamCards = updateData.teamCards;
    }

    if (updateData.statistics && Array.isArray(updateData.statistics)) {
      sciencePage.statistics = updateData.statistics;
    }

    // FIX: Handle researchImages array properly - don't replace, update
    if (updateData.researchImages && Array.isArray(updateData.researchImages)) {
      sciencePage.researchImages = updateData.researchImages;
    }

    // Handle file uploads for images - FIXED: Don't replace researchImages, append
    if (req.files) {
      if (req.files.heroBackgroundImage) {
        sciencePage.heroBackgroundImage = req.files.heroBackgroundImage[0].filename;
      }
      if (req.files.grantBackgroundImage) {
        sciencePage.grantBackgroundImage = req.files.grantBackgroundImage[0].filename;
      }
      if (req.files.researchImages) {
        // FIX: Append new research images instead of replacing
        const newResearchImages = req.files.researchImages.map(file => file.filename);
        sciencePage.researchImages = [...sciencePage.researchImages, ...newResearchImages];
      }
    }

    sciencePage.lastUpdatedBy = req.user._id;
    sciencePage.isActive = true;

    await sciencePage.save();

    return res.status(200).send({
      success: 1,
      message: "Science page updated successfully",
      data: sciencePage
    });
  } catch (error) {
    console.error("❌ Error updating science page:", error);
    return res.status(500).send({
      success: 0,
      message: error.message
    });
  }
};

// ✅ ADD NEW CARD/STATISTIC (Admin only)
const addSciencePageItem = async (req, res) => {
  try {
    const { type, data } = req.body;
    
    let sciencePage = await SciencePage.findOne({ isActive: true });
    
    if (!sciencePage) {
      return res.status(404).send({
        success: 0,
        message: "No active science page found. Please create one first."
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
          message: "Invalid type. Use 'impactCard', 'teamCard', or 'statistic'"
        });
    }

    sciencePage.lastUpdatedBy = req.user._id;
    await sciencePage.save();

    return res.status(200).send({
      success: 1,
      message: `${type} added successfully`,
      data: sciencePage
    });
  } catch (error) {
    console.error("❌ Error adding science page item:", error);
    return res.status(500).send({
      success: 0,
      message: error.message
    });
  }
};

// ✅ REMOVE CARD/STATISTIC (Admin only)
const removeSciencePageItem = async (req, res) => {
  try {
    const { type, index } = req.body;
    
    let sciencePage = await SciencePage.findOne({ isActive: true });
    
    if (!sciencePage) {
      return res.status(404).send({
        success: 0,
        message: "No active science page found."
      });
    }

    switch (type) {
      case 'impactCard':
        if (sciencePage.impactCards[index]) {
          sciencePage.impactCards.splice(index, 1);
        }
        break;
      case 'teamCard':
        if (sciencePage.teamCards[index]) {
          sciencePage.teamCards.splice(index, 1);
        }
        break;
      case 'statistic':
        if (sciencePage.statistics[index]) {
          sciencePage.statistics.splice(index, 1);
        }
        break;
      default:
        return res.status(400).send({
          success: 0,
          message: "Invalid type. Use 'impactCard', 'teamCard', or 'statistic'"
        });
    }

    sciencePage.lastUpdatedBy = req.user._id;
    await sciencePage.save();

    return res.status(200).send({
      success: 1,
      message: `${type} removed successfully`,
      data: sciencePage
    });
  } catch (error) {
    console.error("❌ Error removing science page item:", error);
    return res.status(500).send({
      success: 0,
      message: error.message
    });
  }
};

// ✅ UPLOAD SCIENCE PAGE IMAGES (Admin only)
const uploadScienceImages = async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send({
        success: 0,
        message: "No files were uploaded."
      });
    }

    const uploadedFiles = [];
    
    // Process each file type
    if (req.files.heroBackgroundImage) {
      uploadedFiles.push({
        type: 'heroBackgroundImage',
        filename: req.files.heroBackgroundImage[0].filename,
        path: req.files.heroBackgroundImage[0].path
      });
    }

    if (req.files.grantBackgroundImage) {
      uploadedFiles.push({
        type: 'grantBackgroundImage',
        filename: req.files.grantBackgroundImage[0].filename,
        path: req.files.grantBackgroundImage[0].path
      });
    }

    if (req.files.researchImages) {
      req.files.researchImages.forEach(file => {
        uploadedFiles.push({
          type: 'researchImage',
          filename: file.filename,
          path: file.path
        });
      });
    }

    return res.status(200).send({
      success: 1,
      message: "Images uploaded successfully",
      data: uploadedFiles
    });
  } catch (error) {
    console.error("❌ Error uploading science images:", error);
    return res.status(500).send({
      success: 0,
      message: error.message
    });
  }
};

module.exports = {
  getSciencePage,
  updateSciencePage,
  addSciencePageItem,
  removeSciencePageItem,
  uploadScienceImages
};