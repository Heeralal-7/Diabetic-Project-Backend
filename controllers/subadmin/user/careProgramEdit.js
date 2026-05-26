const CareProgramContent = require("../../../modal/careProgram");
const path = require("path");
const fs = require("fs");

// ==========================================
//            HELPER FUNCTIONS
// ==========================================

// 1. Get Image URL
const getImageUrl = (filePath) => {
  if (!filePath) return null;
  const urlPath = filePath.replace(/\\/g, '/');
  return urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
};

// 2. Get Image Dimensions
const getImageDimensions = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return null;
    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase().replace('.', '');
    return {
      size: stats.size,
      format: ext,
      width: 0, 
      height: 0,
      lastModified: stats.mtime
    };
  } catch (error) {
    console.error("Error getting image dimensions:", error);
    return null;
  }
};

// 3. Flatten Object
const flattenObject = (obj, prefix = '') => {
  return Object.keys(obj).reduce((acc, key) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (Array.isArray(obj[key])) {
      acc[pre + key] = obj[key];
    }
    else if (typeof obj[key] === 'object' && obj[key] !== null && Object.keys(obj[key]).length > 0) {
      Object.assign(acc, flattenObject(obj[key], pre + key));
    } 
    else {
      acc[pre + key] = obj[key];
    }
    return acc;
  }, {});
};

// ==========================================
//    HELPER FUNCTION FOR CARE PROGRAM PERMISSION CHECKING
// ==========================================
const checkCareProgramPermission = (subAdmin, permissionType) => {
  if (!subAdmin) {
    return {
      allowed: false,
      message: "Sub-admin not authenticated"
    };
  }

  // Check for care-program specific permissions
  if (subAdmin.permissions?.careProgram?.[permissionType]) {
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
    message: `No permission to ${permissionType} care program content`
  };
};

// ==========================================
//          CONTENT MANAGEMENT APIs
// ==========================================

// 1. GET: Get published content
// Endpoint: /care/sub/get
exports.getPublishedContent = async (req, res) => {
  try {
    const content = await CareProgramContent.findOne({ pageName: "CareProgramPage", isPublished: true });
    if (!content) return res.status(404).json({ success: false, message: "Published content not found" });
    res.status(200).json({ success: true, data: content });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
};

// 2. GET: Get all content (sub-admin)
// Endpoint: /care/sub/get-all
exports.getAllContent = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCareProgramPermission(subAdmin, 'view');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to view care program content"
        });
      }
    }

    let content = await CareProgramContent.findOne({ pageName: "CareProgramPage" });
    if (!content) content = await CareProgramContent.create({});
    res.status(200).json({ success: true, data: content });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
};

// 3. POST: Create new content
// Endpoint: /care/sub/create
exports.createContent = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCareProgramPermission(subAdmin, 'create');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to create care program content"
        });
      }
    }

    const { pageName = "CareProgramPage", ...otherData } = req.body;
    const existingContent = await CareProgramContent.findOne({ pageName });
    if (existingContent) return res.status(400).json({ success: false, message: "Content already exists" });

    const newContent = await CareProgramContent.create({ ...otherData, pageName });
    res.status(201).json({ success: true, message: "Created successfully", data: newContent });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
};

// 4. PUT: Update content (Main Global Update)
// Endpoint: /care/sub/update
exports.updateContent = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCareProgramPermission(subAdmin, 'edit');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to edit care program content"
        });
      }
    }

    const pageName = "CareProgramPage";
    
    // 1. Files
    let fileUpdates = {};
    if (req.files) {
      if (req.files['bannerImage']) fileUpdates['heroSection.bannerImage.url'] = getImageUrl(req.files['bannerImage'][0].path);
      if (req.files['sideImage']) fileUpdates['doctorSlider.sideImage.url'] = getImageUrl(req.files['sideImage'][0].path);
    }

    // 2. Text Data
    let bodyData = { ...req.body };
    if (bodyData.data) {
        try { bodyData = JSON.parse(bodyData.data); } catch (e) { console.log("JSON Parse Error", e); }
    }

    delete bodyData.pageName;
    delete bodyData.version;
    delete bodyData._id;

    // 3. Merge
    const flattenedUpdate = flattenObject(bodyData);
    const finalUpdateObject = { ...flattenedUpdate, ...fileUpdates };

    // 4. Update
    const updatedContent = await CareProgramContent.findOneAndUpdate(
      { pageName: pageName },
      { $set: finalUpdateObject, $inc: { version: 1 } },
      { new: true, runValidators: true }
    );

    if (!updatedContent) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, message: "Updated successfully", data: updatedContent });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating", error: error.message });
  }
};

