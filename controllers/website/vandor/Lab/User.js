const Vendor = require("../../../../modal/vandor");
const Addtest = require("../../../../modal/addTest");
const { calculateOnRoadDistance } = require("../../../utils/googleMapsDistance");

// Get all vendor
// Method:GET
// EndPoint:/website
// Get all lab vendors with distance calculation
// Method: GET
// Endpoint: /website
const getVendors = async (req, res) => {
  try {
    const { latitude: userLat, longitude: userLng } = req.query;
    
    const hasUserLocation = !isNaN(parseFloat(userLat)) && !isNaN(parseFloat(userLng));

    const vendors = await Vendor.find({
      vendor: { $regex: "^lab$", $options: "i" }
    }).populate('vendor');

    if (!vendors || vendors.length === 0) {
      return res.send({
        success: 0,
        message: "No Lab Vendor Found",
        details: [],
      });
    }

    // If user location provided, calculate distances
    if (hasUserLocation) {
      const userLatNum = parseFloat(userLat);
      const userLngNum = parseFloat(userLng);
      
      const vendorsWithDistances = await Promise.all(
        vendors.map(async (vendor) => {
          try {
            // Check if vendor has valid coordinates
            if (!vendor.latitude || !vendor.longitude) {
              return {
                ...vendor.toObject(),
                distance: {
                  value: null,
                  text: "Location unavailable",
                  calculationMethod: null,
                  status: 'NO_LOCATION'
                }
              };
            }
            
            const vendorLat = parseFloat(vendor.latitude);
            const vendorLng = parseFloat(vendor.longitude);
            
            // Use Google Maps API for ON-ROAD distance
            const distanceData = await calculateOnRoadDistance(
              userLatNum,
              userLngNum,
              vendorLat,
              vendorLng
            );
            
            return {
              ...vendor.toObject(),
              distance: {
                value: distanceData.distance,
                text: distanceData.distanceText,
                duration: distanceData.duration,
                durationText: distanceData.durationText,
                calculationMethod: distanceData.status === 'OK' ? 'ON_ROAD' : 'STRAIGHT_LINE',
                status: distanceData.status
              }
            };
            
          } catch (error) {
            console.error(`Error calculating distance for lab ${vendor._id}:`, error);
            return {
              ...vendor.toObject(),
              distance: {
                value: null,
                text: "Distance calculation failed",
                calculationMethod: null,
                status: 'ERROR'
              }
            };
          }
        })
      );

      // Sort by distance
      vendorsWithDistances.sort((a, b) => {
        const aDist = a.distance?.value || 999999;
        const bDist = b.distance?.value || 999999;
        return aDist - bDist;
      });

      return res.send({
        success: 1,
        message: "Lab vendors fetched successfully with ON-ROAD distances",
        details: vendorsWithDistances,
        userLocation: hasUserLocation ? {
          latitude: userLatNum,
          longitude: userLngNum
        } : null
      });
    }

    // If no location, return without distance
    return res.send({
      success: 1,
      message: "Lab vendors fetched successfully",
      details: vendors.map(v => ({
        ...v.toObject(),
        distance: null
      })),
      note: "Provide latitude and longitude to get ON-ROAD distances"
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};


// Get Vendor Tests
// Method:GET
// EndPoint:/website/:id
const getTest = async (req, res) => {
  try {
    const vendorId = req.params.id;
    const vendor = await Addtest.find({ vendorId: vendorId });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    return res.send({
      message: "Fetched successfully",
      success: 1,
      details: vendor,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



module.exports = { getVendors, getTest };
