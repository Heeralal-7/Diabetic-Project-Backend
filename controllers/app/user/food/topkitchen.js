const Vendor = require("../../../../modal/vandor");
const Food = require("../../../../modal/addFood");
const Coupon = require("../../../../modal/Coupon");
const Available = require("../../../../modal/availability");
const maxLimit = require("../../../../modal/distanceLimit");
const { ObjectId } = require("mongodb");
// Google Maps import हटा दिया गया है
// const { calculateOnRoadDistance } = require("../../../utils/googleMapsDistance");

// Distance calculation function
const calculateStraightLineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// POST Endpoint: /topKitchen/kitchen
const listKitchen = async (req, res) => {
  try {
    // Get parameters from both POST body and GET query
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
    const maxDistance = distanceLimit ? distanceLimit.foodLimit : 20; // Default 20km (foodLimit)

    // Build match conditions
    const matchConditions = {
      vendor: "Food"
    };
    
    // Add search condition if provided
    if (search) {
      matchConditions.$or = [
        { vendorName: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    // Create query
    let query = Vendor.find(matchConditions);

    // Apply pagination
    query = query.skip(skip).limit(limit);

    // Execute query
    const vendors = await query;

    if (!vendors || vendors.length === 0) {
      return res.send({
        success: 0,
        message: "No food vendors available",
      });
    }

    // If user location is provided, calculate distances and filter
    if (hasUserLocation) {
      const vendorsWithDistances = [];
      
      for (const vendor of vendors) {
        try {
          // Check if vendor has valid coordinates
          if (vendor.latitude && vendor.longitude && 
              vendor.latitude.trim() !== '' && vendor.longitude.trim() !== '') {
            
            const vendorLat = parseFloat(vendor.latitude);
            const vendorLng = parseFloat(vendor.longitude);
            
            // Validate coordinates
            if (!isNaN(vendorLat) && !isNaN(vendorLng)) {
              // DIRECT CALCULATION: Straight Line
              const distanceValue = calculateStraightLineDistance(
                userLat,
                userLng,
                vendorLat,
                vendorLng
              );
              
              // Check if within distance limit
              if (distanceValue <= maxDistance) {
                vendorsWithDistances.push({
                  ...vendor.toObject(),
                  distance: distanceValue
                });
              }
            }
          }
        } catch (error) {
          console.error(`Error processing vendor ${vendor.name}:`, error);
          // Skip this vendor if there's an error
        }
      }

      // Sort by distance (nearest first)
      vendorsWithDistances.sort((a, b) => {
        if (!a.distance) return 1;
        if (!b.distance) return -1;
        return a.distance - b.distance;
      });

      // Get counts for stats
      const vendorsWithValidDistance = vendorsWithDistances.length;
      const vendorsWithoutLocation = vendors.length - vendorsWithDistances.length;

      return res.send({
        success: 1,
        message: "Kitchens fetched successfully with distances",
        details: vendorsWithDistances,
        distanceLimit: maxDistance,
        userLocation: {
          latitude: userLat,
          longitude: userLng
        },
        stats: {
          totalVendors: vendors.length,
          vendorsWithinLimit: vendorsWithValidDistance,
          vendorsWithoutLocation: vendorsWithoutLocation,
          calculationMethod: 'STRAIGHT_LINE'
        },
        pagination: {
          page: page,
          limit: limit,
          hasMore: vendors.length === limit
        }
      });
    }

    // If no location provided, return all vendors
    const allVendors = vendors.map(v => v.toObject());

    return res.send({
      success: 1,
      message: "Kitchens fetched successfully",
      details: allVendors,
      note: "Provide latitude and longitude to filter by distance",
      pagination: {
        page: page,
        limit: limit,
        hasMore: vendors.length === limit
      }
    });
    
  } catch (error) {
    console.error('Error in listKitchen API:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

//Get kitchen by category
//Method: Get
//Endpoint: /topKitchen/catekitchen?foodName
const categoryKitchen = async (req, res) => {
  try {
    const { foodName } = req.query;
    const { page = 1, limit = 5 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 5);

    const data = await Food.find({ foodName })
      .populate("vendorId")
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    if (data) {
      return res.send({
        success: 1,
        message: "Fetched successfully",
        details: data,
      });
    }
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Get kitchen all foood
//Method:Get
//Endpoint: /topKitchen/particular/id
const particularfood = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 5, foodCategory } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 5);

    const query = { vendorId: id, status: "0" };

    if (foodCategory) {
      query.foodCategory = foodCategory;
    }

    const data = await Food.find(query)
      .populate('vendorId', 'name')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    if (!data || data.length === 0) {
      return res.send({
        success: 0,
        message: "No items found for this vendor or category",
      });
    }

    const itemsWithVendorName = data.map(item => {
      const itemObject = item.toObject();
      if (itemObject.vendorId && typeof itemObject.vendorId === 'object') {
        itemObject.vendorName = itemObject.vendorId.name;
        itemObject.vendorId = itemObject.vendorId._id;
      }
      return itemObject;
    });

    return res.send({
      success: 1,
      message: "Fetched successfully",
      details: itemsWithVendorName,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Search particular food
//Method: Get
//Endpoint: topKitchen/search
const searchfood = async (req, res) => {
  try {
    const { q, vendorId, foodCategory } = req.query;
    let { page = 1, limit = 5 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    let query = { vendorId };

    if (q) {
      const regex = new RegExp(q, "i");
      query = {
        ...query,
        $or: [
          { foodName: { $regex: regex } },
          { foodSubCategory: { $regex: regex } },
        ],
      };
    }

    if (foodCategory) {
      query = {
        ...query,
        foodCategory,
      };
    }

    const skip = (pageNum - 1) * limitNum;

    const options = {
      sort: { createdAt: -1 },
      skip,
      limit: limitNum,
    };

    const search = await Food.find(query, null, options);
    const totalCount = await Food.countDocuments(query);

    if (!search || search.length === 0) {
      return res.send({
        success: 1,
        message: "No results found",
        details: search,
      });
    }

    return res.send({
      success: 1,
      message: "Results fetched successfully",
      totalCount,
      details: search,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Menu of resturant
//Method:Get
//Endpoint: topKitchen/menu/:id
const foodMenu = async (req, res) => {
  try {
    const { id } = req.params;

    const vendorId = new ObjectId(id);

    const data = await Food.aggregate([
      { $match: { vendorId: vendorId } },
      {
        $group: {
          _id: "$foodName",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    if (data.length === 0) {
      return res.send({
        success: 0,
        message: "No food items found for this vendor.",
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

module.exports = {
  listKitchen,
  categoryKitchen,
  particularfood,
  searchfood,
  foodMenu,
};