// 5. PATCH: Update section
// Endpoint: /care/sub/update-section
exports.updateSection = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCareProgramPermission(subAdmin, 'edit');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to edit care program content"
        });
      }
    }

    const { section, data } = req.body;
    const validSections = ['heroSection', 'statsSection', 'doctorSlider', 'programFeatures', 'ctaSection', 'seo'];
    if (!validSections.includes(section)) return res.status(400).json({ success: false, message: "Invalid section" });
    
    const updateData = {};
    updateData[section] = data;
    const updatedContent = await CareProgramContent.findOneAndUpdate(
      { pageName: "CareProgramPage" },
      { $set: updateData, $inc: { version: 1 } },
      { new: true }
    );
    res.status(200).json({ success: true, message: "Section updated", data: updatedContent });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
};

// 6. PUT: Toggle publish
// Endpoint: /care/sub/toggle-publish
exports.togglePublish = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCareProgramPermission(subAdmin, 'edit');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to edit care program content"
        });
      }
    }

    const { isPublished } = req.body;
    const updatedContent = await CareProgramContent.findOneAndUpdate(
      { pageName: "CareProgramPage" },
      { $set: { isPublished }, $inc: { version: 1 } },
      { new: true }
    );
    res.status(200).json({ success: true, message: `Status changed`, data: updatedContent });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
};

// ==========================================
//            IMAGE UPLOADS APIs
// ==========================================

// 7. Upload Banner
// Endpoint: /care/sub/upload/banner
exports.uploadBannerImage = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCareProgramPermission(subAdmin, 'edit');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to upload images"
        });
      }
    }

    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    
    const content = await CareProgramContent.findOne({ pageName: "CareProgramPage" });
    if (content) {
      content.heroSection.bannerImage = {
        url: getImageUrl(req.file.path),
        altText: req.body.altText || "Banner Image",
        dimensions: getImageDimensions(req.file.path)
      };
      content.version += 1;
      await content.save();
    }
    
    res.status(200).json({ success: true, message: "Banner uploaded", data: content.heroSection.bannerImage });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
};

// 8. Upload Doctor Image (Single)
// Endpoint: /care/sub/upload/doctor
exports.uploadDoctorImage = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCareProgramPermission(subAdmin, 'edit');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to upload images"
        });
      }
    }

    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    res.status(200).json({
      success: true,
      message: "Uploaded",
      data: { url: getImageUrl(req.file.path), filename: path.basename(req.file.filename) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
};

// 9. Upload Feature Image (Single)
// Endpoint: /care/sub/upload/feature
exports.uploadFeatureImage = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCareProgramPermission(subAdmin, 'edit');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to upload images"
        });
      }
    }

    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    res.status(200).json({
      success: true,
      message: "Uploaded",
      data: { url: getImageUrl(req.file.path), filename: path.basename(req.file.filename) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
};

// 10. Upload Side Image
// Endpoint: /care/sub/upload/side-image
exports.uploadSideImage = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCareProgramPermission(subAdmin, 'edit');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to upload images"
        });
      }
    }

    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const content = await CareProgramContent.findOne({ pageName: "CareProgramPage" });
    if (content) {
      content.doctorSlider.sideImage = { url: getImageUrl(req.file.path), altText: req.body.altText || "Side Image" };
      content.version += 1;
      await content.save();
    }
    res.status(200).json({ success: true, message: "Side image uploaded", data: content.doctorSlider.sideImage });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
};

// 11. Update Doctor with Image (Existing Doctor)
// Endpoint: /care/sub/doctor/update
exports.updateDoctorWithImage = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCareProgramPermission(subAdmin, 'edit');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to update doctors"
        });
      }
    }

    const { doctorId, name, testimonial, location, bgColor, borderColor } = req.body;
    if (!doctorId) return res.status(400).json({ success: false, message: "Doctor ID required" });
    
    const content = await CareProgramContent.findOne({ pageName: "CareProgramPage" });
    const doctor = content.doctorSlider.doctors.id(doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });
    
    if (name) doctor.name = name;
    if (testimonial) doctor.testimonial = testimonial;
    if (location) doctor.location = location;
    if (bgColor) doctor.bgColor = bgColor;
    if (borderColor) doctor.borderColor = borderColor;
    
    if (req.file) {
      doctor.image = { url: getImageUrl(req.file.path), altText: req.body.altText || doctor.name };
    }
    content.version += 1;
    await content.save();
    res.status(200).json({ success: true, message: "Doctor updated", data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
};

// 12. Update Feature with Image
// Endpoint: /care/sub/feature/update
exports.updateFeatureWithImage = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCareProgramPermission(subAdmin, 'edit');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to update features"
        });
      }
    }

    const { featureId, title, description, bgColor } = req.body;
    if (!featureId) return res.status(400).json({ success: false, message: "Feature ID required" });
    
    const content = await CareProgramContent.findOne({ pageName: "CareProgramPage" });
    const feature = content.programFeatures.features.id(featureId);
    if (!feature) return res.status(404).json({ success: false, message: "Feature not found" });
    
    if (title) feature.title = title;
    if (description) feature.description = description;
    if (bgColor) feature.bgColor = bgColor;
    
    if (req.file) {
      feature.image = { url: getImageUrl(req.file.path), altText: req.body.altText || feature.title };
    }
    content.version += 1;
    await content.save();
    res.status(200).json({ success: true, message: "Feature updated", data: feature });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
};

