const Vendor = require("../../../../modal/vandor");
const Food = require("../../../../modal/addFood");
const Coupon = require("../../../../modal/Coupon");
const Available = require("../../../../modal/availability");
const { ObjectId } = require("mongodb");

//Get all kitchen
//Method:Get
//Endpoint: /topKitchen/kitchen
const listKitchen = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).send({
        success: 0,
        message: "Latitude and Longitude are required",
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Use geoNear to find vendors of type "Food" within 5km
    const vendors = await Vendor.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [lng, lat],
          },
          distanceField: "distance",
          spherical: true,
          maxDistance: 5000, // 5km
          query: { vendor: "Food" },
        },
      },
      {
        $addFields: {
          distance: {
            $round: [{ $divide: ["$distance", 1000] }, 2], // optional in km
          },
        },
      },
    ]);

    if (!vendors || vendors.length === 0) {
      return res.send({
        success: 0,
        message: "No food vendors available",
      });
    }

    return res.send({
      success: 1,
      message: "Fetched successfully",
      vendors: vendors,
    });
  } catch (error) {
    return res.send({
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

    const query = { vendorId: id, status: "0" }; // <--- यहाँ status: "0" फ़िल्टर जोड़ा गया है

    if (foodCategory) {
      query.foodCategory = foodCategory;
    }

    const data = await Food.find(query)
      .populate('vendorId', 'name') // <--- यहाँ vendorId को पॉपुलेट किया गया है
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    if (!data || data.length === 0) { // डेटा न मिलने पर भी स्पष्ट संदेश दें
      return res.send({
        success: 0,
        message: "No items found for this vendor or category",
      });
    }

    // अब data को मैप करें ताकि vendorId को सीधे vendorName से बदल सकें
    const itemsWithVendorName = data.map(item => {
      const itemObject = item.toObject(); // Mongoose डॉक्यूमेंट को प्लेन JavaScript ऑब्जेक्ट में बदलें
      if (itemObject.vendorId && typeof itemObject.vendorId === 'object') {
        itemObject.vendorName = itemObject.vendorId.name; // वेंडर का नाम जोड़ें
        itemObject.vendorId = itemObject.vendorId._id; // vendorId को सिर्फ उसकी ID पर वापस सेट करें
      }
      return itemObject;
    });

    return res.send({
      success: 1,
      message: "Fetched successfully",
      details: itemsWithVendorName, // संशोधित आइटम्स भेजें
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
    const { q, vendorId, foodCategory } = req.query; // Include foodCategory from query
    let { page = 1, limit = 5 } = req.query;

    // Convert page and limit to numbers
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    let query = { vendorId }; // Base query includes vendorId

    // Add search term (q) to query if provided
    if (q) {
      const regex = new RegExp(q, "i"); // Case-insensitive search
      query = {
        ...query,
        $or: [
          { foodName: { $regex: regex } },
          { foodSubCategory: { $regex: regex } },
        ],
      };
    }

    // Add foodCategory to query if provided
    if (foodCategory) {
      query = {
        ...query,
        foodCategory,
      };
    }

    const skip = (pageNum - 1) * limitNum; // Calculate skip value for pagination

    // Query options for sorting, skipping, and limiting results
    const options = {
      sort: { createdAt: -1 }, // Sort by createdAt in descending order
      skip,
      limit: limitNum,
    };

    // Execute the search query
    const search = await Food.find(query, null, options);

    // Count the total number of documents matching the query
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
      totalCount, // Include total count for pagination
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
