const mongoose = require('mongoose');
const Brand = require('../../../modal/brandImagePgarmacy');
const fs = require('fs');
const path = require('path');
 
// =============================================
// HELPER FUNCTION FOR PERMISSION CHECKING
// =============================================
const checkPermission = (subAdmin, permissionType) => {
  if (!subAdmin) {
    return {
      allowed: false,
      message: "Sub-admin not authenticated"
    };
  }
 
  // Check for brand-specific permissions (if you want separate)
  if (subAdmin.permissions?.brands?.[permissionType]) {
    return { allowed: true };
  }
 
  // OR check for general users permissions (as in your previous code)
  if (subAdmin.permissions?.users?.[permissionType]) {
    return { allowed: true };
  }
 
  // OR check for products permissions (depends on your structure)
  if (subAdmin.permissions?.products?.[permissionType]) {
    return { allowed: true };
  }
 
  return {
    allowed: false,
    message: `No permission to ${permissionType} brands`
  };
};
 
// =============================================
// 1. CREATE BRAND (ADD PERMISSION)
// Endpoint: /subadmin/upload-image-brand/sub/add
// =============================================
exports.createBrand = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK
    const subAdmin = req.subAdmin;
    const permissionCheck = checkPermission(subAdmin, 'create');
    if (!permissionCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: permissionCheck.message || "No permission to create brands"
      });
    }
 
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image upload karna zaroori hai"
      });
    }
 
    console.log('Raw file path from multer:', req.file.path);
   
    let imagePath = req.file.path;
    imagePath = imagePath.replace(/\\/g, '/');
   
    if (imagePath.startsWith('./')) {
      imagePath = imagePath.substring(2);
    }
   
    if (!imagePath.startsWith('uploads/user/brandImage/')) {
      const filename = path.basename(imagePath);
      imagePath = `uploads/user/brandImage/${filename}`;
    }
   
    console.log('Clean path for database:', imagePath);
 
    const newBrand = new Brand({
      brandName: req.body.brandName || "",
      brandImage: imagePath,
      createdBy: subAdmin?._id // Optional: Track who created
    });
 
    const savedBrand = await newBrand.save();
   
    // Generate full URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const brandImageUrl = `${baseUrl}/${imagePath}`;
   
    const responseData = {
      ...savedBrand.toObject(),
      brandImageUrl: brandImageUrl
    };
   
    console.log('Final URL for browser:', brandImageUrl);
   
    res.status(201).json({
      success: true,
      message: "Brand added successfully",
      brand: responseData
    });
  } catch (error) {
    console.error('Create Brand Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
 
// =============================================
// 2. READ ALL BRANDS (ADD PERMISSION)
// Endpoint: /subadmin/upload-image-brand/sub/get-all
// =============================================
exports.getBrands = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK
    const subAdmin = req.subAdmin;
    const permissionCheck = checkPermission(subAdmin, 'view');
    if (!permissionCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: permissionCheck.message || "No permission to view brands"
      });
    }
 
    const brands = await Brand.find().sort({ createdAt: -1 });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
   
    const brandsWithUrls = brands.map(brand => {
      const brandObj = brand.toObject();
     
      // Clean path if needed
      let imagePath = brandObj.brandImage || '';
      imagePath = imagePath.replace(/\\/g, '/');
     
      // Generate URL
      const brandImageUrl = imagePath ? `${baseUrl}/${imagePath}` : null;
     
      return {
        ...brandObj,
        brandImageUrl: brandImageUrl
      };
    });
   
    res.status(200).json({
      success: true,
      count: brandsWithUrls.length,
      data: brandsWithUrls
    });
  } catch (error) {
    console.error('Get Brands Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
 
 
 
// =============================================
// 4. UPDATE BRAND (ADD PERMISSION)
// Endpoint: /subadmin/upload-image-brand/sub/update/:id
// =============================================
exports.updateBrand = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK
    const subAdmin = req.subAdmin;
    const permissionCheck = checkPermission(subAdmin, 'edit');
    if (!permissionCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: permissionCheck.message || "No permission to edit brands"
      });
    }
 
    const { id } = req.params;
    const { brandName } = req.body;
   
    let updateData = {};
   
    if (brandName !== undefined) updateData.brandName = brandName;
 
    if (req.file) {
      // Process the new image path
      let imagePath = req.file.path;
      imagePath = imagePath.replace(/\\/g, '/');
     
      if (imagePath.startsWith('./')) {
        imagePath = imagePath.substring(2);
      }
     
      // Ensure consistent path format
      if (!imagePath.startsWith('uploads/user/brandImage/')) {
        const filename = path.basename(imagePath);
        imagePath = `uploads/user/brandImage/${filename}`;
      }
     
      updateData.brandImage = imagePath;
 
      // Delete old image
      const oldBrand = await Brand.findById(id);
      if (oldBrand && oldBrand.brandImage) {
        const oldImagePath = path.resolve(oldBrand.brandImage);
       
        if (fs.existsSync(oldImagePath)) {
          fs.unlink(oldImagePath, (err) => {
            if (err) console.error("Old image delete failed:", err);
          });
        }
      }
    }
 
    // Add updatedBy field
    updateData.updatedBy = subAdmin?._id;
   
    const updatedBrand = await Brand.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );
   
    if (!updatedBrand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found"
      });
    }
   
    // Generate URL for response
    const brandObj = updatedBrand.toObject();
    let brandImageUrl = null;
   
    if (brandObj.brandImage) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const cleanPath = brandObj.brandImage.replace(/\\/g, '/');
      brandImageUrl = `${baseUrl}/${cleanPath}`;
    }
   
    res.status(200).json({
      success: true,
      message: "Brand updated successfully",
      brand: {
        ...brandObj,
        brandImageUrl: brandImageUrl
      }
    });
  } catch (error) {
    console.error('Update Brand Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
 
// =============================================
// 5. DELETE BRAND (ADD PERMISSION)
// Endpoint: /subadmin/upload-image-brand/sub/delete/:id
// =============================================
exports.deleteBrand = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK
    const subAdmin = req.subAdmin;
    const permissionCheck = checkPermission(subAdmin, 'delete');
    if (!permissionCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: permissionCheck.message || "No permission to delete brands"
      });
    }
 
    const { id } = req.params;
    const brand = await Brand.findById(id);
   
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found"
      });
    }
 
    // Delete image file
    if (brand.brandImage) {
      const imagePath = path.resolve(brand.brandImage);
     
      if (fs.existsSync(imagePath)) {
        fs.unlink(imagePath, (err) => {
          if (err) console.error("File deletion error:", err);
        });
      }
    }
 
    await Brand.findByIdAndDelete(id);
   
    res.status(200).json({
      success: true,
      message: "Brand deleted successfully"
    });
  } catch (error) {
    console.error('Delete Brand Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
 