// 13. Update Banner with Image
// Endpoint: /care/sub/banner/update
exports.updateBannerWithImage = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCareProgramPermission(subAdmin, 'edit');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to update banner"
        });
      }
    }

    const content = await CareProgramContent.findOne({ pageName: "CareProgramPage" });
    if (req.file) {
      content.heroSection.bannerImage = { url: getImageUrl(req.file.path), altText: req.body.altText || "Banner" };
    } else if (req.body.altText) {
      content.heroSection.bannerImage.altText = req.body.altText;
    }
    content.version += 1;
    await content.save();
    res.status(200).json({ success: true, message: "Banner updated", data: content.heroSection.bannerImage });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
};

// 14. Upload Multiple Images
// Endpoint: /care/sub/upload/multiple
exports.uploadMultipleImages = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCareProgramPermission(subAdmin, 'edit');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to upload images"
        });
      }
    }

    if (!req.files?.length) return res.status(400).json({ success: false, message: "No files" });
    const images = req.files.map(file => ({ url: getImageUrl(file.path), filename: file.filename }));
    res.status(200).json({ success: true, data: images });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
};

// 15. Upload Multiple Doctors
// Endpoint: /care/sub/upload/doctors/multiple
exports.uploadMultipleDoctors = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCareProgramPermission(subAdmin, 'edit');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to upload doctors"
        });
      }
    }

    if (!req.files?.length) return res.status(400).json({ success: false, message: "No files" });
    const content = await CareProgramContent.findOne({ pageName: "CareProgramPage" });
    const docs = req.files.map((file, i) => ({
      name: `Doctor ${i+1}`, image: { url: getImageUrl(file.path), altText: "Doc" },
      order: content.doctorSlider.doctors.length + i + 1
    }));
    content.doctorSlider.doctors.push(...docs);
    await content.save();
    res.status(200).json({ success: true, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
};

// 16. Upload Multiple Features
// Endpoint: /care/sub/upload/features/multiple
exports.uploadMultipleFeatures = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCareProgramPermission(subAdmin, 'edit');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to upload features"
        });
      }
    }

    if (!req.files?.length) return res.status(400).json({ success: false, message: "No files" });
    const content = await CareProgramContent.findOne({ pageName: "CareProgramPage" });
    const feats = req.files.map((file, i) => ({
      title: `Feature ${i+1}`, image: { url: getImageUrl(file.path), altText: "Feat" },
      order: content.programFeatures.features.length + i + 1
    }));
    content.programFeatures.features.push(...feats);
    await content.save();
    res.status(200).json({ success: true, data: feats });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
};

// 17. Mixed Upload
// Endpoint: /care/sub/upload/mixed
exports.handleMixedUpload = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCareProgramPermission(subAdmin, 'edit');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to upload mixed content"
        });
      }
    }

    const results = {};
    if (req.files.bannerImage) results.banner = getImageUrl(req.files.bannerImage[0].path);
    if (req.files.sideImage) results.side = getImageUrl(req.files.sideImage[0].path);
    if (req.files.doctorImages) results.doctorImages = req.files.doctorImages.map(f => ({ url: getImageUrl(f.path) }));
    if (req.files.featureImages) results.featureImages = req.files.featureImages.map(f => ({ url: getImageUrl(f.path) }));
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
};

// ==========================================
//          CREATE NEW ITEMS (ADD)
// ==========================================

