// controllers/subadminAboutUsController.js
const AboutUs = require("../../../modal/AboutUs");

// ✅ GET ABOUT US (SUBADMIN)
const getAboutUsSubadmin = async (req, res) => {
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
        message: "No permission to view About Us section",
      });
    }

    let aboutUs = await AboutUs.findOne({ isActive: true });

    if (!aboutUs) {
      // Create default About Us if not exists
      aboutUs = await AboutUs.create({
        heroTitle: "About Us",
        mainTitle: "We Provide Finest Patient's Care & Amenities",
        leftFeatures: [
          "Seamless Care",
          "Warm and Welcoming Environment",
          "Comprehensive Care",
          "Expert Doctors",
        ],
        rightFeatures: [
          "Patient-Centered Care",
          "Personalized Approach",
          "Cutting-Edge Technology",
          "Positive Reviews",
        ],
        priorityStatement: "YOUR HEALTH IS OUR TOP PRIORITY",
        stats: {
          patientReviews: "5k+",
          googleRating: "4.9",
        },
        moreAboutTitle: "We Are A Clinic, Provide Excellence In Personalized Care",
        cards: [
          {
            title: "Not Just Better Care, But A Better Experience",
            description: "At our medical center, we believe in providing not just better care but a better experience overall.",
            image: "https://themes.hibootstrap.com/hospa/wp-content/uploads/2024/03/img1.png",
            backgroundColor: "#ffffff",
          },
          {
            title: "Serving All People Through Exemplary Care",
            description: "At our medical center, we believe in providing not just better care but a better experience overall.",
            image: "https://themes.hibootstrap.com/hospa/wp-content/uploads/2024/03/img2.png",
            backgroundColor: "#ffffff",
          },
          {
            title: "Specialty Medicine with Compassion and Care",
            description: "At our medical center, we believe in providing not just better care but a better experience overall.",
            image: "https://themes.hibootstrap.com/hospa/wp-content/uploads/2024/03/img3.png",
            backgroundColor: "#ffffff",
          },
        ],
        missionVision: [
          {
            type: "mission",
            title: "OUR MISSION",
            description: "Our mission is to care for our patients and their families when it matters most.",
            icon: "fa-shield",
            backgroundColor: "#9d99b6",
          },
          {
            type: "vision",
            title: "OUR VISION",
            description: "At our medical center, we believe in providing not just better care but a better experience overall.",
            icon: "fa-eye",
            backgroundColor: "#68cca6",
          },
          {
            type: "values",
            title: "OUR VALUES",
            description: "Our values are: excellence, collaboration, accountability, respect and engagement.",
            icon: "fa-heart",
            backgroundColor: "#9fcbf3",
          },
        ],
        insuranceTitle: "Our Accepted Insurance",
        insuranceLogos: [
          "https://themes.hibootstrap.com/hospa/wp-content/uploads/2024/04/partner1.png",
          "https://themes.hibootstrap.com/hospa/wp-content/uploads/2024/04/partner3.png",
          "https://themes.hibootstrap.com/hospa/wp-content/uploads/2024/04/partner6.png",
          "https://themes.hibootstrap.com/hospa/wp-content/uploads/2024/04/partner4.png",
        ],
      });
    }

    return res.status(200).send({
      success: 1,
      message: "About Us data fetched successfully",
      data: aboutUs,
    });
  } catch (error) {
    console.error("❌ Error fetching About Us:", error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ UPDATE ABOUT US (SUBADMIN)
const updateAboutUsSubadmin = async (req, res) => {
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
        message: "No permission to update About Us",
      });
    }

    let updateData = { ...req.body };
    const files = req.files;

    // Parse JSON fields if stringified
    const parseField = (field) => {
      if (updateData[field] && typeof updateData[field] === "string") {
        try {
          updateData[field] = JSON.parse(updateData[field]);
        } catch (error) {
          console.log(`Failed to parse ${field}:`, error);
        }
      }
    };

    parseField("leftFeatures");
    parseField("rightFeatures");
    parseField("cards");
    parseField("missionVision");
    parseField("insuranceLogos");
    parseField("stats");

    // File uploads
    if (files) {
      if (files.heroImage) {
        updateData.heroImage = `/uploads/aboutus/${files.heroImage[0].filename}`;
      }
      if (files.mainImage) {
        updateData.mainImage = `/uploads/aboutus/${files.mainImage[0].filename}`;
      }
      if (files.moreAboutImage) {
        updateData.moreAboutImage = `/uploads/aboutus/${files.moreAboutImage[0].filename}`;
      }
      if (files.moreAboutSideImage) {
        updateData.moreAboutSideImage = `/uploads/aboutus/${files.moreAboutSideImage[0].filename}`;
      }

      if (files.cardImages && updateData.cards && Array.isArray(updateData.cards)) {
        files.cardImages.forEach((file, index) => {
          if (updateData.cards[index]) {
            updateData.cards[index].image = `/uploads/aboutus/${file.filename}`;
          }
        });
      }

      if (files.insuranceLogos) {
        updateData.insuranceLogos = files.insuranceLogos.map((file) => `/uploads/aboutus/${file.filename}`);
      }
    }

    let aboutUs = await AboutUs.findOne({ isActive: true });

    if (aboutUs) {
      aboutUs = await AboutUs.findByIdAndUpdate(
        aboutUs._id,
        {
          ...updateData,
          lastUpdatedBy: subAdmin._id,
        },
        { new: true, runValidators: true }
      );
    } else {
      aboutUs = await AboutUs.create({
        ...updateData,
        lastUpdatedBy: subAdmin._id,
      });
    }

    return res.status(200).send({
      success: 1,
      message: "About Us updated successfully",
      data: aboutUs,
    });
  } catch (error) {
    console.error("❌ Error updating About Us:", error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ UPLOAD IMAGE (SUBADMIN)
const uploadImageSubadmin = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // Check permission
    if (!subAdmin.permissions?.users?.edit) {
      return res.status(403).send({
        success: 0,
        message: "No permission to upload image",
      });
    }

    if (!req.file) {
      return res.status(400).send({
        success: 0,
        message: "No file uploaded",
      });
    }

    const imageUrl = `/uploads/aboutus/${req.file.filename}`;

    return res.status(200).send({
      success: 1,
      message: "Image uploaded successfully",
      data: {
        imageUrl,
      },
    });
  } catch (error) {
    console.error("❌ Error uploading image:", error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = {
  getAboutUsSubadmin,
  updateAboutUsSubadmin,
  uploadImageSubadmin,
};
