const PharmacyProduct = require("../../../../modal/PharmacyProducts")
const PharmacyProductVendor = require("../../../../modal/PharmacyProductVendor")
const OrderPharmacy = require("../../../../modal/OrderPharmacy");
const Vendor = require("../../../../modal/vandor");
const Driver = require("../../../../modal/driver");
const Medicine = require("../../../../modal/MedicineSchema");
const mongoose = require("mongoose");


 // Create hospital product service
// Method: Post
// Endpoint: /services/hospital/create
// Create hospital product service
// Method: Post
// Endpoint: /services/hospital/create
const addHospitalProduct = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Request Body se data nikalein (ab ismein image_url bhi hai)
        const {
            categoryName, name, manufacturers, packaging, primaryUse,
            description, storage, introduction, useOf, benefits,
            sideEffects, howToUse, howItWorks, safetyAdvice, ifMissed,
            alternativeBrand, manufacturerAddress,
            quantity, mrp, discountPercentage, prescriptionRequired,
            image_url // ⭐⭐⭐ IMAGE URL FIELD ADDED ⭐⭐⭐
        } = req.body;

        // 2. Zaroori Fields ko Validate Karein
        const requiredFields = {
            categoryName, name, manufacturers, packaging, primaryUse, description,
            storage, introduction, useOf, benefits, sideEffects, howToUse,
            howItWorks, safetyAdvice, ifMissed, alternativeBrand, manufacturerAddress,
            quantity, mrp, discountPercentage, prescriptionRequired,
            image_url // ⭐⭐⭐ VALIDATION ADDED ⭐⭐⭐
        };

        for (const [key, value] of Object.entries(requiredFields)) {
            if (value === undefined || value === "") {
                await session.abortTransaction(); session.endSession();
                return res.status(400).json({ success: 0, message: `Field '${key}' zaroori hai.` });
            }
        }
        
        // 3. Vendor Authentication Check (No change)
        if (!req.user || !req.user._id) {
            await session.abortTransaction(); session.endSession();
            return res.status(401).json({ success: 0, message: "Unauthorized: Vendor token nahi mila ya invalid hai." });
        }
        const vendorId = req.user._id;

        // 4. Sequential ID Generate Karein (No change)
        const lastProduct = await PharmacyProduct.findOne().sort({ Id: -1 }).session(session);
        const newId = (lastProduct && lastProduct.Id) ? parseInt(lastProduct.Id, 10) + 1 : 10001;
        
        // 5. ⭐⭐⭐ REMOVED: File Uploads ko Handle Karein ⭐⭐⭐
        // const photoPaths = req.files && req.files.length > 0 ? req.files.map((file) => `/vendor/photo/${file.filename}`) : [];

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

        // 7. PharmacyProduct collection mein naya product object banayein
        const newPharmacyProduct = new PharmacyProduct({
            Id: newId,
            name,
            manufacturers,
            salt_composition: "N/A",
            packaging,
            mrp: String(numericMrp.toFixed(2)),
            best_price: best_price_str,
            discont_percent: `${numericDiscount}%`,
            prescription_required: prescriptionRequired,
            image_url: imageUrlArray, // ⭐⭐⭐ USE THE NEW ARRAY ⭐⭐⭐
            primary_use: primaryUse,
            description,
            storage,
            introduction,
            use_of: useOf,
            benefits,
            side_effect: sideEffects,
            how_to_use: howToUse,
            how_works: howItWorks,
            safety_advise: safetyAdvice,
            if_miss: ifMissed,
            alternate_brand: alternativeBrand,
            manufacturer_address: manufacturerAddress,
            bread_crumb: `${primaryUse} > ${categoryName}`,
            url: `/products/${name.toLowerCase().replace(/\s+/g, '-')}-${newId}`,
            for_sale: "ADD TO CART",
            onStatus: "0",
            // Other fields remain the same
        });

        const savedProduct = await newPharmacyProduct.save({ session });

        // 8. Vendor-Specific Product Data
        const newPharmacyProductVendor = new PharmacyProductVendor({
            productId: savedProduct._id,
            vendorId,
            stock: quantity,
            discount_seller: numericDiscount,
            vendorPrice: best_price_str,
            sellingPrice: best_price_str,
            isAvailable: quantity > 0,
        });
        await newPharmacyProductVendor.save({ session });

        savedProduct.vendorPrice = newPharmacyProductVendor._id;
        await savedProduct.save({ session });

        // 9. Transaction Commit
        await session.commitTransaction();
        session.endSession();

        // 10. Response
        return res.status(201).json({
            success: 1,
            message: "Hospital product safaltapoorvak banaya gaya. Approval ka intezar hai.",
            details: savedProduct.toObject(),
        });

    } catch (error) {
        // Error Handling
        await session.abortTransaction();
        session.endSession();
        console.error("Add Hospital Product Error:", error);
        if (error.code === 11000) {
            return res.status(409).json({ success: 0, message: "Ek product is ID ke saath pehle se hi hai." });
        }
        return res.status(500).json({ success: 0, message: "Internal server error", error: error.message });
    }
};
  