// 21. Add Program Feature (Dynamic & Image)
// Endpoint: /care/sub/add-feature
exports.addProgramFeature = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCareProgramPermission(subAdmin, 'create');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to create features"
        });
      }
    }

    let featureData = req.body;
    if(req.body.data) {
        try { featureData = JSON.parse(req.body.data); } catch(e){}
    }
    
    const content = await CareProgramContent.findOne({ pageName: "CareProgramPage" });
    
    const newFeature = {
      title: featureData.title || "New Feature",
      description: featureData.description || "Description",
      number: featureData.number || `${content.programFeatures.features.length + 1}`,
      bgColor: featureData.bgColor || "primary",
      image: { url: "", altText: featureData.title },
      order: content.programFeatures.features.length + 1
    };

    if(req.file) {
        newFeature.image.url = getImageUrl(req.file.path);
    }

    content.programFeatures.features.push(newFeature);
    content.version += 1;
    await content.save();

    res.status(201).json({ success: true, message: "Feature added", data: content.programFeatures });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
};

// 22. Add Doctor to Slider (Dynamic & Image)
// Endpoint: /care/sub/add-doctor
exports.addDoctorToSlider = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCareProgramPermission(subAdmin, 'create');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to create doctors"
        });
      }
    }

    let doctorData = req.body;
    if(req.body.data) {
        try { doctorData = JSON.parse(req.body.data); } catch(e){}
    }

    const content = await CareProgramContent.findOne({ pageName: "CareProgramPage" });
    
    const newDoctor = {
      name: doctorData.name || "New Doctor",
      testimonial: doctorData.testimonial || "Testimonial",
      location: doctorData.location || "Location",
      bgColor: doctorData.bgColor || "#e7faf8",
      borderColor: doctorData.borderColor || "success",
      image: { url: "", altText: doctorData.name },
      order: content.doctorSlider.doctors.length + 1
    };

    if(req.file) {
        newDoctor.image.url = getImageUrl(req.file.path);
    }

    content.doctorSlider.doctors.push(newDoctor);
    content.version += 1;
    await content.save();

    res.status(201).json({ success: true, message: "Doctor added", data: content.doctorSlider });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
};

// 23. Add Stat (No Image, Simple Text)
// Endpoint: /care/sub/add-stat
exports.addStat = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCareProgramPermission(subAdmin, 'create');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to create stats"
        });
      }
    }

    const { stat } = req.body;
    if (!stat || !stat.value) return res.status(400).json({ success: false, message: "Stat value required" });

    const content = await CareProgramContent.findOne({ pageName: "CareProgramPage" });
    const newStat = {
      value: stat.value,
      label: stat.label || "",
      color: stat.color || "primary",
      order: content.statsSection.stats.length + 1
    };

    content.statsSection.stats.push(newStat);
    content.version += 1;
    await content.save();

    res.status(201).json({ success: true, message: "Stat added", data: content.statsSection });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
};

// ==========================================
//           DELETE & REORDER & GET
// ==========================================

// 24. Delete Feature
// Endpoint: /care/sub/feature/:featureId
exports.deleteFeature = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCareProgramPermission(subAdmin, 'delete');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to delete features"
        });
      }
    }

    const content = await CareProgramContent.findOne({ pageName: "CareProgramPage" });
    content.programFeatures.features.pull({ _id: req.params.featureId });
    content.version += 1;
    await content.save();
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
};

// 25. Delete Doctor
// Endpoint: /care/sub/doctor/:doctorId
exports.deleteDoctor = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCareProgramPermission(subAdmin, 'delete');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to delete doctors"
        });
      }
    }

    const content = await CareProgramContent.findOne({ pageName: "CareProgramPage" });
    content.doctorSlider.doctors.pull({ _id: req.params.doctorId });
    content.version += 1;
    await content.save();
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
};

// 26. Delete Stat
// Endpoint: /care/sub/stat/:statId
exports.deleteStat = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCareProgramPermission(subAdmin, 'delete');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to delete stats"
        });
      }
    }

    const content = await CareProgramContent.findOne({ pageName: "CareProgramPage" });
    content.statsSection.stats.pull({ _id: req.params.statId });
    content.version += 1;
    await content.save();
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
};

// 27. Reorder Features
// Endpoint: /care/sub/reorder/features
exports.reorderFeatures = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCareProgramPermission(subAdmin, 'edit');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to reorder features"
        });
      }
    }

    const content = await CareProgramContent.findOne({ pageName: "CareProgramPage" });
    req.body.featureIds.forEach((id, idx) => {
      const item = content.programFeatures.features.id(id);
      if(item) item.order = idx + 1;
    });
    content.programFeatures.features.sort((a, b) => a.order - b.order);
    await content.save();
    res.status(200).json({ success: true, data: content.programFeatures.features });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
};

