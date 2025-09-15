const Service = require("../../../../modal/addServices");
const Medicine = require("../../../../modal/MedicineSchema")
const PharmacyMedicine = require("../../../../modal/VendorMedicine");
const vendor = require("../../../../modal/vandor"); // Update path if needed
const ShopTiming = require("../../../../modal/ShopTiming");
const mongoose = require("mongoose");
 
// Create service
// Method: POST
// Endpoint: /services/create
// Create service
// Method: POST
// Endpoint: /services/create
const addService = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Request Body se data nikalein (ab ismein image_url bhi hai)
        const {
            categoryName, name, manufacturers, salt_composition, packaging,
            primary_use, description, salt_synonyms, storage, introduction,
            use_of, benefits, side_effect, how_to_use, how_works,
            safety_advise, if_miss, alternate_brand, manufacturer_address,
            mrp, discountPercentage, stock, prescription_required,
            image_url // ⭐⭐⭐ IMAGE URL FIELD ADDED ⭐⭐⭐
        } = req.body;
        
        // 2. Zaroori Fields ko Validate Karein
        const requiredFields = {
            categoryName, name, manufacturers, packaging, primary_use, description,
            storage, introduction, use_of, benefits, how_to_use, how_works,
            safety_advise, manufacturer_address, mrp, discountPercentage, stock, prescription_required,
            image_url // ⭐⭐⭐ VALIDATION ADDED ⭐⭐⭐
        };

        for (const [key, value] of Object.entries(requiredFields)) {
            if (value === undefined || value === "") {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ success: 0, message: `Field '${key}' zaroori hai.` });
            }
        }

        // 3. Vendor Authentication Check Karein (No change)
        if (!req.user || !req.user._id) {
            await session.abortTransaction(); session.endSession();
            return res.status(401).json({ success: 0, message: "Unauthorized: Vendor token nahi mila ya invalid hai." });
        }
        const vendorId = req.user._id;

        // 4. Sequential ID Generate Karein (No change)
        const lastMedicine = await Medicine.findOne().sort({ Id: -1 }).session(session);
        const newId = (lastMedicine && lastMedicine.Id) ? parseInt(lastMedicine.Id, 10) + 1 : 7001;

        // 5. ⭐⭐⭐ REMOVED: File Uploads ko Handle Karein - Ab Zaroori Nahi ⭐⭐⭐
        // const photoPaths = req.files?.map((file) => `/vendor/photo/${file.filename}`) || [];
        
        // 5. ⭐⭐⭐ ADDED: Process Image URLs from Text ⭐⭐⭐
        const imageUrlArray = typeof image_url === 'string' && image_url.trim() !== ''
            ? image_url.split(',').map(url => url.trim())
            : [];

        // 6. Best Price ko Calculate Karein (No change)
        const numericMrp = parseFloat(mrp);
        const numericDiscount = parseFloat(discountPercentage);
        if (isNaN(numericMrp) || isNaN(numericDiscount)) {
            await session.abortTransaction(); session.endSession();
            return res.status(400).json({ success: 0, message: "MRP aur discountPercentage valid numbers hone chahiye." });
        }
        const calculatedBestPrice = numericMrp * (1 - numericDiscount / 100);
        const best_price_str = calculatedBestPrice.toFixed(2);

        // 7. Medicine collection mein naya object banayein
        const newMedicine = new Medicine({
            Id: newId,
            name,
            manufacturers,
            salt_composition: salt_composition || "N/A",
            packaging,
            mrp: String(numericMrp.toFixed(2)),
            best_price: best_price_str,
            discont_percent: `${numericDiscount}%`,
            prescription_required: prescription_required,
            image_url: imageUrlArray, // ⭐⭐⭐ USE THE NEW ARRAY ⭐⭐⭐
            primary_use,
            description,
            salt_synonyms: salt_synonyms || "N/A",
            storage,
            introduction,
            use_of,
            benefits,
            side_effect: side_effect || "No known side effects.",
            how_to_use,
            how_works,
            safety_advise,
            if_miss: if_miss || "Consult your doctor.",
            alternate_brand: alternate_brand || "N/A",
            manufacturer_address,
            bread_crumb: `${categoryName} > ${name}`,
            url: `/medicines/${name.toLowerCase().replace(/\s+/g, '-')}-${newId}`,
            for_sale: "ADD TO CART",
            onStatus: "0",
            // Other fields remain the same
        });

        const savedMedicine = await newMedicine.save({ session });
        
        // 8. Vendor-Specific Medicine Data (PharmacyMedicine) Banayein
        // FIX: Use PharmacyMedicine schema, not Medicine
        await PharmacyMedicine.create([{ 
            medicineId: savedMedicine._id,
            vendorId,
            stock: parseInt(stock, 10),
            discount_seller: numericDiscount,
            vendorPrice: parseFloat(best_price_str),
            onStatus: "0",
        }], { session });

        // 9. Transaction Commit
        await session.commitTransaction();
        session.endSession();

        // 10. Response
        return res.status(201).json({
            success: 1,
            message: "Medicine safaltapoorvak banayi gayi. Approval ka intezar hai.",
            details: savedMedicine.toObject(),
        });

    } catch (error) {
        // Error Handling
        await session.abortTransaction();
        session.endSession();
        console.error("Add Medicine Error:", error);
        if (error.code === 11000) {
            return res.status(409).json({ success: 0, message: "Ek medicine is ID ke saath pehle se hi hai." });
        }
        return res.status(500).json({ success: 0, message: "Internal server error", error: error.message });
    }
};

 
 
