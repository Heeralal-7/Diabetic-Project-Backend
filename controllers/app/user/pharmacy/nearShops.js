const Vendor = require("../../../../modal/vandor");
const Service = require("../../../../modal/addServices");
const PharmacyProduct = require("../../../../modal/PharmacyProducts");
const PharmacyProductVendor = require("../../../../modal/PharmacyProductVendor");
const Medicine = require("../../../../modal/MedicineSchema");
const PharmacyMedicine = require("../../../../modal/VendorMedicine");

const DeliveryCharges = require("../../../../modal/DeliveryCharges");
const MembershipPurchase = require("../../../../modal/membershipPurchase");
const MemberShip = require("../../../../modal/MemberShip");
const UserMemberShip = require("../../../../modal/UsermemberShip");

const CartPharmacy = require("../../../../modal/CartPharmacy");
const OrderPharmacy = require("../../../../modal/OrderPharmacy");

const Available = require("../../../../modal/availability");
const ShopTiming = require("../../../../modal/ShopTiming");
const Coupon = require("../../../../modal/Coupon");
const Patient = require("../../../../modal/addpatientdetails");
const maxLimit = require("../../../../modal/distanceLimit");

const { calculateOnRoadDistance, calculateBatchOnRoadDistance  } = require("../../../../controllers/utils/googleMapsDistance");
const { calculateDeliveryCharges } = require("../../../../controllers/utils/distanceCalculator");

const moment = require("moment");
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;


// Get all pharmacy with distance calculation
// Method: Get
// Endpoints: /shops/get
// const shopsNear = async (req, res) => {
//     try {
//         const { 
//             page = 1, 
//             limit = 10,
//             latitude: userLat,
//             longitude: userLng
//         } = req.query;

//         const pageNumber = parseInt(page, 10);
//         const pageSize = parseInt(limit, 10);
//         const skip = (pageNumber - 1) * pageSize;

//         // Check if user location is provided
//         const hasUserLocation = !isNaN(parseFloat(userLat)) && !isNaN(parseFloat(userLng));

//         // Fetch pharmacies
//         const user = await Vendor.find({ vendor: "Pharmacy" })
//             .skip(skip)
//             .limit(pageSize);

//         if (!user || user.length === 0) {
//             return res.send({
//                 success: 0,
//                 message: "No pharmacy found",
//             });
//         }

//         // Get additional details for each pharmacy
//         const pharmacyDetails = await Promise.all(
//             user.map(async (vendor) => {
//                 const tests = await Service.find({ vendorId: vendor._id });
//                 const timings = await ShopTiming.find({ shopId: vendor._id });

//                 const baseDetails = {
//                     ...vendor._doc,
//                     tests,
//                     description: vendor.description || "",
//                     timings: timings.length > 0 ? timings : getDefaultTimings(),
//                     hasValidLocation: vendor.latitude && vendor.longitude && 
//                                     !isNaN(parseFloat(vendor.latitude)) && 
//                                     !isNaN(parseFloat(vendor.longitude))
//                 };

//                 return baseDetails;
//             })
//         );

//         // If user location is provided, calculate straight-line distances
//         if (hasUserLocation) {
//             const userLatNum = parseFloat(userLat);
//             const userLngNum = parseFloat(userLng);
            
//             // Calculate straight-line distance for each pharmacy
//             const pharmaciesWithDistances = pharmacyDetails.map(pharmacy => {
//                 // Check if pharmacy has valid location
//                 if (!pharmacy.hasValidLocation) {
//                     return {
//                         ...pharmacy,
//                         distance: {
//                             value: null,
//                             text: "Location unavailable",
//                             calculationMethod: null,
//                             status: 'NO_LOCATION'
//                         }
//                     };
//                 }

//                 try {
//                     const vendorLat = parseFloat(pharmacy.latitude);
//                     const vendorLng = parseFloat(pharmacy.longitude);
                    
//                     // Validate coordinates
//                     if (vendorLat >= -90 && vendorLat <= 90 && 
//                         vendorLng >= -180 && vendorLng <= 180) {
                        
//                         // Calculate straight-line distance
//                         const distance = calculateDistance(userLatNum, userLngNum, vendorLat, vendorLng);
                        
//                         return {
//                             ...pharmacy,
//                             distance: {
//                                 value: distance,
//                                 text: `${distance.toFixed(1)} km`,
//                                 calculationMethod: 'STRAIGHT_LINE',
//                                 status: 'OK'
//                             }
//                         };
//                     } else {
//                         return {
//                             ...pharmacy,
//                             distance: {
//                                 value: null,
//                                 text: "Invalid location coordinates",
//                                 calculationMethod: null,
//                                 status: 'ERROR'
//                             }
//                         };
//                     }
//                 } catch (error) {
//                     console.error(`Error calculating distance for pharmacy ${pharmacy._id}:`, error);
//                     return {
//                         ...pharmacy,
//                         distance: {
//                             value: null,
//                             text: "Distance calculation failed",
//                             calculationMethod: null,
//                             status: 'ERROR'
//                         }
//                     };
//                 }
//             });

//             // Sort pharmacies by distance (nearest first)
//             pharmaciesWithDistances.sort((a, b) => {
//                 const aDist = a.distance?.value;
//                 const bDist = b.distance?.value;
                
//                 if (!aDist && !bDist) return 0;
//                 if (!aDist) return 1;
//                 if (!bDist) return -1;
//                 return aDist - bDist;
//             });

//             // Count statistics
//             const pharmaciesWithValidDistance = pharmaciesWithDistances.filter(p => 
//                 p.distance?.status === 'OK'
//             ).length;

//             return res.send({
//                 success: 1,
//                 message: "Pharmacies fetched successfully with distances",
//                 details: pharmaciesWithDistances,
//                 userLocation: {
//                     latitude: userLatNum,
//                     longitude: userLngNum
//                 },
//                 stats: {
//                     totalPharmacies: pharmaciesWithDistances.length,
//                     pharmaciesWithDistance: pharmaciesWithValidDistance,
//                     pharmaciesWithoutLocation: pharmaciesWithDistances.length - pharmaciesWithValidDistance,
//                     calculationMethod: 'STRAIGHT_LINE'
//                 },
//                 pagination: {
//                     page: pageNumber,
//                     limit: pageSize,
//                     hasMore: user.length === pageSize
//                 }
//             });
//         }

//         // If no location provided, return pharmacies without distance
//         return res.send({
//             success: 1,
//             message: "Pharmacies fetched successfully",
//             details: pharmacyDetails,
//             note: "Provide latitude and longitude query parameters to get distances",
//             pagination: {
//                 page: pageNumber,
//                 limit: pageSize,
//                 hasMore: user.length === pageSize
//             }
//         });
//     } catch (error) {
//         console.error('Error in shopsNear API:', error);
//         return res.status(500).send({
//             success: 0,
//             message: error.message,
//         });
//     }
// };

// Distance calculation function
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  try {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return parseFloat(distance.toFixed(2));
  } catch (error) {
    console.error("Distance calculation error:", error);
    return null;
  }
};

// Helper function for default timings
const getDefaultTimings = () => {
  return [{
    day: "Monday to Saturday",
    openTime: "09:00",
    closeTime: "21:00",
    isOpen: true
  }];
};

