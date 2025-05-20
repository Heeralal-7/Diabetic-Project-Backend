const Service = require("../../../../modal/addServices");
const Medicine = require("../../../../modal/MedicineSchema")
const PharmacyMedicine = require("../../../../modal/VendorMedicine");
 
//create service
//Method:Post
//Endpoints:/services/create
const addService = async (req, res) => {
  try {
    const {
      categoryName,
      name,
      manufacturers,
      saltComposition,
      packaging,
      primaryUse,
      description,
      saltSynonyms,
      storage,
      introduction,
      useOf,
      benefits,
      sideEffects,
      howToUse,
      howItWorks,
      safetyAdvice,
      ifMissed,
      alternativeAddress,
      manufacturingAddress,
      medicineType,
      quantity,
      price,
      bestPrice,
      discountPercentage,
      prescription,
    } = req.body;
 
 
    const requiredFields = {
      categoryName,
      name,
      manufacturers,
      saltComposition,
      packaging,
      primaryUse,
      description,
      saltSynonyms,
      storage,
      introduction,
      useOf,
      benefits,
      sideEffects,
      howToUse,
      howItWorks,
      safetyAdvice,
      ifMissed,
      alternativeAddress,
      manufacturingAddress,
      medicineType,
      quantity,
      price,
      bestPrice,
      discountPercentage,
      prescription,
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
 
 
    const data = await Service.create({
      categoryName,
      name,
      manufacturers,
      saltComposition,
      packaging,
      primaryUse,
      description,
      saltSynonyms,
      storage,
      introduction,
      useOf,
      benefits,
      sideEffects,
      howToUse,
      howItWorks,
      safetyAdvice,
      ifMissed,
      alternativeAddress,
      manufacturingAddress,
      medicineType,
      quantity,
      price,
      bestPrice,
      discountPercentage,
      photo: photoPaths,
      vendorId: req.user._id,
      prescription,
    });
 
    return res.status(201).json({
      success: 1,
      message: "Service created successfully",
      data,
    });
 
  } catch (error) {
    console.error("Add Service Error:", error);
    return res.status(500).json({
      success: 0,
      message: "Internal server error",
      error: error.message,
    });
  }
};
 
// Get medicine data uploaded from Excel
// Method: GET
// Endpoint: /services/getMedicine
const getMedicineData = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
 
    const skip = (page - 1) * limit;
    const [medicines, totalCount] = await Promise.all([
      Medicine.find().skip(parseInt(skip)).limit(parseInt(limit)),
      Medicine.countDocuments()
    ]);
 
    if (!medicines || medicines.length === 0) {
      return res.status(200).json({
        success: 0,
        message: "No medicine records found.",
      });
    }
 
    return res.status(200).json({
      success: 1,
      message: "Medicine data fetched successfully",
      totalCount,
      currentPage: parseInt(page),
      pageSize: parseInt(limit),
      details: medicines,
    });
  } catch (error) {
    console.error("Get Medicine Data Error:", error);
    return res.status(500).json({
      success: 0,
      message: "Internal server error",
      error: error.message,
    });
  }
};
 
