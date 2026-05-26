const PharmacyProduct = require("../../../../modal/PharmacyProducts")
const PharmacyProductVendor = require("../../../../modal/PharmacyProductVendor")
const OrderPharmacy = require("../../../../modal/OrderPharmacy");
const Vendor = require("../../../../modal/vandor");
const Driver = require("../../../../modal/driver");


// Create hospital product service
// Method: POST
// Endpoint: /Products/hospital/create
const addHospitalProduct = async (req, res) => {
  try {
    // 1. Get data from request body
    const {
      name,
      manufacturers,
      packaging,
      categoryName, // Frontend se aa raha hai
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
      quantity,
      mrp,
      discountPercentage,
      prescriptionRequired,
      image_url, // Frontend ab string URL bhej raha hai
      // Optional fields jo schema me hain par frontend me shayad nahi
      saltComposition,
      saltSynonyms
    } = req.body;
 
    // 2. Validate required fields
    const requiredFields = { name, manufacturers, mrp };
    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value || value === "") {
        return res.status(400).json({
          success: 0,
          message: `The field '${key}' is required.`,
        });
      }
    }
 
    // 3. Handle Images (Priority to JSON string, fallback to uploaded file)
    let finalImageUrl = "";
    if (image_url) {
      // Agar frontend ne direct link bheja hai
      finalImageUrl = image_url;
    } else if (req.files && req.files.length > 0) {
      // Agar future me wapis file upload use karna ho
      finalImageUrl = `/vendor/photo/${req.files[0].filename}`;
    }
 
    // 4. Verify Vendor Token
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: 0,
        message: "Unauthorized: Vendor token missing or invalid.",
      });
    }
 
    // Calculations
    const numMrp = parseFloat(mrp);
    const numDiscount = discountPercentage ? parseFloat(discountPercentage) : 0;
    const calculatedBestPrice = numMrp * (1 - numDiscount / 100);
 
    // 5. Map req.body to PharmacyProduct Schema fields
    const newProductData = {
      name: name,
      manufacturers: manufacturers,
      salt_composition: saltComposition || "",
      packaging: packaging,
      mrp: mrp,
      // Best price calculation backend pe secure rehta hai
      best_price: calculatedBestPrice.toFixed(2),
      bestPrice: calculatedBestPrice.toFixed(2),
      discont_percent: discountPercentage,
      discount_seller: numDiscount,
      prescription_required: prescriptionRequired,
      image_url: finalImageUrl,
      primary_use: primaryUse, // CategoryName ko primary_use me map kar sakte ho ya ignore kar sakte ho
      description: description,
      salt_synonyms: saltSynonyms || "",
      storage: storage,
      introduction: introduction,
      use_of: useOf,
      benefits: benefits,
      side_effect: sideEffects,
      how_to_use: howToUse,
      how_works: howItWorks,
      safety_advise: safetyAdvice,
      if_miss: ifMissed,
      alternate_brand: alternativeBrand,
      manufacturer_address: manufacturerAddress,
      for_sale: "true", // Defaulting to true
      stock: quantity ? parseInt(quantity) : 0,
      expectedDelivery: "30 Minutes",
      onStatus: "1",
      vendorId: req.user._id,
      // Agar categoryName schema me nahi hai to use bread_crumb me daal sakte hain temporary
      bread_crumb: categoryName
    };
 
    // 6. Save to Database
    const data = await PharmacyProduct.create(newProductData);
 
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
// Get hospital products data uploaded from Excel
  // Method: GET
  // Endpoint: /Products/getProducts
 // Get hospital products data uploaded from Excel
  // Method: GET
  // Endpoint: /Products/getProducts
  const getHospitalProductsData = async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;
  
      // --- FINAL QUERY LOGIC ---
      const query = {
        // 1. PRIMARY USE CHECK (Case Insensitive)
        // Ye logic "Hospital Equipment", "Hospital equipment", 
        // ya agar future me "Medical Equipment" aata hai to usse bhi cover karega.
        // Hum check kar rahe hain ki primary_use me "Hospital" YA "Medical" shabd ho.
        primary_use: { $regex: /(Hospital|Medical)/, $options: "i" },
  
        // 2. STATUS CHECK
        // $ne: "1" ka matlab hai status 1 nahi hona chahiye.
        // Ye "0" ko allow karega (Machine Asthma).
        // Ye unko bhi allow karega jisme onStatus field hi nahi hai (Oxygen/Otoscope).
        onStatus: { $ne: "1" } 
      };
  
      const [products, totalCount] = await Promise.all([
        PharmacyProduct.find(query)
          .sort({ createdAt: -1 }) // Sabse naya data sabse upar
          .skip(parseInt(skip))
          .limit(parseInt(limit)),
        PharmacyProduct.countDocuments(query)
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
        totalPages: Math.ceil(totalCount / limit),
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
        }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));// new code line for sorting
  
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
  
  
// Get vendor orders from the OrderPharmacy model from user pharmacy orders
// Method: GET
// Endpoint: /Products/vendor-orders
// Get vendor orders from OrderPharmacy where items include the vendor
// Get Vendor Orders - Same for both delivery types
const getVendorOrders = async (req, res) => {
  try {
    const vendorId = req.user && req.user._id && req.body.vendorId || req.params.vendorId || req.query.vendorId;
    if (!vendorId) {
      return res.status(400).json({
        success: 0,
        message: "Vendor ID missing"
      });
    }
 
    const statusMap = {
      0: "Placed",
      1: "Vendor Accepted",
      2: "Driver Assigned",
      3: "Driver Accepted",
      4: "Dispatched",
      5: "Delivered",
      6: "Cancelled"
    };
 
    const orders = await OrderPharmacy.find({
      "items.vendorId": vendorId,
      status: { $in: [0] } // Pending status
    })
    .populate("userId", "name phone")
    .populate("driverAssignedId", "name phone")
    .sort({ createdAt: -1 })
    .lean();
 
    const filteredOrders = orders.map((order) => {
      const vendorItems = order.items.filter(
        (item) => item.vendorId.toString() === vendorId.toString()
      );
      
      return {
        ...order,
        items: vendorItems,
        statusText: statusMap[order.status] || "Unknown",
        isRapidDelivery: order.isRapidDelivery || false,
        // ✅ Added Prescription Image
        prescriptionImage: order.prescriptionImage || order.prescriptionUrl || null 
      };
    });
 
    res.status(200).json({
      success: 1,
      message: "Vendor orders fetched",
      total: filteredOrders.length,
      data: filteredOrders,
    });
  } catch (error) {
    console.error("Fetch vendor orders error:", error);
    res.status(500).json({
      success: 0,
      message: "Server error",
      error: error.message
    });
  }
};
 
 
// Accept vendor order
// Method: PATCH
// Endpoint: /Products/accept-orders
const acceptVendorOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const vendorId = req.vendorId || req.body.vendorId;
 
    if (!vendorId || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Missing vendorId or orderId",
      });
    }
 
    const order = await OrderPharmacy.findById(orderId);
 
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
 
    const isAuthorized = order.items.some(
      (item) => item.vendorId.toString() === vendorId.toString()
    );
 
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized for this order",
      });
    }
 
    // Global status update (might be updated to per-item logic if needed)
    order.status = 1; // Vendor Accepted
    order.vendorAcceptedAt = new Date();
 
    await order.save();
 
    res.json({
      success: true,
      message: "Order accepted by vendor",
      data: order,
    });
  } catch (error) {
    console.error("Error in acceptVendorOrder:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
 
 
// Get accepted vendor orders
// Method: GET
// Endpoint: /Products/get-accepted-orders
// Get accepted vendor orders
// Method: GET
// Endpoint: /Products/get-accepted-orders
const getAcceptedVendorOrders = async (req, res) => {
  try {
    const vendorId = req.vendorId || req.body.vendorId || req.query.vendorId;
 
    if (!vendorId) {
      return res.status(400).json({
        success: 0,
        message: "Vendor ID missing"
      });
    }
 
    const orders = await OrderPharmacy.find({
        "items.vendorId": vendorId,
        status: { $gte: 1, $lt: 3 } // Vendor Accepted (1) or Driver Assigned (2)
      })
      .sort({ createdAt: -1 })
      .populate("userId", "name phone")
      .populate("driverAssignedId", "name phone")
      .lean();
 
    const statusMap = {
      1: "Vendor Accepted",
      2: "Driver Assigned",
      3: "Driver Accepted",
      4: "Dispatched",
      5: "Delivered",
      6: "Cancelled"
    };
 
    const filteredOrders = orders.map((order) => {
      const vendorItems = order.items.filter(
        (item) => item.vendorId.toString() === vendorId.toString()
      );
      
      return {
        ...order,
        items: vendorItems,
        statusText: statusMap[order.status] || "Unknown",
        canReassign: order.status === 2, // Can reassign if driver assigned but not started
        // ✅ Added Prescription Image
        prescriptionImage: order.prescriptionImage || order.prescriptionUrl || null 
      };
    });
 
    res.status(200).json({
      success: 1,
      message: "Accepted vendor orders fetched",
      total: filteredOrders.length,
      data: filteredOrders,
    });
  } catch (error) {
    console.error("Fetch accepted vendor orders error:", error);
    res.status(500).json({
      success: 0,
      message: "Server error",
      error: error.message
    });
  }
};
 
// Reject vendor order
// Method: PATCH
// Endpoint: /Products/reject-orders
const rejectVendorOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const vendorId = req.vendorId || req.body.vendorId;
 
    if (!vendorId || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Missing vendorId or orderId",
      });
    }
 
    const order = await OrderPharmacy.findById(orderId)
    .sort({ createdAt: -1 });
 
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
 
    const isAuthorized = order.items.some(
      (item) => item.vendorId.toString() === vendorId.toString()
    );
 
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized for this order",
      });
    }
 
    // ❗️Note: This updates the full order status to "Cancelled"
    order.status = 6; // Cancelled
    order.vendorRejectedAt = new Date();
 
    await order.save();
 
    res.json({
      success: true,
      message: "Order rejected by vendor",
      data: order,
    });
  } catch (error) {
    console.error("Error in rejectVendorOrder:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
 
// Get Rejected Orders for a Vendor
// Method: GET
// Endpoint: /Products/get-rejected-orders
 
const getRejectedOrders = async (req, res) => {
  try {
    const vendorId = req.vendorId || req.query.vendorId || req.body.vendorId;
 
    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: "vendorId is required",
      });
    }
 
    const rejectedOrders = await OrderPharmacy.find({
      status: 6, // Cancelled
      "items.vendorId": vendorId,
    }).sort({ updatedAt: -1 });
 
    res.json({
      success: true,
      message: "Rejected orders fetched successfully",
      data: rejectedOrders,
    });
  } catch (error) {
    console.error("Error in getRejectedOrders:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
 
 
// available drivers for vendor
// Method: GET
// Endpoint: /Products/available-drivers
const getAvailableDrivers = async (req, res) => {
  try {
    const vendorId = req.vendorId || req.body.vendorId;
 
    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: "Vendor ID is missing",
      });
    }
 
    // Filter only active/available drivers
    const drivers = await Driver.find({ isActive: true }) // or { status: 1 }
    .sort({ createdAt: -1 })
      .select("name phone vehicleNumber")
      .lean();
 
    res.json({
      success: true,
      message: "Available drivers fetched successfully",
      total: drivers.length,
      data: drivers,
    });
  } catch (error) {
    console.error("Error fetching drivers:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching drivers",
      error: error.message,
    });
  }
};
 
 
  


 
// assign driver to order
// Method: PATCH
// Endpoint: /Products/assign-driver
// assign driver to order
// Method: PATCH
// Endpoint: /Products/assign-driver
const assignDriverToOrder = async (req, res) => {
  try {
    const { orderId, driverId } = req.body;
    const vendorId = req.vendorId || req.body.vendorId;
 
    if (!orderId || !driverId || !vendorId) {
      return res.status(400).json({
        success: 0,
        message: "Order ID, Driver ID and Vendor ID are required.",
      });
    }
 
    // Find the order by ID
    const order = await OrderPharmacy.findById(orderId);
 
    if (!order) {
      return res.status(404).json({
        success: 0,
        message: "Order not found.",
      });
    }
 
    // Check if vendor is authorized for this order
    const isVendorAuthorized = order.items.some(
      (item) => item.vendorId.toString() === vendorId.toString()
    );
 
    if (!isVendorAuthorized) {
      return res.status(403).json({
        success: 0,
        message: "You are not authorized to assign driver for this order.",
      });
    }
 
    // Check if order can be reassigned (status must be < 3)
    if (order.status >= 3) {
      return res.status(400).json({
        success: 0,
        message: "Order cannot be reassigned as driver has already started it.",
      });
    }
 
    // Check if new driver is online
    const newDriver = await Driver.findOne({ _id: driverId, isOnline: true });
    if (!newDriver) {
      return res.status(404).json({
        success: 0,
        message: "Driver not found or not online.",
      });
    }
 
    // Free the previous driver if exists
    if (order.driverAssignedId) {
      const previousDriver = await Driver.findById(order.driverAssignedId);
      if (previousDriver) {
        previousDriver.isBusy = false;
        await previousDriver.save();
      }
    }
 
    // Assign new driver
    order.driverAssignedId = driverId;
    order.status = 2; // Driver assigned
    await order.save();
 
    // Mark new driver as busy
    newDriver.isBusy = true;
    await newDriver.save();
 
    return res.status(200).json({
      success: 1,
      message: "Driver assigned successfully.",
      data: order,
    });
 
  } catch (error) {
    console.error("assignDriverToOrder error:", error.message);
    return res.status(500).json({
      success: 0,
      message: "Internal server error.",
      error: error.message,
    });
  }
};
 