// Get medicine data uploaded from Excel
// Method: GET
// Endpoint: /services/getMedicine
const getMedicineData = async (req, res) => {
  try {
    // We are fetching all data, so page and limit from req.query are no longer needed for the database query.
    
    const medicines = await Medicine.find();
    const totalCount = medicines.length;
 
    if (!medicines || totalCount === 0) {
      return res.status(200).json({
        success: 0,
        message: "No medicine records found.",
      });
    }
 
    return res.status(200).json({
      success: 1,
      message: "All medicine data fetched successfully",
      totalCount,
      currentPage: 1, // Since all data is on one page
      pageSize: totalCount, // The size of the page is the total number of items
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
 
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({
        success: 0,
        message: "Medicine not found",
      });
    }
 
    const basePrice = parseFloat(medicine.mrp || "0"); // बेहतर होगा mrp ही use करें
    const discountAmount = (basePrice * discount_seller) / 100;
    const updatedPrice = (basePrice - discountAmount).toFixed(2);
 
    const updated = await PharmacyMedicine.findOneAndUpdate(
      { medicineId, vendorId: req.user._id },
      {
        stock,
        discount_seller,
        vendorPrice: updatedPrice,
        onStatus: "1"  // यहाँ डिफॉल्ट स्टेटस 1 (approved) सेट कर दिया
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
// Endpoint: /services/vendor-medicine
// Get medicines for a specific vendor (stock > 0)
// Method: GET
// Endpoint: /services/vendor-medicine
const getVendorMedicines = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: 0, message: "Unauthorized" });
    }
 
    // Step 1: Get all pharmacy medicine entries for this vendor
    const vendorMeds = await PharmacyMedicine.find({
      vendorId: req.user._id,
      stock: { $gt: 0 },
      onStatus: "1",
    });
 
    if (!vendorMeds || vendorMeds.length === 0) {
      return res.status(200).json({
        success: 1,
        message: "No medicines found for this vendor",
        totalCount: 0,
        details: [],
      });
    }
 
    // Separate medicineIds into two groups: those that exist in Service and those in Medicine
    const medicineIds = vendorMeds.map((item) => item.medicineId);
    const [serviceMeds, generalMeds] = await Promise.all([
      Service.find({ _id: { $in: medicineIds } }),
      Medicine.find({ _id: { $in: medicineIds } }),
    ]);
 
    // Create a map for vendorMeds for fast access
    const vendorMap = {};
    vendorMeds.forEach((item) => {
      vendorMap[item.medicineId.toString()] = item;
    });
 
    const formattedServiceMeds = serviceMeds.map((med) => {
      const vendorEntry = vendorMap[med._id.toString()];
      const basePrice = parseFloat(med.bestPrice || "0");
      const discountAmount = (basePrice * vendorEntry.discount_seller) / 100;
      const updatedPrice = (basePrice - discountAmount).toFixed(2);
 
      return {
        ...med.toObject(),
        vendorStock: vendorEntry.stock,
        vendorDiscount: vendorEntry.discount_seller,
        vendorPrice: updatedPrice,
        source: "service",
      };
    });
 
    const formattedGeneralMeds = generalMeds.map((med) => {
      const vendorEntry = vendorMap[med._id.toString()];
      const basePrice = parseFloat(med.best_price || "0");
      const discountAmount = (basePrice * vendorEntry.discount_seller) / 100;
      const updatedPrice = (basePrice - discountAmount).toFixed(2);
 
      return {
        ...med.toObject(),
        vendorStock: vendorEntry.stock,
        vendorDiscount: vendorEntry.discount_seller,
        vendorPrice: updatedPrice,
        source: "medicine",
      };
    });
 
    // Combine both arrays
    const allResults = [...formattedServiceMeds, ...formattedGeneralMeds];
    return res.status(200).json({
      success: 1,
      message: "Vendor medicines fetched successfully",
      totalCount: allResults.length,
      details: allResults,
    });
  } catch (error) {
    console.error("getVendorMedicines error:", error);
    return res.status(500).json({ success: 0, message: "Internal error", error: error.message });
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
      stock,
      mrp,
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
        quantity: stock,
        mrp,
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
 
 // Add or Update Shop Timing (tested = ok)
// Method: POST
// Endpoint: /services/shop-timing/add
const addOrUpdateShopTiming = async (req, res) => {
  try {
    const { day, openingTime, closingTime, isClosed, description } = req.body;

    if (!day) {
      return res.status(400).json({
        success: 0,
        message: "Day is required",
      });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: 0,
        message: "Unauthorized: Vendor token missing or invalid.",
      });
    }

    const existingTiming = await ShopTiming.findOne({
      shopId: req.user._id,
      day: day,
    });

    const timingData = {
      openingTime: isClosed ? null : openingTime,
      closingTime: isClosed ? null : closingTime,
      isClosed: isClosed || false,
      description: description || "", // Added description handling
    };

    if (existingTiming) {
      const updatedTiming = await ShopTiming.findByIdAndUpdate(
        existingTiming._id,
        timingData,
        { new: true }
      );

      return res.status(200).json({
        success: 1,
        message: "Shop timing updated successfully",
        data: updatedTiming,
      });
    } else {
      const newTiming = await ShopTiming.create({
        shopId: req.user._id,
        day,
        ...timingData,
      });

      return res.status(201).json({
        success: 1,
        message: "Shop timing added successfully",
        data: newTiming,
      });
    }
  } catch (error) {
    console.error("Add/Update Shop Timing Error:", error);
    return res.status(500).json({
      success: 0,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get All Shop Timings for a Vendor
// Method: GET
// Endpoint: /services/shop-timing/get
const getShopTimings = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: 0,
        message: "Unauthorized: Vendor token missing or invalid.",
      });
    }

    const timings = await ShopTiming.find({ shopId: req.user._id });

    if (!timings || timings.length === 0) {
      const daysOfWeek = [
        "Monday", "Tuesday", "Wednesday", 
        "Thursday", "Friday", "Saturday", "Sunday"
      ];

      const defaultTimings = daysOfWeek.map((day) => ({
        shopId: req.user._id,
        day,
        openingTime: "09:00 AM",
        closingTime: "06:00 PM",
        isClosed: false,
        description: "Regular business hours", // Default description
      }));

      return res.status(200).json({
        success: 1,
        message: "Default shop timings returned",
        data: defaultTimings,
      });
    }

    return res.status(200).json({
      success: 1,
      message: "Shop timings fetched successfully",
      data: timings,
    });
  } catch (error) {
    console.error("Get Shop Timings Error:", error);
    return res.status(500).json({
      success: 0,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete Shop Timing
// Method: DELETE
// Endpoint: /services/shop-timing/delete/:id
const deleteShopTiming = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: 0,
        message: "Unauthorized: Vendor token missing or invalid.",
      });
    }

    const timing = await ShopTiming.findOneAndDelete({
      _id: id,
      shopId: req.user._id,
    });

    if (!timing) {
      return res.status(404).json({
        success: 0,
        message: "Shop timing not found or you don't have permission to delete it",
      });
    }

    return res.status(200).json({
      success: 1,
      message: "Shop timing deleted successfully",
    });
  } catch (error) {
    console.error("Delete Shop Timing Error:", error);
    return res.status(500).json({
      success: 0,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Bulk Update Shop Timings 
// Method: POST
// Endpoint: /services/shop-timing/bulk-update
const bulkUpdateShopTimings = async (req, res) => {
  try {
    const { timings } = req.body;

    if (!timings || !Array.isArray(timings)) {
      return res.status(400).json({
        success: 0,
        message: "Timings array is required",
      });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: 0,
        message: "Unauthorized: Vendor token missing or invalid.",
      });
    }

    const results = [];
    for (const timing of timings) {
      const timingData = {
        openingTime: timing.isClosed ? null : timing.openingTime,
        closingTime: timing.isClosed ? null : timing.closingTime,
        isClosed: timing.isClosed || false,
        description: timing.description || "", // Added description handling
      };

      const existingTiming = await ShopTiming.findOne({
        shopId: req.user._id,
        day: timing.day,
      });

      if (existingTiming) {
        const updated = await ShopTiming.findByIdAndUpdate(
          existingTiming._id,
          timingData,
          { new: true }
        );
        results.push(updated);
      } else {
        const newTiming = await ShopTiming.create({
          shopId: req.user._id,
          day: timing.day,
          ...timingData,
        });
        results.push(newTiming);
      }
    }

    return res.status(200).json({
      success: 1,
      message: "Shop timings updated successfully",
      data: results,
    });
  } catch (error) {
    console.error("Bulk Update Shop Timings Error:", error);
    return res.status(500).json({
      success: 0,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get Current Shop Status (Open/Closed)
// Method: GET
// Endpoint: /services/shop-timing/current-status
const getCurrentShopStatus = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: 0,
        message: "Unauthorized: Vendor token missing or invalid.",
      });
    }

    const now = new Date();
    const currentDay = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ][now.getDay()];

    const currentTime = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const todayTiming = await ShopTiming.findOne({
      shopId: req.user._id,
      day: currentDay,
    });

    if (!todayTiming) {
      // No timing set for today - assume open with default hours
      return res.status(200).json({
        success: 1,
        message: "Current shop status",
        data: {
          isOpen: true,
          status: "Open (default hours)",
          nextChange: "06:00 PM",
          currentDay,
          currentTime,
        },
      });
    }

    if (todayTiming.isClosed) {
      return res.status(200).json({
        success: 1,
        message: "Current shop status",
        data: {
          isOpen: false,
          status: "Closed (whole day)",
          nextChange: "Next business day",
          currentDay,
          currentTime,
        },
      });
    }

    // Convert times to comparable format
    const parseTime = (timeStr) => {
      const [time, period] = timeStr.split(" ");
      const [hours, minutes] = time.split(":").map(Number);
      return {
        hours: period === "PM" && hours !== 12 ? hours + 12 : hours,
        minutes,
        original: timeStr,
      };
    };

    const opening = parseTime(todayTiming.openingTime);
    const closing = parseTime(todayTiming.closingTime);
    const current = parseTime(currentTime);

    // Create comparable total minutes
    const currentTotal = current.hours * 60 + current.minutes;
    const openingTotal = opening.hours * 60 + opening.minutes;
    const closingTotal = closing.hours * 60 + closing.minutes;

    const isOpen =
      currentTotal >= openingTotal && currentTotal <= closingTotal;

    return res.status(200).json({
      success: 1,
      message: "Current shop status",
      data: {
        isOpen,
        status: isOpen ? "Open" : "Closed",
        currentHours: `${todayTiming.openingTime} - ${todayTiming.closingTime}`,
        nextChange: isOpen ? todayTiming.closingTime : `Opens at ${todayTiming.openingTime} tomorrow`,
        currentDay,
        currentTime,
      },
    });
  } catch (error) {
    console.error("Get Current Shop Status Error:", error);
    return res.status(500).json({
      success: 0,
      message: "Internal server error",
      error: error.message,
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
  addOrUpdateShopTiming,
  getShopTimings,
  deleteShopTiming,
  bulkUpdateShopTimings,
  getCurrentShopStatus,
};
 
 