// Update stock and discount for a specific medicine
// Method: POST
// Endpoint: /services/medicine/update-stock
const updateStockAndDiscount = async (req, res) => {
  try {
    const { medicineId, stock, discount_seller = 0 } = req.body;
 
    if (!medicineId || !stock) {
      return res.status(400).json({
        success: 0,
        message: "medicineId and stock are required",
      });
    }
 
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: 0,
        message: "Unauthorized: Vendor token missing or invalid.",
      });
    }
 
    // Get medicine base price
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({
        success: 0,
        message: "Medicine not found",
      });
    }
 
    const basePrice = parseFloat(medicine.best_price || "0");
    const discountAmount = (basePrice * discount_seller) / 100;
    const updatedPrice = (basePrice - discountAmount).toFixed(2); // as string
 
    // Save or update stock, discount_seller, and vendorPrice
    const updated = await PharmacyMedicine.findOneAndUpdate(
      { medicineId, vendorId: req.user._id },
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
 
// Get medicines for a specific vendor (stock > 0)
// Method: GET
// Endpoint: /services/vendor/medicines
const getVendorMedicines = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: 0,
        message: "Unauthorized: Vendor token missing or invalid.",
      });
    }
 
    // Step 1: Get vendor-specific medicines where stock > 0
    const vendorMeds = await PharmacyMedicine.find({
      vendorId: req.user._id,
      stock: { $gt: 0 },
    });
 
    const medicineIds = vendorMeds.map((item) => item.medicineId);
    const medicines = await Medicine.find({ _id: { $in: medicineIds } });
 
    const vendorMap = {};
    vendorMeds.forEach((item) => {
      vendorMap[item.medicineId.toString()] = item;
    });
 
    const result = medicines.map((med) => {
      const vendorEntry = vendorMap[med._id.toString()];
      const basePrice = parseFloat(med.best_price || "0");
 
      const discountAmount = (basePrice * vendorEntry.discount_seller) / 100;
      const updatedPrice = (basePrice - discountAmount).toFixed(2);
 
      return {
        ...med.toObject(),
        vendorStock: vendorEntry.stock,
        vendorDiscount: vendorEntry.discount_seller,
        vendorPrice: updatedPrice,
      };
    });
 
    return res.status(200).json({
      success: 1,
      message: "Vendor medicines with stock > 0 fetched successfully",
      totalCount: result.length,
      details: result,
    });
  } catch (error) {
    console.error("Vendor Medicine Fetch Error:", error);
    return res.status(500).json({
      success: 0,
      message: "Internal server error",
      error: error.message,
    });
  }
};
 
 
 
 
 
 
 
 
//Update status
//Method:Get
//Endpoints:/services/update/id
//status 0 for hold or ongoing and 1 for reject
const updateServices = async (req, res) => {
  try {
    const { id } = req.params;
 
   await Service.findByIdAndUpdate(
      id,
      {
        status: 1,
      },
      { new: true }
    );
 
    return res.send({
      success: 1,
      message: "Updated successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};
 
//Get service
//Method:Get
//Endpoints:/services/get
const getServices = async (req, res) => {
  try {
    const { categoryName, status, page = 1, limit = 10 } = req.query;
 
    const allowedCategories = ["Allopathy", "Ayurvedic", "Prescription"];
    if (!categoryName || !allowedCategories.includes(categoryName)) {
      return res.status(400).json({
        success: 0,
        message: "Invalid or missing categoryName. Allowed values: Allopathy, Ayurvedic, Prescription.",
      });
    }
 
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: 0,
        message: "Unauthorized: Vendor token missing or invalid.",
      });
    }
 
    const skip = (page - 1) * limit;
 
    const query = {
      categoryName,
      vendorId: req.user._id,
    };
 
    if (status !== undefined) {
      query.status = parseInt(status);
    }
 
    const data = await Service.find(query)
      .sort({ onStatus: 1, createdAt: -1 }) // sort by onStatus first
      .skip(parseInt(skip))
      .limit(parseInt(limit));
 
    if (!data || data.length === 0) {
      return res.status(200).json({
        success: 0,
        message: "No records found.",
      });
    }
 
    return res.status(200).json({
      success: 1,
      message: "Fetched successfully",
      details: data,
    });
 
  } catch (error) {
    console.error("Get Services Error:", error);
    return res.status(500).json({
      success: 0,
      message: "Internal server error",
      error: error.message,
    });
  }
};
 
 
 
//Search service
//Method:Get
//Endpoints:/services/search
const searchServices = async (req, res) => {
  try {
    const { q } = req.query;
    let query = {};
 
    if (q) {
      const regex = new RegExp(q, "i");
      query = {
        $or: [
          { categoryName: { $regex: regex } },
          { name: { $regex: regex } },
          { manufacturers: { $regex: regex } },
          { medicineType: { $regex: regex } },
        ],
      };
    }
 
    const search = await Service.find(query).sort({ createdAt: -1 });
 
    if (search.length === 0) {
      return res.send({
        success: 0,
        message: "No result found",
      });
    }
 
    return res.send({
      success: 1,
      message: "Results fetched successfully",
      details: search,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};
 
//Edit services
//Method:patch
//Endpoints:/services/edit/:id
const editServices = async (req, res) => {
  try {
    const {
      name,
      manufacturers,
      saltComposition,
      packaging,
      primaryUse,
      description,
      saltSynonyms,
      storage,
      introduction,
      useOf,
      benefits,
      sideEffects,
      howToUse,
      howItWorks,
      safetyAdvice,
      ifMissed,
      alternativeAddress,
      manufacturingAddress,
      medicineType,
      quantity,
      price,
      prescription,
    } = req.body;
    const { id } = req.params;
 
    const data = await Service.findById(id);
 
    if (!data) {
      return res.send({
        success: 0,
        message: "No data found",
      });
    }
 
    const photoPaths = req.files.map(
      (file) => `/vendor/photo/${file.filename}`
    );
 
    const updateData = await Service.findByIdAndUpdate(
      id,
      {
        name,
        manufacturers,
        saltComposition,
        packaging,
        primaryUse,
        description,
        saltSynonyms,
        storage,
        introduction,
        useOf,
        benefits,
        sideEffects,
        howToUse,
        howItWorks,
        safetyAdvice,
        ifMissed,
        alternativeAddress,
        manufacturingAddress,
        medicineType,
        quantity,
        price,
        photo: photoPaths,
        prescription,
      },
      { new: true }
    );
 
    return res.send({
      success: 1,
      message: "Updated successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};
 
 
 
module.exports = {
  addService,
  getServices,
  updateServices,
  searchServices,
  editServices,
  getMedicineData,
  updateStockAndDiscount,
  getVendorMedicines,
};
 
 