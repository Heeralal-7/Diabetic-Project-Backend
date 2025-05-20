const PharmacyProduct = require("../../../../modal/PharmacyProducts")
const PharmacyProductVendor = require("../../../../modal/PharmacyProductVendor")
 
// Create hospital product service
// Method: Post
// Endpoint: /services/hospital/create
const addHospitalProduct = async (req, res) => {
    try {
      const {
        categoryName,
        name,
        manufacturers,
        packaging,
        primaryUse,
        description,
        storage,
        introduction,
        useOf,
        benefits,
        sideEffects,
        howToUse,
        howItWorks,
        safetyAdvice,
        ifMissed,
        alternativeBrand,
        manufacturerAddress,
        productType,
        quantity,
        mrp,
        bestPrice,
        discountPercentage,
        prescriptionRequired,
      } = req.body;
  
      const requiredFields = {
        categoryName,
        name,
        manufacturers,
        packaging,
        primaryUse,
        description,
        storage,
        introduction,
        useOf,
        benefits,
        sideEffects,
        howToUse,
        howItWorks,
        safetyAdvice,
        ifMissed,
        alternativeBrand,
        manufacturerAddress,
        productType,
        quantity,
        mrp,
        bestPrice,
        discountPercentage,
        prescriptionRequired,
      };
  
      for (const [key, value] of Object.entries(requiredFields)) {
        if (value === undefined || value === "") {
          return res.status(400).json({
            success: 0,
            message: `The field '${key}' is required.`,
          });
        }
      }
  
      const photoPaths = req.files.map((file) => `/vendor/photo/${file.filename}`);
  
      if (!req.user || !req.user._id) {
        return res.status(401).json({
          success: 0,
          message: "Unauthorized: Vendor token missing or invalid.",
        });
      }
  
      const data = await HospitalProduct.create({
        categoryName,
        name,
        manufacturers,
        packaging,
        primaryUse,
        description,
        storage,
        introduction,
        useOf,
        benefits,
        sideEffects,
        howToUse,
        howItWorks,
        safetyAdvice,
        ifMissed,
        alternativeBrand,
        manufacturerAddress,
        productType,
        quantity,
        mrp,
        bestPrice,
        discountPercentage,
        photo: photoPaths,
        vendorId: req.user._id,
        prescriptionRequired,
      });
  
      return res.status(201).json({
        success: 1,
        message: "Hospital product created successfully",
        data,
      });
  
    } catch (error) {
      console.error("Add Hospital Product Error:", error);
      return res.status(500).json({
        success: 0,
        message: "Internal server error",
        error: error.message,
      });
    }
  };
  
  // Get hospital products data uploaded from Excel
  // Method: GET
  // Endpoint: /Products/getProducts
  const getHospitalProductsData = async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
  
      const skip = (page - 1) * limit;
      const [products, totalCount] = await Promise.all([
        PharmacyProduct.find().skip(parseInt(skip)).limit(parseInt(limit)),
        PharmacyProduct.countDocuments()
      ]);
  
      if (!products || products.length === 0) {
        return res.status(200).json({
          success: 0,
          message: "No hospital product records found.",
        });
      }
  
      return res.status(200).json({
        success: 1,
        message: "Hospital products data fetched successfully",
        totalCount,
        currentPage: parseInt(page),
        pageSize: parseInt(limit),
        details: products,
      });
    } catch (error) {
      console.error("Get Hospital Products Data Error:", error);
      return res.status(500).json({
        success: 0,
        message: "Internal server error",
        error: error.message,
      });
    }
  };
  
  // Update stock and discount for a specific hospital product
  // Method: POST
  // Endpoint: /Products/update-stock
  const updateHospitalProductStock = async (req, res) => {
    try {
      const { productId, stock, discount_seller = 0 } = req.body;
  
      if (!productId || !stock) {
        return res.status(400).json({
          success: 0,
          message: "productId and stock are required",
        });
      }
  
      if (!req.user || !req.user._id) {
        return res.status(401).json({
          success: 0,
          message: "Unauthorized: Vendor token missing or invalid.",
        });
      }
  
      // Get product base price
      const product = await PharmacyProduct.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: 0,
          message: "Hospital product not found",
        });
      }
  
      const basePrice = parseFloat(product.best_price || "0");
      const discountAmount = (basePrice * discount_seller) / 100;
      const updatedPrice = (basePrice - discountAmount).toFixed(2);
  
      // Save or update stock, discount_seller, and vendorPrice
      const updated = await PharmacyProductVendor.findOneAndUpdate(
        { productId, vendorId: req.user._id },
        {
          stock,
          discount_seller,
          vendorPrice: updatedPrice,
        },
        { upsert: true, new: true }
      );
  
      return res.status(200).json({
        success: 1,
        message: "Stock, discount, and vendor price updated successfully",
        details: updated,
      });
    } catch (error) {
      console.error("Update Error:", error);
      return res.status(500).json({
        success: 0,
        message: "Internal server error",
        error: error.message,
      });
    }
  };
  
  // Get hospital products for a specific vendor (only those with stock > 0)
  // Method: GET
  // Endpoint: /Products/vendor-products
  const getVendorHospitalProducts = async (req, res) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({
          success: 0,
          message: "Unauthorized: Vendor token missing or invalid.",
        });
      }
  
      // Get ALL hospital products
      const products = await PharmacyProduct.find();
  
      // Get vendor-specific products (only those with stock > 0)
      const vendorProducts = await PharmacyProductVendor.find({
        vendorId: req.user._id,
        stock: { $gt: 0 },
      });
  
      const vendorMap = {};
      vendorProducts.forEach((item) => {
        vendorMap[item.productId.toString()] = item;
      });
  
      // Filter products that exist in vendorMap (only those with stock > 0)
      const result = products
        .filter((product) => vendorMap.hasOwnProperty(product._id.toString()))
        .map((product) => {
          const vendorEntry = vendorMap[product._id.toString()];
          const basePrice = parseFloat(product.best_price || "0");
          const discountAmount = (basePrice * vendorEntry.discount_seller) / 100;
          const updatedPrice = (basePrice - discountAmount).toFixed(2);
  
          return {
            ...product.toObject(),
            vendorStock: vendorEntry.stock,
            vendorDiscount: vendorEntry.discount_seller,
            vendorPrice: updatedPrice,
          };
        });
  
      return res.status(200).json({
        success: 1,
        message: "Vendor hospital products fetched successfully",
        totalCount: result.length,
        details: result,
      });
    } catch (error) {
      console.error("Vendor Hospital Product Fetch Error:", error);
      return res.status(500).json({
        success: 0,
        message: "Internal server error",
        error: error.message,
      });
    }
  };
  
  
  module.exports = {
    addHospitalProduct,
    getHospitalProductsData,
    updateHospitalProductStock,
    getVendorHospitalProducts
  };
 