// POST Endpoint: /shops/get (for pharmacies)
const shopsNear = async (req, res) => {
  try {
    // Get parameters from both POST body and GET query (for backward compatibility)
    const page = parseInt(req.body.page) || parseInt(req.query.page) || 1;
    const limit = parseInt(req.body.limit) || parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get location from request
    const latitude = req.body.latitude || req.query.latitude;
    const longitude = req.body.longitude || req.query.longitude;
    const search = req.body.search || req.query.search;
    
    // Check if valid location is provided
    const userLat = parseFloat(latitude);
    const userLng = parseFloat(longitude);
    const hasUserLocation = !isNaN(userLat) && !isNaN(userLng);

    // Get distance limit from database
    const distanceLimit = await maxLimit.findOne().sort({ createdAt: -1 });
    const maxDistance = distanceLimit ? distanceLimit.pharmacyLimit : 20; // Default 20km (pharmacyLimit)

    // Build match conditions
    const matchConditions = {
      vendor: "Pharmacy"
    };
    
    // Add search condition if provided
    if (search) {
      matchConditions.$or = [
        { vendorName: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    // Start with base query
    let query = Vendor.find(matchConditions);

    // Apply pagination
    query = query.skip(skip).limit(limit);

    // Execute query
    const pharmacies = await query;

    if (!pharmacies || pharmacies.length === 0) {
      return res.send({
        success: 0,
        message: "No pharmacy found",
      });
    }

    // Get additional details for each pharmacy
    const pharmacyDetails = await Promise.all(
      pharmacies.map(async (vendor) => {
        const tests = await Service.find({ vendorId: vendor._id });
        const timings = await ShopTiming.find({ shopId: vendor._id });

        return {
          ...vendor._doc,
          tests,
          description: vendor.description || "",
          timings: timings.length > 0 ? timings : getDefaultTimings(),
          hasValidLocation: vendor.latitude && vendor.longitude && 
                          !isNaN(parseFloat(vendor.latitude)) && 
                          !isNaN(parseFloat(vendor.longitude))
        };
      })
    );

    // If user location is provided, calculate straight-line distances and filter
    if (hasUserLocation) {
      const pharmaciesWithDistances = [];
      
      for (const pharmacy of pharmacyDetails) {
        // Check if pharmacy has valid location
        if (pharmacy.hasValidLocation) {
          try {
            const vendorLat = parseFloat(pharmacy.latitude);
            const vendorLng = parseFloat(pharmacy.longitude);
            
            // Validate coordinates range
            if (vendorLat >= -90 && vendorLat <= 90 && 
                vendorLng >= -180 && vendorLng <= 180) {
              
              // Calculate straight-line distance
              const distance = calculateDistance(userLat, userLng, vendorLat, vendorLng);
              
              if (distance !== null && distance <= maxDistance) {
                pharmaciesWithDistances.push({
                  ...pharmacy,
                  distance: distance
                });
              }
            }
          } catch (error) {
            console.error(`Error calculating distance for pharmacy ${pharmacy._id}:`, error);
          }
        }
      }

      // Sort pharmacies by distance (nearest first)
      pharmaciesWithDistances.sort((a, b) => {
        if (!a.distance) return 1;
        if (!b.distance) return -1;
        return a.distance - b.distance;
      });

      // Get counts for stats
      const pharmaciesWithValidDistance = pharmaciesWithDistances.length;
      const pharmaciesWithoutLocation = pharmacyDetails.length - pharmaciesWithDistances.length;

      return res.send({
        success: 1,
        message: "Pharmacies fetched successfully with distances",
        details: pharmaciesWithDistances,
        distanceLimit: maxDistance,
        userLocation: {
          latitude: userLat,
          longitude: userLng
        },
        stats: {
          totalPharmacies: pharmacyDetails.length,
          pharmaciesWithinLimit: pharmaciesWithValidDistance,
          pharmaciesWithoutLocation: pharmaciesWithoutLocation,
          calculationMethod: 'STRAIGHT_LINE'
        },
        pagination: {
          page: page,
          limit: limit,
          hasMore: pharmacies.length === limit
        }
      });
    }

    // If no location provided, return all pharmacies
    return res.send({
      success: 1,
      message: "Pharmacies fetched successfully",
      details: pharmacyDetails,
      note: "Provide latitude and longitude to filter by distance",
      pagination: {
        page: page,
        limit: limit,
        hasMore: pharmacies.length === limit
      }
    });

  } catch (error) {
    console.error('Error in shopsNear API:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};


// Helper function for default timings
// const getDefaultTimings = () => {
//     return [
//         {
//             day: "Monday",
//             openingTime: "09:00 AM",
//             closingTime: "06:00 PM",
//             isClosed: false,
//             description: "Regular business hours"
//         },
//         {
//             day: "Tuesday",
//             openingTime: "09:00 AM",
//             closingTime: "06:00 PM",
//             isClosed: false,
//             description: "Regular business hours"
//         },
//         {
//             day: "Wednesday",
//             openingTime: "09:00 AM",
//             closingTime: "06:00 PM",
//             isClosed: false,
//             description: "Regular business hours"
//         },
//         {
//             day: "Thursday",
//             openingTime: "09:00 AM",
//             closingTime: "06:00 PM",
//             isClosed: false,
//             description: "Regular business hours"
//         },
//         {
//             day: "Friday",
//             openingTime: "09:00 AM",
//             closingTime: "06:00 PM",
//             isClosed: false,
//             description: "Regular business hours"
//         },
//         {
//             day: "Saturday",
//             openingTime: "09:00 AM",
//             closingTime: "06:00 PM",
//             isClosed: false,
//             description: "Regular business hours"
//         },
//         {
//             day: "Sunday",
//             openingTime: "Closed",
//             closingTime: "06:00 PM",
//             isClosed: true,
//             description: "Regular business hours"
//         }
//     ];
// };

// Get all pharmacy products
// Method: Get
// Endpoints: /shops/getProducts
const getAvailableProducts = async (req, res) => {
    try {
        const vendorStock = await PharmacyProductVendor.find({ stock: { $gt: 0 } })
            .populate('vendorId', 'name latitude longitude');;

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
                        stock: vendorEntry.stock,
                        vendorName: vendorEntry.vendorId?.name, // accessing populated vendor name
                        latitude: vendorEntry.vendorId?.latitude, // accessing populated latitude
                        longitude: vendorEntry.vendorId?.longitude, //
                    };
                }
            });

            return {
                ...product.toObject(),
                totalStock,
                vendorId: bestVendor.vendorId,
                vendorName: bestVendor.vendorName,
                latitude: bestVendor.latitude,
                longitude: bestVendor.longitude,
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
        const vendorStock = await PharmacyMedicine.find({ stock: { $gt: 0 } })
            .populate('vendorId', 'name latitude longitude');

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
                        stock: vendorEntry.stock,
                        name: vendorEntry.vendorId?.name,
                        latitude: vendorEntry.vendorId?.latitude,
                        longitude: vendorEntry.vendorId?.longitude
                    };
                }
            });

            return {
                ...medicine,
                totalStock,
                vendorId: bestVendor.vendorId,
                vendorPrice: bestVendor.vendorPrice,
                discount: bestVendor.discount,
                stockFromVendor: bestVendor.stock,
                vendorName: bestVendor.name,
                latitude: bestVendor.latitude,
                longitude: bestVendor.longitude
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

// Get vendors by product with distance calculation
// Method: Get
// Endpoints: /shops/getVendorDetails
const getVendorsByProduct = async (req, res) => {
    try {
        const { productId, userLat, userLng } = req.query;

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

        // Check if user location is provided
        const hasUserLocation = !isNaN(parseFloat(userLat)) && !isNaN(parseFloat(userLng));

        // Get all vendor details first
        const vendorPromises = vendorEntries.map(async (entry) => {
            const vendor = await Vendor.findById(entry.vendorId).select(
                "name email phone shopName address latitude longitude city state"
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
                city: vendor.city,
                state: vendor.state,
                stock: entry.stock,
                discount: entry.discount_seller,
                vendorPrice: finalPrice,
                latitude: vendor.latitude,
                longitude: vendor.longitude,
                hasValidLocation: vendor.latitude && vendor.longitude && 
                               !isNaN(parseFloat(vendor.latitude)) && 
                               !isNaN(parseFloat(vendor.longitude))
            };
        });

        const vendorDataArray = await Promise.all(vendorPromises);

        // If user location is provided, calculate straight-line distances
        if (hasUserLocation) {
            const userLatNum = parseFloat(userLat);
            const userLngNum = parseFloat(userLng);
            
            const vendorsWithDistances = vendorDataArray.map(vendor => {
                // For invalid location vendors
                if (!vendor.hasValidLocation) {
                    return {
                        ...vendor,
                        distance: {
                            value: null,
                            text: "Location unavailable",
                            calculationMethod: null,
                            status: 'NO_LOCATION'
                        }
                    };
                }

                try {
                    const vendorLat = parseFloat(vendor.latitude);
                    const vendorLng = parseFloat(vendor.longitude);
                    
                    // Validate coordinates
                    if (vendorLat >= -90 && vendorLat <= 90 && 
                        vendorLng >= -180 && vendorLng <= 180) {
                        
                        // Calculate straight-line distance
                        const distance = calculateDistance(userLatNum, userLngNum, vendorLat, vendorLng);
                        
                        return {
                            ...vendor,
                            distance: {
                                value: distance,
                                text: `${distance.toFixed(1)} km`,
                                calculationMethod: 'STRAIGHT_LINE',
                                status: 'OK'
                            }
                        };
                    } else {
                        return {
                            ...vendor,
                            distance: {
                                value: null,
                                text: "Invalid location coordinates",
                                calculationMethod: null,
                                status: 'ERROR'
                            }
                        };
                    }
                } catch (error) {
                    console.error(`Error calculating distance for vendor ${vendor.vendorId}:`, error);
                    return {
                        ...vendor,
                        distance: {
                            value: null,
                            text: "Distance calculation failed",
                            calculationMethod: null,
                            status: 'ERROR'
                        }
                    };
                }
            });

            // Sort vendors by distance (nearest first)
            const sortedVendors = [...vendorsWithDistances].sort((a, b) => {
                const aDist = a.distance?.value ?? Infinity;
                const bDist = b.distance?.value ?? Infinity;
                
                if (!aDist && !bDist) return 0;
                if (!aDist) return 1;
                if (!bDist) return -1;
                return aDist - bDist;
            });

            // Calculate statistics
            const vendorsWithValidDistance = sortedVendors.filter(v => 
                v.distance?.status === 'OK'
            ).length;

            return res.status(200).json({
                success: 1,
                message: "Vendors with stock fetched successfully",
                productName: product.name,
                productId: product._id,
                totalVendors: vendorDataArray.length,
                userLocation: {
                    latitude: userLatNum,
                    longitude: userLngNum
                },
                vendors: sortedVendors,
                stats: {
                    totalVendors: vendorDataArray.length,
                    vendorsWithValidLocation: vendorsWithValidDistance,
                    vendorsWithoutLocation: vendorDataArray.length - vendorsWithValidDistance,
                    calculationMethod: 'STRAIGHT_LINE'
                }
            });
        }

        // If no location provided, return vendors without distance
        return res.status(200).json({
            success: 1,
            message: "Vendors with stock fetched successfully",
            productName: product.name,
            productId: product._id,
            totalVendors: vendorDataArray.length,
            note: "Provide userLat and userLng query parameters to get distances",
            vendors: vendorDataArray
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

// getVendorsByMedicine function - Removed Google Maps on-road distance logic
const getVendorsByMedicine = async (req, res) => {
    try {
        const { medicineId, userLat, userLng } = req.query;

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
            onStatus: "0"
        });

        if (!vendorEntries.length) {
            return res.status(200).json({
                success: 0,
                message: "No vendors with stock available for this medicine",
            });
        }

        // Check if user location is provided
        const hasUserLocation = !isNaN(parseFloat(userLat)) && !isNaN(parseFloat(userLng));

        const vendorsWithDetails = await Promise.all(
            vendorEntries.map(async (entry) => {
                const vendor = await Vendor.findById(entry.vendorId).select(
                    "name email phone shopName address latitude longitude city state"
                );

                const basePrice = medicine.source === "service"
                    ? parseFloat(medicine.bestPrice || "0")
                    : parseFloat(medicine.best_price || "0");

                const discountAmount = (basePrice * entry.discount_seller) / 100;
                const finalPrice = (basePrice - discountAmount).toFixed(2);

                const vendorData = {
                    vendorId: vendor._id,
                    name: vendor.name,
                    shopName: vendor.shopName,
                    contact: vendor.phone,
                    email: vendor.email,
                    address: vendor.address,
                    city: vendor.city,
                    state: vendor.state,
                    stock: entry.stock,
                    discount: entry.discount_seller,
                    vendorPrice: finalPrice,
                    latitude: vendor.latitude,
                    longitude: vendor.longitude,
                    hasValidLocation: vendor.latitude && vendor.longitude && 
                                   !isNaN(parseFloat(vendor.latitude)) && 
                                   !isNaN(parseFloat(vendor.longitude))
                };

                // Calculate straight-line distance if user location is provided
                if (hasUserLocation && vendorData.hasValidLocation) {
                    try {
                        const userLatNum = parseFloat(userLat);
                        const userLngNum = parseFloat(userLng);
                        const vendorLat = parseFloat(vendor.latitude);
                        const vendorLng = parseFloat(vendor.longitude);
                        
                        // Validate coordinates range
                        if (vendorLat >= -90 && vendorLat <= 90 && 
                            vendorLng >= -180 && vendorLng <= 180) {
                            
                            // Calculate straight-line distance
                            const distance = calculateDistance(userLatNum, userLngNum, vendorLat, vendorLng);
                            
                            return {
                                ...vendorData,
                                distance: {
                                    value: distance,
                                    text: `${distance.toFixed(1)} km`,
                                    calculationMethod: 'STRAIGHT_LINE',
                                    status: 'OK'
                                }
                            };
                        }
                    } catch (error) {
                        console.error(`Error calculating distance for vendor ${vendor._id}:`, error);
                    }
                }
                
                // Return without distance if no user location or calculation failed
                return {
                    ...vendorData,
                    distance: hasUserLocation ? {
                        value: null,
                        text: "Location unavailable",
                        calculationMethod: null,
                        status: 'NO_LOCATION'
                    } : null
                };
            })
        );

        // Sort vendors by distance if user location provided
        let sortedVendors = [...vendorsWithDetails];
        if (hasUserLocation) {
            sortedVendors.sort((a, b) => {
                const aDist = a.distance?.value ?? Infinity;
                const bDist = b.distance?.value ?? Infinity;
                
                if (!aDist && !bDist) return 0;
                if (!aDist) return 1;
                if (!bDist) return -1;
                return aDist - bDist;
            });
        }

        return res.status(200).json({
            success: 1,
            message: "Vendors with stock fetched successfully",
            medicineName: medicine.name,
            totalVendors: vendorsWithDetails.length,
            userLocation: hasUserLocation ? {
                latitude: parseFloat(userLat),
                longitude: parseFloat(userLng)
            } : null,
            vendors: sortedVendors,
            stats: hasUserLocation ? {
                vendorsWithDistance: sortedVendors.filter(v => 
                    v.distance?.status === 'OK'
                ).length,
                vendorsWithoutLocation: sortedVendors.filter(v => 
                    v.distance?.status === 'NO_LOCATION'
                ).length,
                calculationMethod: 'STRAIGHT_LINE'
            } : null
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
    const userId =
      req.user?._id ||
      req.userId ||
      req.query.userId ||
      req.body.userId;

    if (!userId) {
      return res.status(400).json({
        success: 0,
        message: "User ID is required",
      });
    }

    // 1️⃣ Get cart items
    const cartItems = await CartPharmacy.find({ userId });

    if (!cartItems || cartItems.length === 0) {
      return res.status(200).json({
        success: 1,
        message: "Cart is empty",
        vendorId: null,
        total: 0,
        data: [],
      });
    }

    // 2️⃣ Vendor is same for all cart items
    const vendorId = cartItems[0].vendorId;

    if (!vendorId) {
      return res.status(400).json({
        success: 0,
        message: "Vendor not found in cart",
      });
    }

    // 3️⃣ Vendor details
    const vendor = await Vendor.findById(
      vendorId,
      "name latitude longitude"
    );

    // 4️⃣ Vendor products with stock
    const vendorProducts = await PharmacyProductVendor.find({
      vendorId,
      stock: { $gt: 0 },
    }).populate({
      path: "productId",
      select: "name description image_url category best_price",
    });

    // 5️⃣ Filter + format safely
    const products = vendorProducts
      .filter((item) => item.productId) // ❗ VERY IMPORTANT FIX
      .map((item) => {
        const basePrice = Number(item.productId.best_price) || 0;
        const discount = Number(item.discount_seller) || 0;

        const vendorPrice =
          basePrice - (basePrice * discount) / 100;

        return {
          productId: item.productId._id,
          name: item.productId.name,
          description: item.productId.description,
          image: item.productId.image_url,
          category: item.productId.category,

          basePrice: basePrice,
          discount: discount,
          vendorPrice: Number(vendorPrice.toFixed(2)),

          stock: item.stock,
          vendorId: vendorId,
          vendorName: vendor?.name || "",
          latitude: vendor?.latitude || null,
          longitude: vendor?.longitude || null,
        };
      });

    return res.status(200).json({
      success: 1,
      message: "Vendor products fetched successfully",
      vendorId: vendorId,
      total: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Get Vendor Products Error:", error);

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

        // Get vendor details
        const vendor = await Vendor.findById(vendorId, 'name latitude longitude');

        // Get all medicines from this vendor with stock > 0
        const vendorMedicines = await PharmacyMedicine.find({
            vendorId,
            stock: { $gt: 0 },
            onStatus: "0"
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
                image: medicine.image_url,
                category: medicine.category,
                manufacturer: medicine.manufacturer,
                basePrice: basePrice,
                discount: discount,
                vendorPrice: vendorPrice.toFixed(2),
                stock: item.stock,
                vendorId: item.vendorId,
                vendorName: vendor?.name,
                latitude: vendor?.latitude,
                longitude: vendor?.longitude,
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

// const calculateDistance = (lat1, lon1, lat2, lon2) => {
//     const R = 6371; // Radius of the earth in km
//     const dLat = deg2rad(lat2 - lat1);
//     const dLon = deg2rad(lon2 - lon1);
//     const a = 
//         Math.sin(dLat/2) * Math.sin(dLat/2) +
//         Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
//         Math.sin(dLon/2) * Math.sin(dLon/2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
//     const distance = R * c; // Distance in km
//     return parseFloat(distance.toFixed(2));
// };

const deg2rad = (deg) => {
    return deg * (Math.PI/180);
};

// ✅ NEW FUNCTION: Upload Prescription
// Method: POST
// Endpoint: /shops/uploadPrescription
const uploadPrescription = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: 0,
                message: "No image file provided"
            });
        }

        // Assuming file is saved locally or via cloud middleware and path/url is available in req.file
        // Adjust the path construction based on your static file serving setup
        const imageUrl = `/uploads/user/prescription/${req.file.filename}`;

        return res.status(200).json({
            success: 1,
            message: "Prescription uploaded successfully",
            imageUrl: imageUrl
        });

    } catch (error) {
        console.error("Prescription Upload Error:", error.message);
        return res.status(500).json({
            success: 0,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

// Checkout (maintaining same logic as before)
// Method: POST
// Endpoint: /shops/checkout

const checkout = async (req, res) => {
  try {
    console.log('Checkout request received:', req.body);
    const {
      userId,
      cartIds = [],
      productId,
      vendorId,
      quantity,
      isRapidDelivery = false,
      couponCode = null,
      userLocation,
      addressId
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: 0,
        message: "User ID is required"
      });
    }

    // Check membership for pharmacy delivery
    let membershipData = {
      hasActiveMembership: false,
      isFreeDelivery: false,
      remainingDeliveries: 0,
      message: ""
    };

    try {
      const activeMembership = await UserMemberShip.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        isActive: true,
        endDate: { $gt: new Date() }
      });

      if (activeMembership) {
        const pharmacyLimit = activeMembership.pharmacyDeliveryLimit || 0;
        const pharmacyUsed = activeMembership.pharmacyDeliveriesUsed || 0;
        const remaining = Math.max(0, pharmacyLimit - pharmacyUsed);

        if (remaining > 0) {
          membershipData = {
            hasActiveMembership: true,
            isFreeDelivery: true,
            remainingDeliveries: remaining,
            message: "Free pharmacy delivery available from membership"
          };
        } else {
          membershipData = {
            hasActiveMembership: true,
            isFreeDelivery: false,
            remainingDeliveries: 0,
            message: "Pharmacy membership delivery limit exhausted"
          };
        }
      }
    } catch (membershipError) {
      console.warn('Membership check failed:', membershipError);
    }

    let patientDetails = null;
    if (addressId) {
      try {
        const patientDoc = await Patient.findById(addressId).lean();
        if (!patientDoc) {
          return res.status(400).json({
            success: 0,
            message: "Address not found"
          });
        }
        
        patientDetails = {
          _id: patientDoc._id,
          name: patientDoc.name || "",
          phone: patientDoc.phone || "",
          gender: patientDoc.gender || "",
          dob: patientDoc.dob || "",
          address: patientDoc.address || "",
          city: patientDoc.city || "",
          state: patientDoc.state || "",
          pinCode: patientDoc.pinCode || "",
          country: patientDoc.country || "",
          pic: patientDoc.pic || "",
          latitude: patientDoc.latitude || null,
          longitude: patientDoc.longitude || null
        };
        
        if (!userLocation && patientDetails.latitude && patientDetails.longitude) {
          userLocation = {
            latitude: patientDetails.latitude,
            longitude: patientDetails.longitude
          };
        }
      } catch (error) {
        console.error('Error fetching patient details:', error);
        return res.status(400).json({
          success: 0,
          message: "Error fetching patient address details"
        });
      }
    }

    if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
      return res.status(400).json({
        success: 0,
        message: "User location is required for delivery charge calculation"
      });
    }

    if (cartIds.length === 0 && (!productId || !vendorId || !quantity)) {
      return res.status(400).json({
        success: 0,
        message: "Either cart items or product details must be provided"
      });
    }

    const deliverySettings = await DeliveryCharges.findOne().sort({ lastUpdated: -1 }).lean() || {
      baseDeliveryCharge: 50,
      freeDeliveryThreshold: 300,
      rapidDeliveryCharge: 100,
      taxPercentage: 2,
      freeDeliveryRadius: 10,
      perKmCharge: 5
    };

    const {
      baseDeliveryCharge = 50,
      freeDeliveryThreshold = 300,
      rapidDeliveryCharge = 100,
      taxPercentage = 2,
      freeDeliveryRadius = 10,
      perKmCharge = 5
    } = deliverySettings;

    let items = [];
    let usingCart = cartIds.length > 0;
    let vendorIds = new Set();
    let couponDetails = null;
    let couponDiscount = 0;
    let orderVendorId = null;
    let vendorLocation = null;

    if (usingCart) {
      let cartObjectIds;
      try {
        cartObjectIds = cartIds.map(id => new mongoose.Types.ObjectId(id));
      } catch (idError) {
        return res.status(400).json({
          success: 0,
          message: "Invalid cart item IDs",
          invalidIds: cartIds.filter(id => !mongoose.Types.ObjectId.isValid(id))
        });
      }

      const cartItems = await CartPharmacy.find({
        _id: { $in: cartObjectIds },
        userId: new mongoose.Types.ObjectId(userId)
      })
        .populate("productId")
        .populate("medicineId")
        .populate("vendorId");

      if (cartItems.length !== cartIds.length) {
        const foundIds = cartItems.map(item => item._id.toString());
        const missingIds = cartIds.filter(id => !foundIds.includes(id));

        return res.status(400).json({
          success: 0,
          message: "Some cart items not found",
          missingCartIds: missingIds,
          foundItems: foundIds
        });
      }

      if (!cartItems[0]?.vendorId?._id) {
        return res.status(400).json({
          success: 0,
          message: "Could not determine vendor from cart items"
        });
      }
      orderVendorId = cartItems[0].vendorId._id;

      const vendor = await Vendor.findById(orderVendorId).select('name shopName latitude longitude address');
      if (vendor && vendor.latitude && vendor.longitude) {
        vendorLocation = {
          latitude: parseFloat(vendor.latitude),
          longitude: parseFloat(vendor.longitude),
          name: vendor.name || vendor.shopName,
          address: vendor.address
        };
      }

      for (const item of cartItems) {
        if (!item.vendorId || !item.vendorId._id.equals(orderVendorId)) {
          return res.status(400).json({
            success: 0,
            message: "All cart items must be from the same vendor",
            expectedVendor: orderVendorId.toString(),
            foundVendor: item.vendorId?._id?.toString() || 'unknown'
          });
        }

        const isMedicine = !!item.medicineId;
        const itemId = isMedicine ? item.medicineId._id : item.productId._id;
        vendorIds.add(item.vendorId._id.toString());

        let stockEntry;
        try {
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
        } catch (dbError) {
          console.error('Stock lookup error:', dbError);
          return res.status(500).json({
            success: 0,
            message: "Error checking product availability"
          });
        }

        if (!stockEntry) {
          return res.status(400).json({
            success: 0,
            message: `Insufficient stock for ${isMedicine ? item.medicineId?.name : item.productId?.name}`,
            itemId: itemId.toString()
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
          itemName: isMedicine ? item.medicineId?.name : item.productId?.name,
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
      try {
        orderVendorId = new mongoose.Types.ObjectId(vendorId);
      } catch (error) {
        return res.status(400).json({
          success: 0,
          message: "Invalid vendor ID format"
        });
      }

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

      const vendor = await Vendor.findById(orderVendorId).select('name shopName latitude longitude address');
      if (!vendor) {
        return res.status(404).json({
          success: 0,
          message: "Vendor not found"
        });
      }

      if (vendor && vendor.latitude && vendor.longitude) {
        vendorLocation = {
          latitude: parseFloat(vendor.latitude),
          longitude: parseFloat(vendor.longitude),
          name: vendor.name || vendor.shopName,
          address: vendor.address
        };
      }

      vendorIds.add(orderVendorId.toString());

      let stockEntry;
      try {
        if (isMedicine) {
          stockEntry = await PharmacyMedicine.findOne({
            vendorId: orderVendorId,
            medicineId: productId,
            stock: { $gte: quantity }
          });
        } else {
          stockEntry = await PharmacyProductVendor.findOne({
            vendorId: orderVendorId,
            productId: productId,
            stock: { $gte: quantity }
          });
        }
      } catch (dbError) {
        console.error('Stock lookup error:', dbError);
        return res.status(500).json({
          success: 0,
          message: "Error checking product availability"
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
        vendorId: orderVendorId,
        vendorName: vendor.shopName,
        quantity,
        unitPrice: basePrice,
        discount,
        finalPrice: parseFloat(finalPrice.toFixed(2)),
        totalPrice: parseFloat(total.toFixed(2))
      });
    }

    // Calculate distance and delivery charges
    let deliveryCalculation = {
      baseDelivery: 0,
      rapidDeliveryFee: 0,
      totalDelivery: 0,
      distance: 0,
      distanceText: "",
      durationText: "",
      freeRadiusUsed: false,
      extraDistance: 0,
      extraCharges: 0,
      freeDeliveryEligible: false,
      calculationMethod: 'STRAIGHT_LINE',
      calculationStatus: 'FALLBACK',
      membershipApplied: false,
      membershipDiscount: 0,
      membershipRemainingDeliveries: membershipData.remainingDeliveries,
      rapidDeliveryApplied: false,
      rapidDeliveryDiscount: 0,
      extraKmCharges: 0,
      isWithinFreeRadius: false,
      isFreeDeliveryByAmount: false
    };

    if (vendorLocation && userLocation) {
      try {
        const onRoadDistanceData = await calculateOnRoadDistance(
          userLocation.latitude,
          userLocation.longitude,
          vendorLocation.latitude,
          vendorLocation.longitude
        );

        let actualDistance = 0;
        
        if (onRoadDistanceData.status === 'OK') {
          actualDistance = onRoadDistanceData.distance;
          deliveryCalculation.calculationMethod = 'ON_ROAD';
          deliveryCalculation.calculationStatus = 'OK';
          deliveryCalculation.distanceText = onRoadDistanceData.distanceText;
          deliveryCalculation.durationText = onRoadDistanceData.durationText;
        } else if (onRoadDistanceData.status === 'FALLBACK') {
          actualDistance = onRoadDistanceData.distance;
          deliveryCalculation.calculationMethod = 'STRAIGHT_LINE';
          deliveryCalculation.calculationStatus = 'FALLBACK';
          deliveryCalculation.distanceText = onRoadDistanceData.distanceText;
        } else {
          actualDistance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            vendorLocation.latitude,
            vendorLocation.longitude
          );
          deliveryCalculation.calculationMethod = 'STRAIGHT_LINE';
          deliveryCalculation.calculationStatus = 'ERROR';
          deliveryCalculation.distanceText = `${actualDistance.toFixed(1)} km (approx)`;
        }

        deliveryCalculation.distance = actualDistance;
        
        const subTotal = parseFloat(items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2));
        const isFreeDeliveryByAmount = subTotal >= freeDeliveryThreshold;
        const isWithinFreeRadius = actualDistance <= freeDeliveryRadius;
        
        deliveryCalculation.isFreeDeliveryByAmount = isFreeDeliveryByAmount;
        deliveryCalculation.isWithinFreeRadius = isWithinFreeRadius;
        
        let baseDelivery = 0;
        let extraCharges = 0;
        let extraDistance = 0;
        
        // Calculate extra distance charges (ALWAYS applies if distance > free radius, regardless of membership)
        if (actualDistance > freeDeliveryRadius) {
          extraDistance = actualDistance - freeDeliveryRadius;
          extraCharges = Math.ceil(extraDistance) * perKmCharge;
        }
        
        // Base delivery calculation (can be free by amount or radius or membership)
        if (!isFreeDeliveryByAmount && !isWithinFreeRadius) {
          baseDelivery = baseDeliveryCharge;
        }
        
        // Apply membership logic
        let membershipApplied = false;
        let membershipDiscount = 0;
        let rapidDeliveryApplied = false;
        let rapidDeliveryDiscount = 0;
        
        if (membershipData.isFreeDelivery && membershipData.remainingDeliveries > 0) {
          membershipApplied = true;
          
          if (isRapidDelivery) {
            // Membership + Rapid Delivery: Both base and rapid are free
            rapidDeliveryApplied = true;
            rapidDeliveryDiscount = rapidDeliveryCharge;
            membershipDiscount = baseDelivery; // Base delivery becomes free
            baseDelivery = 0;
          } else {
            // Only membership: Base delivery free, rapid not selected
            membershipDiscount = baseDelivery;
            baseDelivery = 0;
          }
        } else {
          // No membership benefits available
          if (isRapidDelivery) {
            rapidDeliveryFee = rapidDeliveryCharge;
          }
        }
        
        // Calculate rapid delivery fee (after applying discounts)
        let rapidDeliveryFee = 0;
        if (isRapidDelivery && !rapidDeliveryApplied) {
          rapidDeliveryFee = rapidDeliveryCharge;
        }
        
        // Store all calculation details
        deliveryCalculation = {
          baseDelivery,
          rapidDeliveryFee,
          totalDelivery: baseDelivery + rapidDeliveryFee + extraCharges,
          distance: actualDistance,
          distanceText: deliveryCalculation.distanceText,
          durationText: deliveryCalculation.durationText,
          freeRadiusUsed: isWithinFreeRadius,
          extraDistance: extraDistance,
          extraCharges: extraCharges,
          extraKmCharges: extraCharges, // Duplicate for clarity
          freeDeliveryEligible: isFreeDeliveryByAmount || isWithinFreeRadius,
          calculationMethod: deliveryCalculation.calculationMethod,
          calculationStatus: deliveryCalculation.calculationStatus,
          membershipApplied: membershipApplied,
          membershipDiscount: membershipDiscount,
          membershipRemainingDeliveries: membershipData.remainingDeliveries,
          rapidDeliveryApplied: rapidDeliveryApplied,
          rapidDeliveryDiscount: rapidDeliveryDiscount,
          isWithinFreeRadius: isWithinFreeRadius,
          isFreeDeliveryByAmount: isFreeDeliveryByAmount,
          perKmCharge: perKmCharge,
          freeDeliveryRadius: freeDeliveryRadius
        };

      } catch (distanceError) {
        console.error('Distance calculation error:', distanceError);
        
        const subTotal = parseFloat(items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2));
        const baseDelivery = subTotal >= freeDeliveryThreshold ? 0 : baseDeliveryCharge;
        const rapidDeliveryFee = isRapidDelivery ? rapidDeliveryCharge : 0;
        
        deliveryCalculation = {
          baseDelivery,
          rapidDeliveryFee,
          totalDelivery: baseDelivery + rapidDeliveryFee,
          distance: 0,
          distanceText: "Distance calculation failed",
          durationText: "",
          freeRadiusUsed: true,
          extraDistance: 0,
          extraCharges: 0,
          extraKmCharges: 0,
          freeDeliveryEligible: subTotal >= freeDeliveryThreshold,
          calculationMethod: 'STRAIGHT_LINE',
          calculationStatus: 'ERROR',
          membershipApplied: false,
          membershipDiscount: 0,
          membershipRemainingDeliveries: 0,
          rapidDeliveryApplied: false,
          rapidDeliveryDiscount: 0,
          isWithinFreeRadius: true,
          isFreeDeliveryByAmount: subTotal >= freeDeliveryThreshold,
          perKmCharge: perKmCharge,
          freeDeliveryRadius: freeDeliveryRadius
        };
      }
    } else {
      const subTotal = parseFloat(items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2));
      const baseDelivery = subTotal >= freeDeliveryThreshold ? 0 : baseDeliveryCharge;
      const rapidDeliveryFee = isRapidDelivery ? rapidDeliveryCharge : 0;
      
      deliveryCalculation = {
        baseDelivery,
        rapidDeliveryFee,
        totalDelivery: baseDelivery + rapidDeliveryFee,
        distance: 0,
        distanceText: "Location data unavailable",
        durationText: "",
        freeRadiusUsed: true,
        extraDistance: 0,
        extraCharges: 0,
        extraKmCharges: 0,
        freeDeliveryEligible: subTotal >= freeDeliveryThreshold,
        calculationMethod: 'STRAIGHT_LINE',
        calculationStatus: 'ERROR',
        membershipApplied: false,
        membershipDiscount: 0,
        membershipRemainingDeliveries: 0,
        rapidDeliveryApplied: false,
        rapidDeliveryDiscount: 0,
        isWithinFreeRadius: true,
        isFreeDeliveryByAmount: subTotal >= freeDeliveryThreshold,
        perKmCharge: perKmCharge,
        freeDeliveryRadius: freeDeliveryRadius
      };
    }

    if (couponCode) {
      try {
        couponDetails = await Coupon.findOne({
          couponCode: couponCode.trim(),
          status: "1"
        }).lean();

        if (!couponDetails) {
          return res.status(400).json({
            success: 0,
            message: "Invalid coupon code"
          });
        }

        const currentDate = moment();
        const expireDate = moment(couponDetails.expireDate, "DD/MM/YYYY");

        if (expireDate.isBefore(currentDate, 'day')) {
          return res.status(400).json({
            success: 0,
            message: "This coupon has expired"
          });
        }

        if (couponDetails.vendorId && !new mongoose.Types.ObjectId(couponDetails.vendorId).equals(orderVendorId)) {
          return res.status(400).json({
            success: 0,
            message: "This coupon is not valid for the selected vendor"
          });
        }
      } catch (couponError) {
        console.error('Coupon validation error:', couponError);
        return res.status(400).json({
          success: 0,
          message: "Error validating coupon",
          error: couponError.message
        });
      }
    }

    const subTotal = parseFloat(items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2));

    if (couponDetails) {
      if (couponDetails.percentageDiscount && couponDetails.percentageDiscount !== "") {
        couponDiscount = subTotal * (parseFloat(couponDetails.percentageDiscount) / 100);
      } else if (couponDetails.fixedAmountDiscount && couponDetails.fixedAmountDiscount !== "") {
        couponDiscount = Math.min(parseFloat(couponDetails.fixedAmountDiscount), subTotal);
      }
      couponDiscount = parseFloat(couponDiscount.toFixed(2));
    }

    const taxableAmount = subTotal - couponDiscount;
    const tax = parseFloat((taxableAmount * (taxPercentage / 100)).toFixed(2));

    // Calculate total delivery charge including extra kilometer charges
    let totalDeliveryCharge = deliveryCalculation.totalDelivery;
    
    // Important: Extra kilometer charges ALWAYS apply regardless of membership
    // Only base delivery and rapid delivery can be free with membership
    
    const grandTotal = parseFloat((taxableAmount + tax + totalDeliveryCharge).toFixed(2));

    return res.status(200).json({
      success: 1,
      message: "Checkout processed successfully",
      orderSummary: {
        items,
        subTotal,
        couponDiscount,
        couponDetails: couponDetails ? {
          id: couponDetails._id,
          code: couponDetails.couponCode,
          discount: couponDetails.percentageDiscount || couponDetails.fixedAmountDiscount,
          type: couponDetails.percentageDiscount ? 'percentage' : 'fixed',
          vendorSpecific: !!couponDetails.vendorId
        } : null,
        tax,
        taxPercentage,
        deliveryCharges: deliveryCalculation.baseDelivery,
        rapidDeliveryFee: deliveryCalculation.rapidDeliveryFee,
        extraDistanceCharges: deliveryCalculation.extraCharges, // This should always show
        totalDelivery: totalDeliveryCharge,
        isRapidDelivery,
        grandTotal,
        vendorIds: Array.from(vendorIds),
        vendorInfo: vendorLocation ? {
          name: vendorLocation.name,
          address: vendorLocation.address,
          latitude: vendorLocation.latitude,
          longitude: vendorLocation.longitude
        } : null,
        patientDetails: patientDetails ? {
          ...patientDetails,
          formattedAddress: `${patientDetails.address}, ${patientDetails.city}, ${patientDetails.state} - ${patientDetails.pinCode}`
        } : null,
        distanceInfo: {
          distance: deliveryCalculation.distance,
          distanceText: deliveryCalculation.distanceText,
          durationText: deliveryCalculation.durationText,
          calculationMethod: deliveryCalculation.calculationMethod,
          calculationStatus: deliveryCalculation.calculationStatus,
          freeRadius: freeDeliveryRadius,
          extraDistance: deliveryCalculation.extraDistance,
          extraCharges: deliveryCalculation.extraCharges, // Make sure this is included
          freeDeliveryEligible: deliveryCalculation.freeDeliveryEligible,
          freeDeliveryThreshold,
          baseDeliveryCharge,
          perKmCharge,
          isWithinFreeRadius: deliveryCalculation.isWithinFreeRadius,
          isFreeDeliveryByAmount: deliveryCalculation.isFreeDeliveryByAmount
        },
        membershipData: membershipData,
        deliveryCalculation: deliveryCalculation // Include full calculation object
      }
    });

  } catch (error) {
    console.error("Checkout Error:", error.message, error.stack);
    return res.status(500).json({
      success: 0,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// Updated confirmOrder function
// ✅ UPDATED FUNCTION: Confirm Order
// ✅ UPDATED FUNCTION: Confirm Order
const confirmOrder = async (req, res) => {
  try {
    console.log('Confirm pharmacy order request received:', req.body);
    const {
      userId,
      cartIds = [],
      address,
      addressId,
      timeSlot,
      dateSlot,
      coupon = null,
      isRapidDelivery = false,
      orderSummary,
      membershipApplied = false,
      membershipRemainingDeliveries = 0,
      membershipWasApplied = false,
      paymentMethod = 'cod',
      razorpayPaymentId = null, // Legacy/Frontend specific key
      razorpayOrderId = null,
      paymentId = null,         // ✅ Generic key matching Schema
      paymentDetails = {},      // ✅ Full details object matching Schema
      prescriptionImage = "" 
    } = req.body;

    if (!userId) {
      return res.status(400).json({ success: 0, message: "User ID is required" });
    }
    
    // ... (Address handling logic remains the same) ...
    let patientDetails = null;
    let finalAddress = address;
    if (addressId) {
       // ... fetch patient details logic ...
       try {
        const patientDoc = await Patient.findById(addressId).lean();
        if (patientDoc) {
          finalAddress = `${patientDoc.name}, ${patientDoc.address}, ${patientDoc.city}, ${patientDoc.state} - ${patientDoc.pinCode}`;
          patientDetails = { ...patientDoc };
        }
      } catch (error) {
        console.error('Error fetching patient details:', error);
      }
    }
    if (!patientDetails && orderSummary.patientDetails) {
      patientDetails = orderSummary.patientDetails;
    }

    // ... (Membership logic remains the same) ...

    // Verify coupon if provided
    let couponDetails = null;
    if (coupon) {
      couponDetails = await Coupon.findOne({ couponCode: coupon.trim(), status: "0" });
      if (!couponDetails) return res.status(400).json({ success: 0, message: "Invalid coupon code" });
    }

    // Generate order ID
    const orderId = `PHARMACY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // ✅ FIX: Determine correct Payment ID and Details for DB
    // Use the explicitly passed paymentId, or fall back to razorpayPaymentId
    const finalPaymentId = paymentId || razorpayPaymentId || null;
    
    // Ensure paymentDetails object has the IDs if it was passed empty but IDs exist
    const finalPaymentDetails = {
      ...paymentDetails,
      razorpay_payment_id: paymentDetails.razorpay_payment_id || razorpayPaymentId,
      razorpay_order_id: paymentDetails.razorpay_order_id || razorpayOrderId
    };

    // Create order data
    const orderData = {
      userId: new mongoose.Types.ObjectId(userId),
      orderId: orderId,
      items: orderSummary.items.map(item => ({
        productId: item.itemType === 'product' ? new mongoose.Types.ObjectId(item.itemId) : undefined,
        medicineId: item.itemType === 'medicine' ? new mongoose.Types.ObjectId(item.itemId) : undefined,
        itemName: item.itemName,
        vendorId: new mongoose.Types.ObjectId(item.vendorId),
        vendorName: item.vendorName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        totalPrice: item.totalPrice,
        itemType: item.itemType
      })),
      
      address: finalAddress || "Address not available", 
      addressId: addressId ? new mongoose.Types.ObjectId(addressId) : undefined,
      timeSlot: isRapidDelivery ? "Rapid Delivery" : timeSlot,
      dateSlot: dateSlot,
      prescriptionImage: prescriptionImage || "",
      patientDetails: patientDetails || {},
      
      coupon: couponDetails ? {
        id: new mongoose.Types.ObjectId(couponDetails._id),
        code: couponDetails.couponCode,
        discountType: couponDetails.percentageDiscount ? 'percentage' : 'fixed',
        discountValue: couponDetails.percentageDiscount || couponDetails.fixedAmountDiscount,
        description: couponDetails.description
      } : undefined,
      
      couponDiscount: orderSummary.couponDiscount || 0,
      subTotal: orderSummary.subTotal,
      tax: orderSummary.tax,
      deliveryCharges: orderSummary.deliveryCharges,
      rapidDeliveryFee: orderSummary.rapidDeliveryFee || 0,
      extraDistanceCharges: orderSummary.extraDistanceCharges || 0,
      isRapidDelivery,
      grandTotal: orderSummary.grandTotal,
      orderStatus: "confirmed",
      status: 0,
      
      // ✅ Payment Fields Mapped Correctly to Schema
      paymentMethod: paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'completed',
      paymentId: finalPaymentId,          // Saves to 'paymentId' field in DB
      transactionId: finalPaymentId,      // Often same as paymentId for Razorpay
      paymentDetails: finalPaymentDetails, // Saves full object
      
      vendorIds: orderSummary.vendorIds.map(id => new mongoose.Types.ObjectId(id)),
      membershipApplied: membershipWasApplied,
      membershipRemainingDeliveries: membershipRemainingDeliveries,
      membershipDiscount: orderSummary.deliveryCalculation?.membershipDiscount || 0,
      rapidDeliveryDiscount: orderSummary.deliveryCalculation?.rapidDeliveryDiscount || 0,
      totalMembershipSavings: (orderSummary.deliveryCalculation?.membershipDiscount || 0) + 
                            (orderSummary.deliveryCalculation?.rapidDeliveryDiscount || 0),
      distanceInfo: orderSummary.distanceInfo || {},
      deliveryCalculation: orderSummary.deliveryCalculation || {},
      extraKmCharges: orderSummary.extraDistanceCharges || 0
    };

    const order = new OrderPharmacy(orderData);
    const savedOrder = await order.save();

    // Deduct stock
    await Promise.all(orderSummary.items.map(async (item) => {
      const Model = item.itemType === "medicine" ? PharmacyMedicine : PharmacyProductVendor;
      await Model.findOneAndUpdate(
        {
          vendorId: new mongoose.Types.ObjectId(item.vendorId),
          [item.itemType === "medicine" ? "medicineId" : "productId"]: new mongoose.Types.ObjectId(item.itemId)
        },
        { $inc: { stock: -item.quantity } }
      );
    }));

    // Clear cart
    if (cartIds.length > 0) {
      await CartPharmacy.deleteMany({
        _id: { $in: cartIds.map(id => new mongoose.Types.ObjectId(id)) },
        userId: new mongoose.Types.ObjectId(userId)
      });
    }

    return res.status(200).json({
      success: 1,
      message: "Order confirmed successfully",
      data: {
        orderId: savedOrder._id,
        orderNumber: savedOrder.orderId,
        grandTotal: savedOrder.grandTotal,
        paymentId: savedOrder.paymentId, // Return the saved ID
        prescriptionImage: savedOrder.prescriptionImage
      }
    });

  } catch (error) {
    console.error("Pharmacy Order Confirmation Error:", error.message, error.stack);
    return res.status(500).json({
      success: 0,
      message: "Failed to confirm order",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
// Method: GET
// Endpoint: /shops/order-history
const getOrderHistory = async (req, res) => {
  try {
      const userId = req.userId || req.query.userId || req.body.userId;

      if (!userId) {
          return res.status(400).json({
              success: false,
              message: "userId is required",
          });
      }

      const orders = await OrderPharmacy.find({
          userId: userId,
          status: { $in: [0, 1, 2, 3, 4, 5, 6] }
      })
      // ✅ Added Population for Product and Medicine to get details if needed
      .populate({
          path: 'items.productId',
          model: 'PharmacyProduct',
          select: 'name image description' 
      })
      .populate({
          path: 'items.medicineId',
          model: 'PharmacyMedicine',
          select: 'name image description'
      })
      // Existing vendor population
      .populate({
          path: 'items.vendorId',
          model: 'vandor',
          select: 'name labName business image address vendor'
      })
      .populate({
          path: "vendorId",
          model: "vandor",
          select: "name labName business vendor image address"
      })
      .sort({ createdAt: -1 });

      const formattedOrders = orders.map(order => {
          const itemsTotal = order.items.reduce((sum, item) => sum + ((item.price || item.unitPrice || 0) * (item.quantity || 1)), 0);

          // Logic to find vendor data
          let vendorData = null;
          if (order.vendorId && typeof order.vendorId === 'object') {
              vendorData = order.vendorId;
          } else if (order.items && order.items.length > 0 && order.items[0].vendorId) {
              if (typeof order.items[0].vendorId === 'object') {
                  vendorData = order.items[0].vendorId;
              }
          }

          return {
              _id: order._id,
              orderId: order.orderId,
              status: order.status,
              statusText: typeof getStatusText !== 'undefined' ? getStatusText(order.status) : order.orderStatus, // Safe check added
              grandTotal: order.grandTotal || itemsTotal,
              subTotal: order.subTotal || itemsTotal,
              deliveryCharges: order.deliveryCharges || 0,
              couponDiscount: order.couponDiscount || 0,
              tax: order.tax || 0,
              deliveryAddress: order.deliveryAddress,
              fullAddress: order.address,
              patientDetails: order.patientDetails,
              
              // ✅ ADDED PRESCRIPTION IMAGE
              prescriptionImage: order.prescriptionImage || order.prescriptionUrl || null,

              // ✅ ADDED EXTRA DISTANCE INFO
              extraDistanceCharges: order.extraDistanceCharges || order.deliveryCalculation?.extraCharges || 0,
              distanceInfo: order.distanceInfo || order.deliveryCalculation?.distanceInfo || {},
              deliveryCalculation: order.deliveryCalculation || {},

              paymentMethod: order.paymentMethod,
              paymentStatus: order.paymentStatus,
              isRapidDelivery: order.isRapidDelivery,
              timeSlot: order.timeSlot,
              dateSlot: order.dateSlot,
              
              vendor: vendorData ? {
                  _id: vendorData._id,
                  name: vendorData.name,
                  shopName: vendorData.labName || vendorData.business || vendorData.vendor || "Pharmacy Store", 
                  image: vendorData.image,
                  address: vendorData.address
              } : {
                  _id: null,
                  name: "Unknown Vendor",
                  shopName: "Pharmacy Store"
              },

              user: {
                  _id: order.userId,
                  name: order.patientDetails?.name || "Customer"
              },
              
              // ✅ Updated items mapping to include all Schema fields
              items: order.items.map(item => ({
                  _id: item._id,
                  
                  // IDs
                  productId: item.productId?._id || item.productId, // Handle populated object or ID
                  medicineId: item.medicineId?._id || item.medicineId,
                  vendorId: item.vendorId?._id || item.vendorId,
                  
                  // Names & Details (Schema fields included)
                  itemName: item.itemName || item.medicineId?.name || 'Medicine',
                  productName: item.productName || item.productId?.name || 'Product',
                  vendorName: item.vendorName, // ✅ Included from Schema
                  
                  // Quantity & Pricing
                  quantity: item.quantity || 1,
                  unitPrice: item.unitPrice || item.price || 0,
                  price: item.price || item.unitPrice || 0, // Fallback for frontend compatibility
                  vendorPrice: item.vendorPrice || 0, // ✅ Included from Schema
                  discount: item.discount || 0,       // ✅ Included from Schema
                  
                  // Calculations
                  totalPrice: item.totalPrice || ((item.price || item.unitPrice || 0) * (item.quantity || 1)),
                  
                  // Metadata
                  itemType: item.itemType,
                  prescriptionRequired: item.prescriptionRequired || false,
                  rejectionReason: item.rejectionReason,
                  
                  // Image (Fetched from populated product/medicine if not directly in item)
                  image: item.productId?.image || item.medicineId?.image || null
              })),
              
              totalItems: order.items.reduce((sum, item) => sum + (item.quantity || 1), 0),
              createdAt: order.createdAt,
              updatedAt: order.updatedAt,
              statusDetails: {
                  description: typeof getStatusDescription !== 'undefined' ? getStatusDescription(order) : "", // Safe check added
                  reason: order.rejectionReason,
                  statusChangedAt: order.updatedAt
              }
          };
      });

      res.json({
          success: 1,
          message: "Orders fetched successfully",
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

// Helper function agar aapke paas defined nahi hai to code crash na ho
function getStatusText(status) {
    const statusMap = {
        0: "Pending",
        1: "Confirmed",
        2: "Shipped",
        3: "Out for Delivery",
        4: "Delivered",
        5: "Cancelled",
        6: "Returned"
    };
    return statusMap[status] || "Unknown";
}

// Helper functions
function getStatusText(status) {
    const statusMap = {
        0: "Order Placed",
        1: "Vendor Accepted", 
        2: "Assigned to Driver",
        3: "Out for Delivery",
        4: "Driver Arrived",
        5: "Delivered",
        6: "Cancelled"
    };
    return statusMap[status] || "Unknown";
}

function getStatusDescription(order) {
    const descriptionMap = {
        5: "Successfully delivered to your address",
        6: order.rejectionReason || "Order was cancelled",
        3: "Your order is out for delivery",
        2: "Driver assigned for delivery", 
        1: "Pharmacy has accepted your order",
        0: "Order has been placed successfully"
    };
    return descriptionMap[order.status] || "Order is being processed";
}



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
                address: order.address,
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


// Get popular medicines (ordered at least 1 time, sorted by order count in descending order)
// Method: GET
// Endpoint: /shops/medicine/popularMedicines
const getPopularMedicines = async (req, res) => {
    try {
        // Find all medicines that have been ordered at least once
        const popularMedicines = await Medicine.aggregate([
            {
                $lookup: {
                    from: "orderpharmacies",
                    let: { medicineId: "$_id" },
                    pipeline: [
                        { $unwind: "$items" },
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$items.medicineId", "$$medicineId"] },
                                        { $eq: ["$items.itemType", "medicine"] }
                                    ]
                                }
                            }
                        },
                        { 
                            $group: { 
                                _id: null, 
                                totalOrders: { $sum: "$items.quantity" },
                                uniqueOrders: { $sum: 1 } // Count of unique orders containing this medicine
                            } 
                        }
                    ],
                    as: "orders"
                }
            },
            {
                $addFields: {
                    orderCount: { $ifNull: [{ $arrayElemAt: ["$orders.totalOrders", 0] }, 0] },
                    uniqueOrderCount: { $ifNull: [{ $arrayElemAt: ["$orders.uniqueOrders", 0] }, 0] }
                }
            },
            { $match: { orderCount: { $gte: 1 } } }, // At least 1 order
            { $sort: { orderCount: -1 } }, // Sort by order count in descending order
            { $project: { orders: 0 } }
        ]);

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
            onStatus: "0"
        }).populate('vendorId', 'name latitude longitude');

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
                        vendorId: vendorEntry.vendorId?._id,
                        vendorPrice: finalPrice.toFixed(2),
                        discount: discount,
                        stock: vendorEntry.stock,
                        name: vendorEntry.vendorId?.name,
                        latitude: vendorEntry.vendorId?.latitude,
                        longitude: vendorEntry.vendorId?.longitude
                    };
                }
            });

            return {
                ...medicine,
                totalStock,
                vendorId: bestVendor?.vendorId,
                vendorPrice: bestVendor?.vendorPrice,
                discount: bestVendor?.discount,
                stockFromVendor: bestVendor?.stock,
                vendorName: bestVendor?.name,
                latitude: bestVendor?.latitude,
                longitude: bestVendor?.longitude,
                type: "general",
                // Add total order count to response
                totalOrderCount: medicine.orderCount || 0,
                uniqueOrderCount: medicine.uniqueOrderCount || 0
            };
        }).filter(med => med.vendorId); // Only include medicines with available stock

        return res.status(200).json({
            success: 1,
            message: "Popular medicines fetched successfully",
            total: result.length,
            data: result,
            summary: {
                totalMedicines: result.length,
                minOrders: Math.min(...result.map(m => m.totalOrderCount)),
                maxOrders: Math.max(...result.map(m => m.totalOrderCount)),
                avgOrders: (result.reduce((sum, m) => sum + m.totalOrderCount, 0) / result.length).toFixed(2)
            }
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

// Get popular products (ordered at least 1 time, sorted by order count in descending order)
// Method: GET
// Endpoint: /shops/popularProducts
const getPopularProducts = async (req, res) => {
    try {
        // Find all products that have been ordered at least once
        const popularProducts = await PharmacyProduct.aggregate([
            {
                $lookup: {
                    from: "orderpharmacies",
                    let: { productId: "$_id" },
                    pipeline: [
                        { $unwind: "$items" },
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$items.productId", "$$productId"] },
                                        { $eq: ["$items.itemType", "product"] }
                                    ]
                                }
                            }
                        },
                        { 
                            $group: { 
                                _id: null, 
                                totalOrders: { $sum: "$items.quantity" },
                                uniqueOrders: { $sum: 1 } // Count of unique orders containing this product
                            } 
                        }
                    ],
                    as: "orders"
                }
            },
            {
                $addFields: {
                    orderCount: { $ifNull: [{ $arrayElemAt: ["$orders.totalOrders", 0] }, 0] },
                    uniqueOrderCount: { $ifNull: [{ $arrayElemAt: ["$orders.uniqueOrders", 0] }, 0] }
                }
            },
            { $match: { orderCount: { $gte: 1 } } }, // At least 1 order
            { $sort: { orderCount: -1 } }, // Sort by order count in descending order
            { $project: { orders: 0 } }
        ]);

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
        }).populate('vendorId', 'name latitude longitude');

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
                        vendorId: vendorEntry.vendorId?._id,
                        vendorPrice: finalPrice.toFixed(2),
                        discount: discount,
                        stock: vendorEntry.stock,
                        name: vendorEntry.vendorId?.name,
                        latitude: vendorEntry.vendorId?.latitude,
                        longitude: vendorEntry.vendorId?.longitude
                    };
                }
            });

            return {
                ...product,
                totalStock,
                vendorId: bestVendor?.vendorId,
                vendorPrice: bestVendor?.vendorPrice,
                discount: bestVendor?.discount,
                stockFromVendor: bestVendor?.stock,
                vendorName: bestVendor?.name,
                latitude: bestVendor?.latitude,
                longitude: bestVendor?.longitude,
                // Add total order count to response
                totalOrderCount: product.orderCount || 0,
                uniqueOrderCount: product.uniqueOrderCount || 0
            };
        }));

        return res.status(200).json({
            success: 1,
            message: "Popular products fetched successfully",
            total: result.length,
            data: result,
            summary: {
                totalProducts: result.length,
                minOrders: Math.min(...result.map(p => p.totalOrderCount)),
                maxOrders: Math.max(...result.map(p => p.totalOrderCount)),
                avgOrders: (result.reduce((sum, p) => sum + p.totalOrderCount, 0) / result.length).toFixed(2)
            }
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


// Clear user's cart (remove all items)
// Method: DELETE
// Endpoint: /shops/clearCart
const clearCart = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: 0,
                message: "User ID is required",
            });
        }

        // Delete all cart items for this user
        const result = await CartPharmacy.deleteMany({ userId });

        if (result.deletedCount === 0) {
            return res.status(200).json({
                success: 1,
                message: "Cart was already empty",
            });
        }

        return res.status(200).json({
            success: 1,
            message: "Cart cleared successfully",
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error("Clear Cart Error:", error.message);
        return res.status(500).json({
            success: 0,
            message: "Internal Server Error",
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
    getPopularMedicines,
    clearCart,
    uploadPrescription 
};