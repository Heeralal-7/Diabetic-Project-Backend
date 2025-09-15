const Vendor = require("../../../../modal/vandor");
const Service = require("../../../../modal/addServices");
const PharmacyProduct = require("../../../../modal/PharmacyProducts");
const PharmacyProductVendor = require("../../../../modal/PharmacyProductVendor");
const Medicine = require("../../../../modal/MedicineSchema");
const PharmacyMedicine = require("../../../../modal/VendorMedicine");
 
const CartPharmacy = require("../../../../modal/CartPharmacy");
const OrderPharmacy = require("../../../../modal/OrderPharmacy");
 
const Available = require("../../../../modal/availability");
 
// Get all pharmacy
// Method: Get
// Endpoints: /shops/get
const shopsNear = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
 
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
 
    const skip = (pageNumber - 1) * pageSize;
 
    const user = await Vendor.find({ vendor: "Pharmacy" })
      .skip(skip)
      .limit(pageSize);
 
    if (!user) {
      return res.send({
        success: 0,
        message: "No pharmacy found",
      });
    }
 
    const pharmacyDetails = await Promise.all(
      user.map(async (vendor) => {
        const tests = await Service.find({ vendorId: vendor._id });
 
        return {
          ...vendor._doc,
          tests,
        };
      })
    );
 
    return res.send({
      success: 1,
      message: "Fetched successfully",
      details: pharmacyDetails,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};
 
// Get all pharmacy products
// Method: Get
// Endpoints: /shops/getProducts
const getAvailableProducts = async (req, res) => {
  try {
    const vendorStock = await PharmacyProductVendor.find({ stock: { $gt: 0 } });
 
    const productVendorMap = {};
 
    vendorStock.forEach((entry) => {
      const productId = entry.productId.toString();
      if (!productVendorMap[productId]) {
        productVendorMap[productId] = [];
      }
      productVendorMap[productId].push(entry);
    });
 
    const productIds = Object.keys(productVendorMap);
    const products = await PharmacyProduct.find({ _id: { $in: productIds } });
 
    const finalProducts = products.map((product) => {
      const vendors = productVendorMap[product._id.toString()];
      let totalStock = 0;
      let bestVendor = null;
      let lowestPrice = Infinity;
 
      vendors.forEach((vendorEntry) => {
        totalStock += vendorEntry.stock;
 
        const basePrice = parseFloat(product.best_price || "0");
        const discount = vendorEntry.discount_seller || 0;
        const discountAmount = (basePrice * discount) / 100;
        const finalPrice = basePrice - discountAmount;
 
        if (finalPrice < lowestPrice) {
          lowestPrice = finalPrice;
          bestVendor = {
            vendorId: vendorEntry.vendorId,
            vendorPrice: finalPrice.toFixed(2),
            discount: discount,
            stock: vendorEntry.stock
          };
        }
      });
 
      return {
        ...product.toObject(),
        totalStock,
        vendorId: bestVendor.vendorId,
        vendorPrice: bestVendor.vendorPrice,
        discount: bestVendor.discount,
        stockFromVendor: bestVendor.stock
      };
    });
 
    return res.status(200).json({
      success: 1,
      message: "Available products fetched successfully",
      total: finalProducts.length,
      data: finalProducts,
    });
  } catch (error) {
    console.error("Error fetching available products:", error.message);
    return res.status(500).json({
      success: 0,
      message: "Internal server error",
      error: error.message,
    });
  }
};
 
 
// Get available medicine products
// Method: GET
// Endpoint: /shops/medicine/getMedicines
const getAvailableMedicines = async (req, res) => {
  try {
    const vendorStock = await PharmacyMedicine.find({ stock: { $gt: 0 } });
 
    const medicineVendorMap = {};
 
    vendorStock.forEach((entry) => {
      const medicineId = entry.medicineId.toString();
      if (!medicineVendorMap[medicineId]) {
        medicineVendorMap[medicineId] = [];
      }
      medicineVendorMap[medicineId].push(entry);
    });
 
    const medicineIds = Object.keys(medicineVendorMap);
 
    const [serviceMedicines, generalMedicines] = await Promise.all([
      Service.find({ _id: { $in: medicineIds } }),
      Medicine.find({ _id: { $in: medicineIds } }),
    ]);
 
    const serviceMedicinesWithSource = serviceMedicines.map((med) => ({
      ...med.toObject(),
      source: "service",
    }));
 
    const generalMedicinesWithSource = generalMedicines.map((med) => ({
      ...med.toObject(),
      source: "general",
    }));
 
    const allMedicines = [...serviceMedicinesWithSource, ...generalMedicinesWithSource];
 
    const finalMedicines = allMedicines.map((medicine) => {
      const vendors = medicineVendorMap[medicine._id.toString()];
      let totalStock = 0;
      let bestVendor = null;
      let lowestPrice = Infinity;
 
      vendors.forEach((vendorEntry) => {
        totalStock += vendorEntry.stock;
 
        const basePrice = medicine.source === "service"
          ? parseFloat(medicine.bestPrice || "0")
          : parseFloat(medicine.best_price || "0");
 
        const discount = vendorEntry.discount_seller || 0;
        const discountAmount = (basePrice * discount) / 100;
        const finalPrice = basePrice - discountAmount;
 
        if (finalPrice < lowestPrice) {
          lowestPrice = finalPrice;
          bestVendor = {
            vendorId: vendorEntry.vendorId,
            vendorPrice: finalPrice.toFixed(2),
            discount: discount,
            stock: vendorEntry.stock
          };
        }
      });
 
      return {
        ...medicine,
        totalStock,
        vendorId: bestVendor.vendorId,
        vendorPrice: bestVendor.vendorPrice,
        discount: bestVendor.discount,
        stockFromVendor: bestVendor.stock
      };
    });
 
    return res.status(200).json({
      success: 1,
      message: "Available medicines fetched successfully",
      total: finalMedicines.length,
      data: finalMedicines,
    });
  } catch (error) {
    console.error("Error fetching available medicines:", error.message);
    return res.status(500).json({
      success: 0,
      message: "Internal server error",
      error: error.message,
    });
  }
};
 
// Get vendors by product
// Method: Get
// Endpoints: /shops/getVendorDetails
const getVendorsByProduct = async (req, res) => {
  try {
    const { productId } = req.query;
 
    if (!productId) {
      return res.status(400).json({
        success: 0,
        message: "Product ID is required",
      });
    }
 
    const product = await PharmacyProduct.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: 0,
        message: "Product not found",
      });
    }
 
    const vendorEntries = await PharmacyProductVendor.find({
      productId,
      stock: { $gt: 0 },
    });
 
    if (!vendorEntries.length) {
      return res.status(200).json({
        success: 0,
        message: "No vendors with stock available for this product",
      });
    }
 
    const vendorsWithDetails = await Promise.all(
      vendorEntries.map(async (entry) => {
        const vendor = await Vendor.findById(entry.vendorId).select(
          "name email phone shopName address"
        );
 
        const basePrice = parseFloat(product.best_price || "0");
        const discountAmount = (basePrice * entry.discount_seller) / 100;
        const finalPrice = (basePrice - discountAmount).toFixed(2);
 
        return {
          vendorId: vendor._id,
          name: vendor.name,
          shopName: vendor.shopName,
          contact: vendor.phone,
          email: vendor.email,
          address: vendor.address,
          stock: entry.stock,
          discount: entry.discount_seller,
          vendorPrice: finalPrice,
        };
      })
    );
 
    return res.status(200).json({
      success: 1,
      message: "Vendors with stock fetched successfully",
      productName: product.name,
      totalVendors: vendorsWithDetails.length,
      vendors: vendorsWithDetails,
    });
  } catch (error) {
    console.error("Get Vendors by Product Error:", error.message);
    return res.status(500).json({
      success: 0,
      message: "Internal server error",
      error: error.message,
    });
  }
};
 