// Get pharmacy order with driver details
// method: GET
// Endpoint: /Products/get-driver-order
const getPharmacyOrderWithDriver = async (req, res) => {
  try {
    const { orderId } = req.query;
 
    if (!orderId) {
      return res.status(400).json({
        success: 0,
        message: "orderId is required",
      });
    }
 
    const order = await OrderPharmacy.findById(orderId)
    .sort({ createdAt: -1 })
      .populate("items.productId", "name brand description") // pharmacy product fields
      .populate("userId", "name phone email") // user fields
      .populate("driverAssignedId", "name phone vehicleNumber isOnline"); // driver fields
 
    if (!order) {
      return res.status(404).json({
        success: 0,
        message: "Order not found",
      });
    }
 
    return res.status(200).json({
      success: 1,
      message: "Pharmacy order with driver fetched successfully",
      data: order,
    });
  } catch (error) {
    console.error("Error in getPharmacyOrderWithDriver:", error.message);
    return res.status(500).json({
      success: 0,
      message: "Internal server error",
      error: error.message,
    });
  }
};
 
// Get vendor rejected orders
// Method: GET
// Endpoint: /Products/rejected-by-user
// Get vendor rejected orders
// Method: GET
// Endpoint: /Products/rejected-by-user
// Get vendor rejected and delivered orders
// Method: GET
// Endpoint: /Products/rejected-and-delivered-orders
// Get vendor rejected and delivered orders
// Method: GET
// Endpoint: /Products/rejected-and-delivered-orders
const getOrderHistory = async (req, res) => {
  try {
    const vendorId = req.vendorId || req.query.vendorId || req.body.vendorId;
 
    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: "vendorId is required",
      });
    }
 
    console.log(`Fetching orders for vendor: ${vendorId}`);
 
    // Find orders where:
    // 1. Items include this vendor
    // 2. Status is either 5 (delivered) or 6 (rejected)
    const orders = await OrderPharmacy.find({
      "items.vendorId": vendorId,
    
    })
    .populate("userId", "name phone") // Customer details
    .populate("driverAssignedId", "name phone") // Driver details
    .sort({ updatedAt: -1 }); // Newest first
 
    console.log(`Found ${orders.length} orders in DB`);
 
    // Filter only items belonging to this vendor and format the response
    const formattedOrders = orders.map(order => {
      const vendorItems = order.items.filter(
        item => item.vendorId && item.vendorId.toString() === vendorId.toString()
      );
      
      // If no items belong to this vendor, skip this order
      if (vendorItems.length === 0) {
        return null;
      }
 
      const statusText = order.status === 5 ? "Delivered" : "Rejected";
      
      // For rejected orders, check both order-level and item-level rejection reasons
      let rejectionReason = "No reason provided";
      if (order.status === 6) {
        // First try to get from order level
        rejectionReason = order.rejectionReason ||
                         // Then check if any item has rejection reason
                         vendorItems.find(item => item.rejectionReason)?.rejectionReason ||
                         rejectionReason;
      }
      
      return {
        _id: order._id,
        orderId: order.orderId,
        status: order.status,
        statusText: statusText,
        totalAmount: order.totalAmount,
        deliveryAddress: order.deliveryAddress,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        user: order.userId,
        driver: order.driverAssignedId,
        items: vendorItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          // include other item fields as needed
          rejectionReason: item.rejectionReason // Include item-level rejection reason if exists
        })),
        statusDetails: {
          reason: order.status === 5 ? "Successfully delivered" : rejectionReason,
          statusChangedAt: order.updatedAt
        }
      };
    }).filter(order => order !== null); // Remove null entries
 
    console.log(`Filtered to ${formattedOrders.length} relevant orders`);
 
    res.json({
      success: 1,
      message: "Rejected and delivered orders fetched successfully",
      count: formattedOrders.length,
      data: formattedOrders
    });
  } catch (error) {
    console.error("Error in getOrderHistory:", error.message);
    res.status(500).json({
      success: 0,
      message: "Internal server error",
      error: error.message,
    });
  }
};
 