// Get hospital products data uploaded from Excel
// Method: GET
// Endpoint: /Products/getProducts
const getHospitalProductsData = async (req, res) => {
  try {
    // Pagination parameters from req.query are no longer used for the database query.
    
    // Fetch all documents from the PharmacyProduct collection.
    const products = await PharmacyProduct.find();
    // Get the total count from the length of the returned array.
    const totalCount = products.length;
 
    if (!products || totalCount === 0) {
      return res.status(200).json({
        success: 0,
        message: "No hospital product records found.",
      });
    }
 
    // Return all found products in a single response.
    return res.status(200).json({
      success: 1,
      message: "All hospital products data fetched successfully",
      totalCount,
      currentPage: 1, // All data is on a single page.
      pageSize: totalCount, // The page size is the total number of records.
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
  
  
// Get vendor orders from the OrderPharmacy model from user pharmacy orders
// Method: GET
// Endpoint: /Products/vendor-orders
// Get vendor orders from OrderPharmacy where items include the vendor
// Get Vendor Orders - Same for both delivery types
const getVendorOrders = async (req, res) => {
  try {
    const vendorId = req.vendorId || req.body.vendorId || req.query.vendorId;
 
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
      status: { $in: [0] } // Same status filter
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
        isRapidDelivery: order.isRapidDelivery || false // Just show the flag
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
    const vendorId = req.vendorId || req.body.vendorId || req.query.vendorId;
 
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
        canReassign: order.status === 2 // Can reassign if driver assigned but not started
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
    const vendorId = req.vendorId || req.body.vendorId || req.query.vendorId;
 
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
    const vendorId = req.vendorId || req.body.vendorId || req.query.vendorId;
 
    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: "Vendor ID is missing",
      });
    }
 
    // Filter only active/available drivers
    const drivers = await Driver.find({ isActive: true }) // or { status: 1 }
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
    const vendorId = req.vendorId || req.body.vendorId || req.query.vendorId;
 
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
// Endpoint: Products/get-driver-order
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
 
// Get vendor rejected and delivered orders
// Method: GET
// Endpoint: /Products/vendor-order-history
const getOrderHistory = async (req, res) => {
  try {
    const vendorId = req.vendorId || req.query.vendorId || req.body.vendorId;
 
    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: "vendorId is required",
      });
    }
 
    // Find orders where:
    // 1. Items include this vendor
    // 2. Status is either 5 (delivered) or 6 (rejected)
    const orders = await OrderPharmacy.find({
      "items.vendorId": vendorId,
      status: { $in: [5, 6] } // Both delivered and rejected statuses
    })
    .populate("userId", "name phone") // Customer details
    .populate("driverAssignedId")     // Driver details
    // --- यहाँ बदलाव किया गया है ---
    // 1. Products को पॉप्युलेट करें
    .populate({
        path: 'items.productId',
        model: 'PharmacyProduct' // यहाँ अपने Product मॉडल का नाम लिखें
    })
    // 2. Medicines को पॉप्युलेट करें
    .populate({
        path: 'items.medicineId',
        model: 'Medicine' // यहाँ अपने Medicine मॉडल का नाम लिखें
    })
    .lean() // Convert to plain JavaScript objects for easier manipulation
    .sort({ updatedAt: -1 }); // Newest first

 
    // Filter only items belonging to this vendor and format the response
    const formattedOrders = orders.map(order => {
      const vendorItems = order.items.filter(
        item => item.vendorId && item.vendorId.toString() === vendorId.toString()
      );
      
      if (vendorItems.length === 0) {
        return null;
      }
 
      const statusText = order.status === 5 ? "Delivered" : "Rejected";
      
      let rejectionReason = "No reason provided";
      if (order.status === 6) {
        rejectionReason = order.rejectionReason ||
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
        // --- यहाँ भी सुधार किया गया है ---
        // अब productId और medicineId में पूरा ऑब्जेक्ट आएगा
        items: vendorItems.map(item => ({
          quantity: item.quantity,
          price: item.totalPrice,
          itemType: item.itemType,
          rejectionReason: item.rejectionReason, // आइटम-लेवल रिजेक्शन कारण
          // यदि आइटम एक प्रोडक्ट है, तो उसकी पूरी जानकारी दिखाएं
          details: item.itemType === 'product' ? item.productId : item.medicineId
        })),
        statusDetails: {
          reason: order.status === 5 ? "Successfully delivered" : rejectionReason,
          statusChangedAt: order.updatedAt
        }
      };
    }).filter(order => order !== null);
 
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
      .populate("driverAssignedId", "name phoneNumber vehicleNumber")
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
        phone: order.driverAssignedId?.phoneNumber || order.driverAssignedId?.phone || "N/A", 
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
 