// Get vendors by medicine
// Method: GET
// Endpoint: /shops/medicine/getVendorDetails
const getVendorsByMedicine = async (req, res) => {
  try {
    const { medicineId } = req.query;
 
    if (!medicineId) {
      return res.status(400).json({
        success: 0,
        message: "Medicine ID is required",
      });
    }
 
    const [serviceMedicine, generalMedicine] = await Promise.all([
      Service.findById(medicineId),
      Medicine.findById(medicineId)
    ]);
 
    const medicine = serviceMedicine || generalMedicine;
    if (!medicine) {
      return res.status(404).json({
        success: 0,
        message: "Medicine not found",
      });
    }
 
    const vendorEntries = await PharmacyMedicine.find({
      medicineId,
      stock: { $gt: 0 },
      onStatus: "1"
    });
 
    if (!vendorEntries.length) {
      return res.status(200).json({
        success: 0,
        message: "No vendors with stock available for this medicine",
      });
    }
 
    const vendorsWithDetails = await Promise.all(
      vendorEntries.map(async (entry) => {
        const vendor = await Vendor.findById(entry.vendorId).select(
          "name email phone shopName address"
        );
 
        const basePrice = medicine.source === "service"
          ? parseFloat(medicine.bestPrice || "0")
          : parseFloat(medicine.best_price || "0");
 
        const discountAmount = (basePrice * entry.discount_seller) / 100;
        const finalPrice = (basePrice - discountAmount).toFixed(2);
 
        return {
          vendorId: vendor._id,
          name: vendor.name,
          shopName: vendor.shopName,
          contact: vendor.phone,
          email: vendor.email,
          address: vendor.address,
          stock: entry.stock,
          discount: entry.discount_seller,
          vendorPrice: finalPrice,
        };
      })
    );
 
    return res.status(200).json({
      success: 1,
      message: "Vendors with stock fetched successfully",
      medicineName: medicine.name,
      totalVendors: vendorsWithDetails.length,
      vendors: vendorsWithDetails,
    });
  } catch (error) {
    console.error("Get Vendors by Medicine Error:", error.message);
    return res.status(500).json({
      success: 0,
      message: "Internal server error",
      error: error.message,
    });
  }
};
 