// Get all active pharmacy orders for vendor
// Method: GET
// Endpoint: /Products/active-orders
const getAllActiveOrders = async (req, res) => {
  try {
    const vendorId = req.vendorId || req.query.vendorId || req.body.vendorId;
 
    if (!vendorId) {
      return res.status(400).json({
        success: 0,
        message: "Vendor ID is required",
      });
    }
 
    // Active statuses: from Driver Assigned (2) to Delivered (5)
    const orders = await OrderPharmacy.find({
      "items.vendorId": vendorId,
      status: { $gte: 2, $lte: 5 },
    })
      .populate("userId", "name phone")
      .populate("driverAssignedId", "name phone vehicleNumber")
      .sort({ updatedAt: -1 })
      .lean();
 
    const statusMap = {
      2: "Driver Assigned",
      3: "Driver Accepted",
      4: "Dispatched",
      5: "Delivered",
    };
 
    const formattedOrders = orders.map((order) => {
      const vendorItems = order.items.filter(
        (item) => item.vendorId.toString() === vendorId.toString()
      );
 
      return {
        _id: order._id,
        orderId: order.orderId,
        user: order.userId,
        driver: order.driverAssignedId,
        deliveryAddress: order.deliveryAddress,
        status: order.status,
        statusText: statusMap[order.status] || "Unknown",
        totalPrice: order.grandTotal,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        isRapidDelivery: order.isRapidDelivery || false,
        items: vendorItems.map(item => ({
          ...item,
          subTotal: order.subTotal,
          tax: order.tax,
          deliveryCharges: order.deliveryCharges,
          rapidDeliveryFee: order.rapidDeliveryFee,
          grandTotal: order.grandTotal
        }))
        
      };
    });
 
    return res.status(200).json({
      success: 1,
      message: "Active vendor orders fetched successfully",
      count: formattedOrders.length,
      data: formattedOrders,
    });
 
  } catch (error) {
    console.error("Error in getAllActiveOrders:", error.message);
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
    getVendorHospitalProducts,
    getVendorOrders,
    acceptVendorOrder,
    getAcceptedVendorOrders,
    rejectVendorOrder,
    getRejectedOrders,
    getAvailableDrivers,
    assignDriverToOrder,
    getPharmacyOrderWithDriver,
    getOrderHistory,
    getAllActiveOrders
  };
 