// 28. Reorder Doctors
// Endpoint: /care/sub/reorder/doctors
exports.reorderDoctors = async (req, res) => {
    try {
        // 🔐 PERMISSION CHECK FOR SUBADMIN
        const subAdmin = req.subAdmin;
        if (subAdmin) {
          const permissionCheck = checkCareProgramPermission(subAdmin, 'edit');
          if (!permissionCheck.allowed) {
            return res.status(403).json({
              success: false,
              message: permissionCheck.message || "No permission to reorder doctors"
            });
          }
        }

        const content = await CareProgramContent.findOne({ pageName: "CareProgramPage" });
        req.body.doctorIds.forEach((id, idx) => {
          const item = content.doctorSlider.doctors.id(id);
          if(item) item.order = idx + 1;
        });
        content.doctorSlider.doctors.sort((a, b) => a.order - b.order);
        await content.save();
        res.status(200).json({ success: true, data: content.doctorSlider.doctors });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error", error: error.message });
    }
};

// 29. Reorder Stats
// Endpoint: /care/sub/reorder/stats
exports.reorderStats = async (req, res) => {
    try {
        // 🔐 PERMISSION CHECK FOR SUBADMIN
        const subAdmin = req.subAdmin;
        if (subAdmin) {
          const permissionCheck = checkCareProgramPermission(subAdmin, 'edit');
          if (!permissionCheck.allowed) {
            return res.status(403).json({
              success: false,
              message: permissionCheck.message || "No permission to reorder stats"
            });
          }
        }

        const content = await CareProgramContent.findOne({ pageName: "CareProgramPage" });
        req.body.statIds.forEach((id, idx) => {
          const item = content.statsSection.stats.id(id);
          if(item) item.order = idx + 1;
        });
        content.statsSection.stats.sort((a, b) => a.order - b.order);
        await content.save();
        res.status(200).json({ success: true, data: content.statsSection.stats });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error", error: error.message });
    }
};

// 30. Get Feature by ID
// Endpoint: /care/sub/feature/:featureId
exports.getFeatureById = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCareProgramPermission(subAdmin, 'view');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to view features"
        });
      }
    }

    const content = await CareProgramContent.findOne({ pageName: "CareProgramPage" });
    const item = content.programFeatures.features.id(req.params.featureId);
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
};

// 31. Get Doctor by ID
// Endpoint: /care/sub/doctor/:doctorId
exports.getDoctorById = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCareProgramPermission(subAdmin, 'view');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to view doctors"
        });
      }
    }

    const content = await CareProgramContent.findOne({ pageName: "CareProgramPage" });
    const item = content.doctorSlider.doctors.id(req.params.doctorId);
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
};

// 32. Get Stat by ID
// Endpoint: /care/sub/stat/:statId
exports.getStatById = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCareProgramPermission(subAdmin, 'view');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to view stats"
        });
      }
    }

    const content = await CareProgramContent.findOne({ pageName: "CareProgramPage" });
    const item = content.statsSection.stats.id(req.params.statId);
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
};

// 33. Delete Image
// Endpoint: /care/sub/image
exports.deleteImage = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkCareProgramPermission(subAdmin, 'delete');
      if (!permissionCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: permissionCheck.message || "No permission to delete images"
        });
      }
    }

    const filePath = req.body.imagePath ? (req.body.imagePath.startsWith('/') ? req.body.imagePath.slice(1) : req.body.imagePath) : null;
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.status(200).json({ success: true, message: "Image deleted" });
    } else {
      res.status(404).json({ success: false, message: "Image not found" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
};

// 34. Get All Images
// Endpoint: /care/sub/images
exports.getAllImages = async (req, res) => {
    try {
        // 🔐 PERMISSION CHECK FOR SUBADMIN
        const subAdmin = req.subAdmin;
        if (subAdmin) {
          const permissionCheck = checkCareProgramPermission(subAdmin, 'view');
          if (!permissionCheck.allowed) {
            return res.status(403).json({
              success: false,
              message: permissionCheck.message || "No permission to view images"
            });
          }
        }

        const type = req.query.type;
        const dirs = type ? [`uploads/care-program/${type}/`] : ["doctors", "features", "banner", "side-images"].map(d=>`uploads/care-program/${d}/`);
        let all = [];
        dirs.forEach(d => {
            if(fs.existsSync(d)) fs.readdirSync(d).filter(f=>/\.(jpg|jpeg|png|webp|svg)$/i.test(f)).forEach(f=>all.push({url: `/${d}${f}`, filename: f}));
        });
        res.status(200).json({ success: true, data: all });
    } catch (e) {
        res.status(500).json({success: false, error: e.message});
    }
};

// 35. Get Images By Type
// Endpoint: /care/sub/images/:type
exports.getImagesByType = async (req, res) => {
    req.query.type = req.params.type;
    return exports.getAllImages(req, res);
};