// Check if cart has items from different vendors
// Method: POST
// Endpoint: /shops/checkCartVendor
const checkCartVendorConflict = async (req, res) => {
  try {
    const { userId, vendorId } = req.body;
 
    if (!vendorId || !userId) {
      return res.status(400).json({
        success: 0,
        message: "userId and vendorId are required",
      });
    }
 
    // Find all cart items for this user
    const cartItems = await CartPharmacy.find({ userId });
 
    if (cartItems.length === 0) {
      return res.status(200).json({
        success: 1,
        message: "Cart is empty. You can add items from this vendor.",
      });
    }
 
    const existingVendorId = cartItems[0].vendorId.toString();
 
    if (existingVendorId === vendorId.toString()) {
      return res.status(200).json({
        success: 1,
        message: "Item can be added. Vendor is same as existing cart items.",
      });
    } else {
      return res.status(200).json({
        success: 0,
        message:
          "Your cart contains items from another vendor. Do you want to replace them?",
      });
    }
  } catch (error) {
    console.error("Check Cart Conflict Error:", error.message);
    return res.status(500).json({
      success: 0,
      message: "Internal server error",
      error: error.message,
    });
  }
};
 
 

 
// Add to cart (updated to handle both products and medicines using productId parameter)
// Method: Post
// Endpoints: /shops/addToCart
const addToCart = async (req, res) => {
  try {
    const { vendorId, productId, quantity, userId } = req.body;
 
    if (!vendorId || !productId || !quantity || !userId) {
      return res.status(400).json({
        success: 0,
        message: "Missing required fields"
      });
    }
 
    // Step 1: Check existing cart items for this user
    const existingCartItems = await CartPharmacy.find({ userId });
 
    if (existingCartItems.length > 0) {
      const existingVendorId = existingCartItems[0].vendorId.toString();
 
      // Step 2: If existing vendorId !== new vendorId, clear the cart
      if (existingVendorId !== vendorId) {
        await CartPharmacy.deleteMany({ userId });
      }
    }
 
    // Step 3: Find product stock
    let productStock = await PharmacyProductVendor.findOne({
      vendorId,
      productId
    });
 
    let medicineStock = null;
    let isMedicine = false;
 
    if (!productStock) {
      medicineStock = await PharmacyMedicine.findOne({
        vendorId,
        medicineId: productId
      });
      isMedicine = true;
 
      if (!medicineStock) {
        return res.status(404).json({
          success: 0,
          message: "Item not available from this vendor",
        });
      }
    }
 
    const availableStock = isMedicine ? medicineStock.stock : productStock.stock;
 
    if (availableStock < quantity) {
      return res.status(400).json({
        success: 0,
        message: `Only ${availableStock} items available in stock`,
      });
    }
 
    // Step 4: Check if item already in cart (within the same vendor)
    const existingItem = await CartPharmacy.findOne({
      userId,
      vendorId,
      $or: [
        { productId },
        { medicineId: productId }
      ]
    });
 
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > availableStock) {
        return res.status(200).json({
          success: 0,
          message: `Cannot add more items. Only ${availableStock} available.`,
        });
      }
 
      existingItem.quantity = newQuantity;
      await existingItem.save();
      return res.status(200).json({
        success: 1,
        message: "Cart updated",
        item: existingItem
      });
    }
 
    // Step 5: Add new item to cart
    const cartData = {
      userId,
      vendorId,
      quantity
    };
 
    if (isMedicine) {
      cartData.medicineId = productId;
    } else {
      cartData.productId = productId;
    }
 
    const newCartItem = await CartPharmacy.create(cartData);
 
    return res.status(200).json({
      success: 1,
      message: "Item added to cart",
      item: newCartItem
    });
 
  } catch (error) {
    console.error("Add to Cart Error:", error.message);
    res.status(500).json({
      success: 0,
      message: "Internal Server Error",
      error: error.message
    });
  }
};
 
 
// Get all products from the same vendor as items in user's cart
// Method: GET
// Endpoint: /shops/vendor/products
const getVendorProducts = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId || req.query.userId;
 
    if (!userId) {
      return res.status(400).json({
        success: 0,
        message: "User ID is required",
      });
    }
 
    // Find user's cart items to determine the vendor
    const cartItems = await CartPharmacy.find({ userId });
 
    if (cartItems.length === 0) {
      return res.status(200).json({
        success: 1,
        message: "No items in cart to determine vendor",
        data: [],
      });
    }
 
    // All cart items should be from the same vendor (enforced by cart logic)
    const vendorId = cartItems[0].vendorId;
 
    // Get all products from this vendor with stock > 0
    const vendorProducts = await PharmacyProductVendor.find({
      vendorId,
      stock: { $gt: 0 }
    }).populate('productId');
 
    // Format response
    const products = vendorProducts.map(item => {
      const basePrice = parseFloat(item.productId.best_price || "0");
      const discount = item.discount_seller || 0;
      const vendorPrice = basePrice - (basePrice * discount) / 100;
      
 
      return {
        productId: item.productId._id,
        name: item.productId.name,
        description: item.productId.description,
        image: item.productId.image,
        category: item.productId.category,
        basePrice: basePrice,
        discount: discount,
        vendorPrice: vendorPrice.toFixed(2),
        stock: item.stock,
        vendorId: item.vendorId
      };
    });
 
    return res.status(200).json({
      success: 1,
      message: "Vendor products fetched successfully",
      vendorId: vendorId,
      total: products.length,
      data: products
    });
 
  } catch (error) {
    console.error("Get Vendor Products Error:", error.message);
    return res.status(500).json({
      success: 0,
      message: "Internal server error",
      error: error.message,
    });
  }
};
 
// Get all medicines from the same vendor as items in user's cart
// Method: GET
// Endpoint: /shops/vendor/medicines
const getVendorMedicines = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId || req.query.userId;
 
    if (!userId) {
      return res.status(400).json({
        success: 0,
        message: "User ID is required",
      });
    }
 
    // Find user's cart items to determine the vendor
    const cartItems = await CartPharmacy.find({ userId });
 
    if (cartItems.length === 0) {
      return res.status(200).json({
        success: 1,
        message: "No items in cart to determine vendor",
        data: [],
      });
    }
 
    // All cart items should be from the same vendor (enforced by cart logic)
    const vendorId = cartItems[0].vendorId;
 
    // Get all medicines from this vendor with stock > 0
    const vendorMedicines = await PharmacyMedicine.find({
      vendorId,
      stock: { $gt: 0 },
      onStatus: "1"
    });
 
    // Get medicine details (from both Service and Medicine collections)
    const medicineIds = vendorMedicines.map(item => item.medicineId);
 
    const [serviceMedicines, generalMedicines] = await Promise.all([
      Service.find({ _id: { $in: medicineIds } }),
      Medicine.find({ _id: { $in: medicineIds } })
    ]);
 
    // Combine and format response
    const medicines = vendorMedicines.map(item => {
      const medicine = serviceMedicines.find(m => m._id.equals(item.medicineId)) ||
                       generalMedicines.find(m => m._id.equals(item.medicineId));
 
      if (!medicine) return null;
 
      const basePrice = medicine.source === "service"
        ? parseFloat(medicine.bestPrice || "0")
        : parseFloat(medicine.best_price || "0");
      
      const discount = item.discount_seller || 0;
      const vendorPrice = basePrice - (basePrice * discount) / 100;
 
      return {
        productId: item.medicineId,
        name: medicine.name,
        description: medicine.description,
        image: medicine.image,
        category: medicine.category,
        manufacturer: medicine.manufacturer,
        basePrice: basePrice,
        discount: discount,
        vendorPrice: vendorPrice.toFixed(2),
        stock: item.stock,
        vendorId: item.vendorId,
        type: medicine.source === "service" ? "service" : "general"
      };
    }).filter(item => item !== null);
 
    return res.status(200).json({
      success: 1,
      message: "Vendor medicines fetched successfully",
      vendorId: vendorId,
      total: medicines.length,
      data: medicines
    });
 
  } catch (error) {
    console.error("Get Vendor Medicines Error:", error.message);
    return res.status(500).json({
      success: 0,
      message: "Internal server error",
      error: error.message,
    });
  }
};
 
