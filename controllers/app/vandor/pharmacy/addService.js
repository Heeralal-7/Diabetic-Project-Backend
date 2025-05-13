const Service = require("../../../../modal/addServices");

//create service
//Method:Post
//Endpoints:/services/create
const addService = async (req, res) => {
  try {
    // Required fields from body
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

    // ✅ Check for missing fields (undefined or empty string)
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

    // ✅ Validate files (if photos are required)
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: 0,
        message: "At least one photo is required.",
      });
    }

    const photoPaths = req.files.map((file) => `/vendor/photo/${file.filename}`);

    // ✅ Ensure req.user exists (token middleware must set it)
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: 0,
        message: "Unauthorized: Vendor token missing or invalid.",
      });
    }

    // ✅ Create service in DB
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

    if (!categoryName) {
      return res.send({
        success: 0,
        message: "categoryName is required",
      });
    }

    const skip = (page - 1) * limit;

    const data = await Service.find({ categoryName, status })
      .skip(skip)
      .limit(parseInt(limit));

    if (!data || data.length === 0) {
      return res.send({
        success: 0,
        message: "No records found",
      });
    }

    return res.send({
      success: 1,
      message: "Fetched successfully",
      details: data,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
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
};