// Get cart by user (updated to handle both products and medicines)
// Method: GET
// Endpoint: /shops/getCart
const getCartByUser = async (req, res) => {
  try {
    // Try to get userId from different possible sources
    const userId = req.user?._id || req.userId || req.query.userId || req.body.userId;
 
    if (!userId) {
      return res.status(400).json({
        success: 0,
        message: "User ID is required",
      });
    }
 
    const cartItems = await CartPharmacy.find({ userId })
      .populate("productId")
      .populate("medicineId")
      .populate("vendorId", "name email phone shopName address");
 
    if (!cartItems || cartItems.length === 0) {
      return res.status(200).json({
        success: 1,
        message: "No items in cart",
        total: 0,
        data: [],
      });
    }
 
    // Process each cart item
    const updatedCart = await Promise.all(
      cartItems.map(async (item) => {
        try {
          const isMedicine = !!item.medicineId;
          const itemDetails = isMedicine ? item.medicineId : item.productId;
          const vendor = item.vendorId;
 
          if (!itemDetails || !vendor) {
            return null; // Skip if item or vendor not found
          }
 
          // Find stock entry to get discount
          let stockEntry;
          if (isMedicine) {
            stockEntry = await PharmacyMedicine.findOne({
              vendorId: vendor._id,
              medicineId: item.medicineId._id
            });
          } else {
            stockEntry = await PharmacyProductVendor.findOne({
              vendorId: vendor._id,
              productId: item.productId._id
            });
          }
 
          if (!stockEntry) {
            return null; // Skip if stock entry not found
          }
 
          // Calculate price based on item type
          let basePrice;
          if (isMedicine) {
            basePrice = itemDetails.source === "service"
              ? parseFloat(itemDetails.bestPrice || "0")
              : parseFloat(itemDetails.best_price || "0");
          } else {
            basePrice = parseFloat(itemDetails.best_price || "0");
          }
 
          const discount = stockEntry.discount_seller || 0;
          const finalPrice = basePrice - (basePrice * discount) / 100;
 
          return {
            _id: item._id,
            itemType: isMedicine ? "medicine" : "product",
            itemId: isMedicine ? item.medicineId._id : item.productId._id,
            itemDetails: {
              ...itemDetails.toObject(),
              source: isMedicine ? itemDetails.source : undefined
            },
            vendorId: vendor._id,
            vendorDetails: {
              name: vendor.name,
              shopName: vendor.shopName,
              contact: vendor.phone,
              email: vendor.email,
              address: vendor.address
            },
            quantity: item.quantity,
            unitPrice: basePrice,
            discountPercent: discount,
            vendorPrice: finalPrice.toFixed(2),
            totalPrice: (finalPrice * item.quantity).toFixed(2),
            stockAvailable: stockEntry.stock
          };
        } catch (error) {
          console.error("Error processing cart item:", error);
          return null;
        }
      })
    );
 
    // Filter out any null items (where details weren't found)
    const filteredCart = updatedCart.filter(item => item !== null);
 
    return res.status(200).json({
      success: 1,
      message: "Cart items fetched successfully",
      total: filteredCart.length,
      data: filteredCart,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return res.status(500).json({
      success: 0,
      message: "Something went wrong while fetching the cart",
      error: error.message,
    });
  }
};
 
 
 
// Update cart quantity (handles both products and medicines)
// Method: PATCH
// Endpoint: /shops/updateCartQuantity
const updateCartQuantity = async (req, res) => {  
  try {
    const { cartItemId, action, userId } = req.body;
 
    // Validate input
    if (!cartItemId || !["increase", "decrease"].includes(action) || !userId) {
      return res.status(400).json({
        success: 0,
        message: "cartItemId, action ('increase'/'decrease'), and userId are required"
      });
    }
 
    // Find the cart item
    const cartItem = await CartPharmacy.findOne({
      _id: cartItemId,
      userId
    }).populate('vendorId');
 
    if (!cartItem) {
      return res.status(404).json({
        success: 0,
        message: "Cart item not found or doesn't belong to user"
      });
    }
 
    // Determine if it's a product or medicine
    const isMedicine = !!cartItem.medicineId;
    const itemId = isMedicine ? cartItem.medicineId : cartItem.productId;
 
    // Get current stock from vendor
    let stockEntry;
    if (isMedicine) {
      stockEntry = await PharmacyMedicine.findOne({
        vendorId: cartItem.vendorId._id,
        medicineId: itemId,
        stock: { $gt: 0 }
      });
    } else {
      stockEntry = await PharmacyProductVendor.findOne({
        vendorId: cartItem.vendorId._id,
        productId: itemId,
        stock: { $gt: 0 }
      });
    }
 
    if (!stockEntry) {
      return res.status(404).json({
        success: 0,
        message: "Item is currently out of stock from this vendor"
      });
    }
 
    // Calculate new quantity
    let newQuantity = cartItem.quantity;
    
    if (action === "increase") {
      if (cartItem.quantity + 1 > stockEntry.stock) {
        return res.status(400).json({
          success: 0,
          message: `Cannot increase quantity. Only ${stockEntry.stock} items available in stock`,
          maxAvailable: stockEntry.stock
        });
      }
      newQuantity += 1;
    } else if (action === "decrease") {
      if (cartItem.quantity <= 1) {
        return res.status(400).json({
          success: 0,
          message: "Use remove API to delete item from cart"
        });
      }
      newQuantity -= 1;
    }
 
    // Update the cart item
    cartItem.quantity = newQuantity;
    await cartItem.save();
 
    // Get updated item details for response
    const updatedItem = await CartPharmacy.findById(cartItem._id)
      .populate("productId")
      .populate("medicineId")
      .populate("vendorId", "name shopName");
 
    return res.status(200).json({
      success: 1,
      message: "Cart quantity updated successfully",
      data: {
        cartItemId: updatedItem._id,
        itemType: isMedicine ? "medicine" : "product",
        itemId,
        quantity: updatedItem.quantity,
        vendorId: updatedItem.vendorId._id,
        vendorName: updatedItem.vendorId.shopName,
        itemName: isMedicine
          ? updatedItem.medicineId?.name
          : updatedItem.productId?.name,
        maxAvailable: stockEntry.stock
      }
    });
 
  } catch (error) {
    console.error("Update Cart Quantity Error:", error.message);
    return res.status(500).json({
      success: 0,
      message: "Internal server error",
      error: error.message
    });
  }
};
 
// Remove cart item (works for both products and medicines)
// Method: DELETE
// Endpoint: /shops/removeCart
const removeCartItem = async (req, res) => {
  try {
    const { cartId } = req.query;
 
    if (!cartId) {
      return res.status(400).json({
        success: 0,
        message: "cartId is required",
      });
    }
 
    const cartItem = await CartPharmacy.findById(cartId);
 
    if (!cartItem) {
      return res.status(404).json({
        success: 0,
        message: "Cart item not found",
      });
    }
 
    await cartItem.deleteOne();
 
    return res.status(200).json({
      success: 1,
      message: "Item removed from cart successfully",
    });
  } catch (error) {
    console.error("Remove Cart Error:", error.message);
    return res.status(500).json({
      success: 0,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
 
 
// Checkout (maintaining same logic as before)
// Method: POST
// Endpoint: /shops/checkout
// Updated Checkout API with Rapid Delivery
// Updated Checkout API - Allow rapid delivery for any order (no vendor eligibility check)
// Checkout API - No vendor or driver checks for rapid delivery
const checkout = async (req, res) => {
  try {
    const {
      userId,
      cartIds = [],
      productId,
      vendorId,
      quantity,
      isRapidDelivery = false
    } = req.body;
 
    // Validate input
    if (!userId || (cartIds.length === 0 && (!productId || !vendorId || !quantity))) {
      return res.status(400).json({
        success: 0,
        message: "Invalid request parameters. Either cartIds OR productId+vendorId+quantity required"
      });
    }
 
    let items = [];
    let usingCart = cartIds.length > 0;
    let vendorIds = new Set();
 
    if (usingCart) {
      const cartItems = await CartPharmacy.find({
        _id: { $in: cartIds },
        userId
      })
      .populate("productId")
      .populate("medicineId")
      .populate("vendorId");
 
      if (cartItems.length !== cartIds.length) {
        return res.status(400).json({
          success: 0,
          message: "Some cart items not found"
        });
      }
 
      for (const item of cartItems) {
        const isMedicine = !!item.medicineId;
        const itemId = isMedicine ? item.medicineId._id : item.productId._id;
        vendorIds.add(item.vendorId._id.toString());
 
        let stockEntry;
        if (isMedicine) {
          stockEntry = await PharmacyMedicine.findOne({
            vendorId: item.vendorId._id,
            medicineId: itemId,
            stock: { $gte: item.quantity }
          });
        } else {
          stockEntry = await PharmacyProductVendor.findOne({
            vendorId: item.vendorId._id,
            productId: itemId,
            stock: { $gte: item.quantity }
          });
        }
 
        if (!stockEntry) {
          return res.status(400).json({
            success: 0,
            message: `Insufficient stock for ${isMedicine ? item.medicineId.name : item.productId.name}`,
            item: {
              name: isMedicine ? item.medicineId.name : item.productId.name,
              requested: item.quantity,
              available: stockEntry?.stock || 0
            }
          });
        }
 
        const basePrice = parseFloat(
          isMedicine
            ? (item.medicineId.source === "service"
                ? item.medicineId.bestPrice || "0"
                : item.medicineId.best_price || "0")
            : item.productId.best_price || "0"
        );
        
        const discount = stockEntry.discount_seller || 0;
        const finalPrice = basePrice * (1 - discount / 100);
        const total = finalPrice * item.quantity;
 
        items.push({
          itemType: isMedicine ? "medicine" : "product",
          itemId,
          itemName: isMedicine ? item.medicineId.name : item.productId.name,
          vendorId: item.vendorId._id,
          vendorName: item.vendorId.shopName,
          quantity: item.quantity,
          unitPrice: basePrice,
          discount,
          finalPrice: parseFloat(finalPrice.toFixed(2)),
          totalPrice: parseFloat(total.toFixed(2))
        });
      }
    } else {
      let productDetails = await PharmacyProduct.findById(productId);
      let isMedicine = false;
      
      if (!productDetails) {
        const [serviceMed, generalMed] = await Promise.all([
          Service.findById(productId),
          Medicine.findById(productId)
        ]);
        productDetails = serviceMed || generalMed;
        isMedicine = true;
      }
 
      if (!productDetails) {
        return res.status(404).json({
          success: 0,
          message: "Product/Medicine not found"
        });
      }
 
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return res.status(404).json({
          success: 0,
          message: "Vendor not found"
        });
      }
 
      vendorIds.add(vendorId);
 
      let stockEntry;
      if (isMedicine) {
        stockEntry = await PharmacyMedicine.findOne({
          vendorId,
          medicineId: productId,
          stock: { $gte: quantity }
        });
      } else {
        stockEntry = await PharmacyProductVendor.findOne({
          vendorId,
          productId,
          stock: { $gte: quantity }
        });
      }
 
      if (!stockEntry) {
        return res.status(400).json({
          success: 0,
          message: "Insufficient stock",
          requested: quantity,
          available: stockEntry?.stock || 0
        });
      }
 
      const basePrice = parseFloat(
        isMedicine
          ? (productDetails.source === "service"
              ? productDetails.bestPrice || "0"
              : productDetails.best_price || "0")
          : productDetails.best_price || "0"
      );
      
      const discount = stockEntry.discount_seller || 0;
      const finalPrice = basePrice * (1 - discount / 100);
      const total = finalPrice * quantity;
 
      items.push({
        itemType: isMedicine ? "medicine" : "product",
        itemId: productId,
        itemName: productDetails.name,
        vendorId,
        vendorName: vendor.shopName,
        quantity,
        unitPrice: basePrice,
        discount,
        finalPrice: parseFloat(finalPrice.toFixed(2)),
        totalPrice: parseFloat(total.toFixed(2))
      });
    }
 
    const subTotal = parseFloat(items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2));
    const tax = parseFloat((subTotal * 0.02).toFixed(2));
    const baseDelivery = subTotal >= 300 ? 0 : 50;
    const rapidDeliveryFee = isRapidDelivery ? 100 : 0;
    const deliveryCharges = parseFloat((baseDelivery + rapidDeliveryFee).toFixed(2));
    const grandTotal = parseFloat((subTotal + tax + deliveryCharges).toFixed(2));
 
    return res.status(200).json({
      success: 1,
      message: "Checkout processed successfully",
      orderSummary: {
        items,
        subTotal,
        tax,
        deliveryCharges,
        rapidDeliveryFee,
        isRapidDelivery,
        grandTotal,
        vendorIds: Array.from(vendorIds)
      }
    });
 
  } catch (error) {
    console.error("Checkout Error:", error);
    return res.status(500).json({
      success: 0,
      message: "Internal Server Error",
      error: error.message
    });
  }
};
 
 

 
// Confirm Order API - no driver or vendor rapid delivery checks here
const confirmOrder = async (req, res) => {
  try {
    const {
      userId,
      cartIds = [],
      productId,
      vendorId,
      quantity,
      address,
      timeSlot,
      dateSlot,
      coupon = null,
      isRapidDelivery = false
    } = req.body;
 
    if (!userId || !address || !timeSlot || !dateSlot ||
        (cartIds.length === 0 && (!productId || !vendorId || !quantity))) {
      return res.status(400).json({
        success: 0,
        message: "Required: userId, address, timeSlot + (cartIds OR productId+vendorId+quantity)"
      });
    }
 
    let items = [];
    let usingCart = cartIds.length > 0;
    let vendorIds = new Set();
 
    if (usingCart) {
      const cartItems = await CartPharmacy.find({
        _id: { $in: cartIds },
        userId
      })
      .populate("productId")
      .populate("medicineId")
      .populate("vendorId");
 
      if (cartItems.length !== cartIds.length) {
        return res.status(400).json({
          success: 0,
          message: "Some cart items not found"
        });
      }
 
      for (const item of cartItems) {
        const isMedicine = !!item.medicineId;
        const itemId = isMedicine ? item.medicineId._id : item.productId._id;
        vendorIds.add(item.vendorId._id.toString());
 
        let stockEntry;
        if (isMedicine) {
          stockEntry = await PharmacyMedicine.findOne({
            vendorId: item.vendorId._id,
            medicineId: itemId,
            stock: { $gte: item.quantity }
          });
        } else {
          stockEntry = await PharmacyProductVendor.findOne({
            vendorId: item.vendorId._id,
            productId: itemId,
            stock: { $gte: item.quantity }
          });
        }
 
        if (!stockEntry) {
          return res.status(400).json({
            success: 0,
            message: `Insufficient stock for ${isMedicine ? item.medicineId.name : item.productId.name}`,
            item: {
              name: isMedicine ? item.medicineId.name : item.productId.name,
              requested: item.quantity,
              available: stockEntry?.stock || 0
            }
          });
        }
 
        const basePrice = parseFloat(
          isMedicine
            ? (item.medicineId.source === "service"
                ? item.medicineId.bestPrice || "0"
                : item.medicineId.best_price || "0")
            : item.productId.best_price || "0"
        );
        
        const discount = stockEntry.discount_seller || 0;
        const finalPrice = basePrice * (1 - discount / 100);
        const total = finalPrice * item.quantity;
 
        items.push({
          itemType: isMedicine ? "medicine" : "product",
          itemId,
          itemName: isMedicine ? item.medicineId.name : item.productId.name,
          vendorId: item.vendorId._id,
          vendorName: item.vendorId.shopName,
          quantity: item.quantity,
          unitPrice: basePrice,
          discount,
          finalPrice: parseFloat(finalPrice.toFixed(2)),
          totalPrice: parseFloat(total.toFixed(2))
        });
 
        // Deduct stock
        stockEntry.stock -= item.quantity;
        await stockEntry.save();
      }
 
      // Clear cart
      await CartPharmacy.deleteMany({ _id: { $in: cartIds } });
    } else {
      let productDetails = await PharmacyProduct.findById(productId);
      let isMedicine = false;
      
      if (!productDetails) {
        const [serviceMed, generalMed] = await Promise.all([
          Service.findById(productId),
          Medicine.findById(productId)
        ]);
        productDetails = serviceMed || generalMed;
        isMedicine = true;
      }
 
      if (!productDetails) {
        return res.status(404).json({
          success: 0,
          message: "Product/Medicine not found"
        });
      }
 
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return res.status(404).json({
          success: 0,
          message: "Vendor not found"
        });
      }
 
      vendorIds.add(vendorId);
 
      let stockEntry;
      if (isMedicine) {
        stockEntry = await PharmacyMedicine.findOne({
          vendorId,
          medicineId: productId,
          stock: { $gte: quantity }
        });
      } else {
        stockEntry = await PharmacyProductVendor.findOne({
          vendorId,
          productId,
          stock: { $gte: quantity }
        });
      }
 
      if (!stockEntry) {
        return res.status(400).json({
          success: 0,
          message: "Insufficient stock",
          requested: quantity,
          available: stockEntry?.stock || 0
        });
      }
 
      const basePrice = parseFloat(
        isMedicine
          ? (productDetails.source === "service"
              ? productDetails.bestPrice || "0"
              : productDetails.best_price || "0")
          : productDetails.best_price || "0"
      );
      
      const discount = stockEntry.discount_seller || 0;
      const finalPrice = basePrice * (1 - discount / 100);
      const total = finalPrice * quantity;
 
      items.push({
        itemType: isMedicine ? "medicine" : "product",
        itemId: productId,
        itemName: productDetails.name,
        vendorId,
        vendorName: vendor.shopName,
        quantity,
        unitPrice: basePrice,
        discount,
        finalPrice: parseFloat(finalPrice.toFixed(2)),
        totalPrice: parseFloat(total.toFixed(2))
      });
 
      // Deduct stock
      stockEntry.stock -= quantity;
      await stockEntry.save();
    }
 
    const subTotal = parseFloat(items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2));
    const tax = parseFloat((subTotal * 0.02).toFixed(2));
    const baseDelivery = subTotal >= 300 ? 0 : 50;
    const rapidDeliveryFee = isRapidDelivery ? 100 : 0;
    const deliveryCharges = parseFloat((baseDelivery + rapidDeliveryFee).toFixed(2));
    const grandTotal = parseFloat((subTotal + tax + deliveryCharges).toFixed(2));
 
    // Create order
    const order = new OrderPharmacy({
      userId,
      items,
      address,
      timeSlot: isRapidDelivery ? "Rapid Delivery" : timeSlot,
      dateSlot,
      coupon,
      subTotal,
      tax,
      deliveryCharges,
      rapidDeliveryFee,
      isRapidDelivery,
      grandTotal,
      orderStatus: "confirmed",
      status: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      vendorIds: Array.from(vendorIds)
    });
 
    await order.save();
 
    return res.status(200).json({
      success: 1,
      message: "Order confirmed successfully",
      orderId: order._id,
      grandTotal: order.grandTotal,
      deliveryTime: order.isRapidDelivery ? "Will be assigned soon" : order.timeSlot,
      deliveryDate: order.dateSlot,
      isRapidDelivery: order.isRapidDelivery,
      items: order.items.map(item => ({
        id: item.itemId,
        name: item.itemName,
        quantity: item.quantity,
        price: item.totalPrice
      })),
      vendorIds: order.vendorIds
    });
 
  } catch (error) {
    console.error("Order Confirmation Error:", error);
    return res.status(500).json({
      success: 0,
      message: "Failed to confirm order",
      error: error.message
    });
  }
};
 
 
 
// Get vendor availability by ID
// Method: GET  
// Endpoint: /shops/getVendorAvailability
const getVendoravailability = async (req, res) => {
  try {
    const { vendorId } = req.query;
 
    if (!vendorId) {
      return res.status(400).send({
        success: 0,
        message: "Vendor ID is required.",
      });
    }
 
    const data = await Available.find({ vendorId: vendorId });
 
    if (data.length === 0) {
      return res.send({
        success: 1,
        message: "No availability slots found for this vendor.",
        details: [],
      });
    }
 
    return res.send({
      success: 1,
      message: "Availability fetched successfully",
      details: data,
    });
  } catch (error) {
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};
 
// Get vendor rejected and delivered orders
// Method: GET
// Endpoint: /shops/order-history
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
      status: { $in: [5, 6] } // Both delivered and rejected statuses
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
 
 
  
// Track Order API
// Method: GET
// Endpoint: /shops/track-order
const trackOrder = async (req, res) => {
  try {
    const { orderId } = req.query;
 
    if (!orderId) {
      return res.status(400).json({
        success: 0,
        message: "Order ID is required"
      });
    }
 
    const order = await OrderPharmacy.findById(orderId).populate("userId");
 
    if (!order) {
      return res.status(404).json({
        success: 0,
        message: "Order not found"
      });
    }
 
    const statusMap = {
      0: "Order Placed",
      1: "Vendor Accepted",
      2: "Assigned to Driver",
      3: "Out for Delivery",
      4: "Driver Arrived",
      5: "Delivered",
      6: "Rejected"
    };
 
    return res.status(200).json({
      success: 1,
      message: "Order tracking fetched successfully",
      data: {
        orderId: order._id,
        user: {
          id: order.userId._id,
          name: order.userId.name,
          email: order.userId.email
        },
        items: order.items.map(item => ({
          name: item.itemName,
          quantity: item.quantity,
          price: item.totalPrice
        })),
        subTotal: order.subTotal,
        tax: order.tax,
        deliveryCharges: order.deliveryCharges,
        grandTotal: order.grandTotal,
        isRapidDelivery: order.isRapidDelivery,
        status: order.status,
        currentStatusText: statusMap[order.status] || "Unknown Status",
        timeSlot: order.timeSlot,
        dateSlot: order.dateSlot,
        placedAt: order.createdAt,
        lastUpdated: order.updatedAt
      }
    });
 
  } catch (error) {
    console.error("Track Order Error:", error);
    return res.status(500).json({
      success: 0,
      message: "Failed to fetch order tracking",
      error: error.message
    });
  }
};
 

// Get popular medicines (ordered at least 3 times)
// Method: GET
// Endpoint: /shops/medicine/popularMedicines
const getPopularMedicines = async (req, res) => {
  try {
    // Find all medicines marked as popular
    const popularMedicines = await Medicine.find({
      popularCategory: true
    });
 
    if (!popularMedicines || popularMedicines.length === 0) {
      return res.status(200).json({
        success: 1,
        message: "No popular medicines found",
        data: []
      });
    }
 
    const medicineIds = popularMedicines.map(m => m._id);
 
    // Get vendor stock information for these medicines
    const vendorStock = await PharmacyMedicine.find({
      medicineId: { $in: medicineIds },
      stock: { $gt: 0 },
      onStatus: "1"
    });
 
    // Group by medicineId
    const medicineVendorMap = {};
    vendorStock.forEach(entry => {
      const medicineId = entry.medicineId.toString();
      if (!medicineVendorMap[medicineId]) {
        medicineVendorMap[medicineId] = [];
      }
      medicineVendorMap[medicineId].push(entry);
    });
 
    // Format response
    const result = popularMedicines.map(medicine => {
      const vendors = medicineVendorMap[medicine._id.toString()] || [];
      
      let totalStock = 0;
      let bestVendor = null;
      let lowestPrice = Infinity;
 
      vendors.forEach(vendorEntry => {
        totalStock += vendorEntry.stock;
 
        const basePrice = parseFloat(medicine.best_price || "0");
        const discount = vendorEntry.discount_seller || 0;
        const discountAmount = (basePrice * discount) / 100;
        const finalPrice = basePrice - discountAmount;
 
        if (finalPrice < lowestPrice) {
          lowestPrice = finalPrice;
          bestVendor = {
            vendorId: vendorEntry.vendorId,
            vendorPrice: finalPrice.toFixed(2),
            discount: discount,
            stock: vendorEntry.stock
          };
        }
      });
 
      return {
        medicineId: medicine._id,
        name: medicine.name,
        description: medicine.description,
        image: medicine.image,
        category: medicine.category,
        manufacturer: medicine.manufacturer,
        totalOrders: medicine.orderCount,
        totalStock,
        vendorId: bestVendor?.vendorId,
        vendorPrice: bestVendor?.vendorPrice,
        discount: bestVendor?.discount,
        stockFromVendor: bestVendor?.stock,
        type: "general" // Since we're only using Medicine model here
      };
    }).filter(med => med.vendorId); // Only include medicines with available stock
 
    return res.status(200).json({
      success: 1,
      message: "Popular medicines fetched successfully",
      total: result.length,
      data: result
    });
 
  } catch (error) {
    console.error("Get Popular Medicines Error:", error.message);
    return res.status(500).json({
      success: 0,
      message: "Internal server error",
      error: error.message,
    });
  }
};


// Get popular products
// Method: GET
// Endpoint: /shops/popularProducts
const getPopularProducts = async (req, res) => {
  try {
    const popularProducts = await PharmacyProduct.find({
      popularCategory: true
    }).select('_id name description image category best_price');
 
    if (!popularProducts || popularProducts.length === 0) {
      return res.status(200).json({
        success: 1,
        message: "No popular products found",
        data: []
      });
    }
 
    // Get vendor stock information for these products
    const productIds = popularProducts.map(p => p._id);
    const vendorStock = await PharmacyProductVendor.find({
      productId: { $in: productIds },
      stock: { $gt: 0 }
    });
 
    // Format response
    const result = await Promise.all(popularProducts.map(async (product) => {
      const vendors = vendorStock.filter(v => v.productId.toString() === product._id.toString());
      
      let totalStock = 0;
      let bestVendor = null;
      let lowestPrice = Infinity;
 
      vendors.forEach(vendorEntry => {
        totalStock += vendorEntry.stock;
 
        const basePrice = parseFloat(product.best_price || "0");
        const discount = vendorEntry.discount_seller || 0;
        const finalPrice = basePrice * (1 - discount / 100);
 
        if (finalPrice < lowestPrice) {
          lowestPrice = finalPrice;
          bestVendor = {
            vendorId: vendorEntry.vendorId,
            vendorPrice: finalPrice.toFixed(2),
            discount: discount,
            stock: vendorEntry.stock
          };
        }
      });
 
      return {
        productId: product._id,
        name: product.name,
        description: product.description,
        image: product.image,
        category: product.category,
        totalStock,
        vendorId: bestVendor?.vendorId,
        vendorPrice: bestVendor?.vendorPrice,
        discount: bestVendor?.discount,
        stockFromVendor: bestVendor?.stock
      };
    }));
 
    return res.status(200).json({
      success: 1,
      message: "Popular products fetched successfully",
      total: result.length,
      data: result
    });
 
  } catch (error) {
    console.error("Get Popular Products Error:", error.message);
    return res.status(500).json({
      success: 0,
      message: "Internal server error",
      error: error.message,
    });
  }
};
 
 
 
 
module.exports = {
  shopsNear,
  getAvailableProducts,
  getAvailableMedicines,
  getVendorsByProduct,
  getVendorsByMedicine,
  checkCartVendorConflict,
  addToCart,
  getCartByUser,
  updateCartQuantity,
  removeCartItem,
  checkout,
  confirmOrder,
  getVendoravailability,
  getOrderHistory,
  getVendorProducts,
  getVendorMedicines,
  trackOrder,
  getPopularProducts,
  getPopularMedicines
};
 