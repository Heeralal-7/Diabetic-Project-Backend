const Vendor = require("../../../modal/vandor");
const Food = require("../../../modal/addFood"); // Food model import

// ✅ GET ALL VENDORS (With separate permissions for Lab, Pharmacy, Food)
const getVendors = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    
    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    const { 
      page = 1, 
      limit = 10, 
      search = "",
      vendorType = "",
      status = "",
      country = "",
      state = "",
      city = "",
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    // ✅ BUILD LOCATION QUERY FOR SUB-ADMIN
    let locationQuery = {};
    if (subAdmin.locationAccess) {
      const { locationAccess } = subAdmin;
      if (locationAccess.countries && locationAccess.countries.length > 0) {
        locationQuery.country = { $in: locationAccess.countries };
      }
      if (locationAccess.states && locationAccess.states.length > 0) {
        locationQuery.state = { $in: locationAccess.states };
      }
      if (locationAccess.cities && locationAccess.cities.length > 0) {
        locationQuery.city = { $in: locationAccess.cities };
      }
    }

    // ✅ BUILD VENDOR TYPE QUERY BASED ON SEPARATE PERMISSIONS
    const allowedTypes = [];
    if (subAdmin.permissions?.vendors?.lab?.view) allowedTypes.push('Lab');
    if (subAdmin.permissions?.vendors?.pharmacy?.view) allowedTypes.push('Pharmacy');
    if (subAdmin.permissions?.vendors?.food?.view) allowedTypes.push('Food');
    
    if (allowedTypes.length === 0) {
      return res.status(403).send({
        success: 0,
        message: "No vendor view permissions",
      });
    }

    let vendorTypeQuery = { vendor: { $in: allowedTypes } };

    // ✅ If specific vendor type requested
    if (vendorType) {
      const requestedType = vendorType.charAt(0).toUpperCase() + vendorType.slice(1);
      if (!allowedTypes.includes(requestedType)) {
        return res.status(403).send({
          success: 0,
          message: `No permission to view ${vendorType} vendors`,
        });
      }
      vendorTypeQuery.vendor = requestedType;
    }

    // ✅ BUILD SEARCH QUERY
    let searchQuery = { ...locationQuery, ...vendorTypeQuery };
    
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { business: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { labName: { $regex: search, $options: "i" } }
      ];
    }

    // ✅ STATUS FILTER
    if (status === "active") {
      searchQuery.isActive = true;
    } else if (status === "inactive") {
      searchQuery.isActive = false;
    }

    // ✅ LOCATION FILTERS
    if (country) searchQuery.country = country;
    if (state) searchQuery.state = state;
    if (city) searchQuery.city = city;

    // ✅ SORTING
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    // ✅ PAGINATION
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // ✅ GET VENDORS WITH PAGINATION
    const vendors = await Vendor.find(searchQuery)
      .select('name business email phone vendor isActive country state city address labName createdAt')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // ✅ GET TOTAL COUNTS FOR EACH VENDOR TYPE SEPARATELY
    const totalVendors = await Vendor.countDocuments(searchQuery);
    const activeVendors = await Vendor.countDocuments({ ...searchQuery, isActive: true });
    const inactiveVendors = await Vendor.countDocuments({ ...searchQuery, isActive: false });

    // ✅ VENDOR TYPE WISE COUNTS WITH PERMISSION CHECKS
    const labVendors = subAdmin.permissions.vendors.lab?.view ? 
      await Vendor.countDocuments({ ...locationQuery, vendor: "Lab" }) : 0;
    
    const pharmacyVendors = subAdmin.permissions.vendors.pharmacy?.view ? 
      await Vendor.countDocuments({ ...locationQuery, vendor: "Pharmacy" }) : 0;
    
    const foodVendors = subAdmin.permissions.vendors.food?.view ? 
      await Vendor.countDocuments({ ...locationQuery, vendor: "Food" }) : 0;

    return res.send({
      success: 1,
      message: "Vendors fetched successfully",
      data: {
        vendors,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalVendors / limitNum),
          totalVendors,
          hasNext: pageNum < Math.ceil(totalVendors / limitNum),
          hasPrev: pageNum > 1
        },
        stats: {
          total: totalVendors,
          active: activeVendors,
          inactive: inactiveVendors,
          byType: {
            lab: labVendors,
            pharmacy: pharmacyVendors,
            food: foodVendors
          }
        },
        permissions: {
          lab: {
            view: subAdmin.permissions.vendors.lab?.view || false,
            create: subAdmin.permissions.vendors.lab?.create || false,
            edit: subAdmin.permissions.vendors.lab?.edit || false,
            delete: subAdmin.permissions.vendors.lab?.delete || false
          },
          pharmacy: {
            view: subAdmin.permissions.vendors.pharmacy?.view || false,
            create: subAdmin.permissions.vendors.pharmacy?.create || false,
            edit: subAdmin.permissions.vendors.pharmacy?.edit || false,
            delete: subAdmin.permissions.vendors.pharmacy?.delete || false
          },
          food: {
            view: subAdmin.permissions.vendors.food?.view || false,
            create: subAdmin.permissions.vendors.food?.create || false,
            edit: subAdmin.permissions.vendors.food?.edit || false,
            delete: subAdmin.permissions.vendors.food?.delete || false
          }
        }
      }
    });

  } catch (error) {
    console.error('Get vendors error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ GET SINGLE VENDOR DETAILS WITH TYPE-SPECIFIC PERMISSION CHECK
const getVendorById = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    const { id } = req.params;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    const vendor = await Vendor.findById(id)
      .select('-password -token -phnOtp -emailOtp');

    if (!vendor) {
      return res.status(404).send({
        success: 0,
        message: "Vendor not found",
      });
    }

    // ✅ CHECK SPECIFIC VENDOR TYPE PERMISSION
    const vendorType = vendor.vendor.toLowerCase();
    if (!subAdmin.permissions?.vendors?.[vendorType]?.view) {
      return res.status(403).send({
        success: 0,
        message: `No permission to view ${vendorType} vendors`,
      });
    }

    // ✅ CHECK LOCATION ACCESS
    if (subAdmin.locationAccess) {
      const { locationAccess } = subAdmin;
      if (locationAccess.countries && locationAccess.countries.length > 0 && 
          !locationAccess.countries.includes(vendor.country)) {
        return res.status(403).send({
          success: 0,
          message: "No permission to access this vendor",
        });
      }
    }

    // ✅ IF FOOD VENDOR, GET FOOD ITEMS COUNT
    let foodItemsCount = 0;
    if (vendor.vendor === "Food") {
      foodItemsCount = await Food.countDocuments({ vendorId: vendor._id });
    }

    const vendorData = vendor.toObject();
    vendorData.foodItemsCount = foodItemsCount;

    return res.send({
      success: 1,
      message: "Vendor details fetched successfully",
      data: vendorData
    });

  } catch (error) {
    console.error('Get vendor by ID error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ UPDATE VENDOR STATUS WITH TYPE-SPECIFIC PERMISSION
const updateVendorStatus = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    const { id } = req.params;
    const { isActive } = req.body;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).send({
        success: 0,
        message: "Vendor not found",
      });
    }

    // ✅ CHECK SPECIFIC VENDOR TYPE PERMISSION FOR EDIT
    const vendorType = vendor.vendor.toLowerCase();
    if (!subAdmin.permissions?.vendors?.[vendorType]?.edit) {
      return res.status(403).send({
        success: 0,
        message: `No permission to edit ${vendorType} vendors`,
      });
    }

    // ✅ CHECK LOCATION ACCESS
    if (subAdmin.locationAccess) {
      const { locationAccess } = subAdmin;
      if (locationAccess.countries && locationAccess.countries.length > 0 && 
          !locationAccess.countries.includes(vendor.country)) {
        return res.status(403).send({
          success: 0,
          message: "No permission to update this vendor",
        });
      }
    }

    vendor.isActive = isActive;
    await vendor.save();

    return res.send({
      success: 1,
      message: `Vendor ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: vendor._id,
        name: vendor.name,
        business: vendor.business,
        vendor: vendor.vendor,
        isActive: vendor.isActive
      }
    });

  } catch (error) {
    console.error('Update vendor status error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ DELETE VENDOR WITH TYPE-SPECIFIC PERMISSION
const deleteVendor = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    const { id } = req.params;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).send({
        success: 0,
        message: "Vendor not found",
      });
    }

    // ✅ CHECK SPECIFIC VENDOR TYPE PERMISSION FOR DELETE
    const vendorType = vendor.vendor.toLowerCase();
    if (!subAdmin.permissions?.vendors?.[vendorType]?.delete) {
      return res.status(403).send({
        success: 0,
        message: `No permission to delete ${vendorType} vendors`,
      });
    }

    // ✅ CHECK LOCATION ACCESS
    if (subAdmin.locationAccess) {
      const { locationAccess } = subAdmin;
      if (locationAccess.countries && locationAccess.countries.length > 0 && 
          !locationAccess.countries.includes(vendor.country)) {
        return res.status(403).send({
          success: 0,
          message: "No permission to delete this vendor",
        });
      }
    }

    await Vendor.findByIdAndDelete(id);

    return res.send({
      success: 1,
      message: "Vendor deleted successfully",
      data: {
        id: vendor._id,
        name: vendor.name,
        business: vendor.business,
        vendor: vendor.vendor
      }
    });

  } catch (error) {
    console.error('Delete vendor error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ CREATE NEW VENDOR WITH TYPE-SPECIFIC PERMISSION
const createVendor = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    const { vendorType } = req.body; // lab, pharmacy, food

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ✅ CHECK SPECIFIC VENDOR TYPE PERMISSION FOR CREATE
    if (!subAdmin.permissions?.vendors?.[vendorType]?.create) {
      return res.status(403).send({
        success: 0,
        message: `No permission to create ${vendorType} vendors`,
      });
    }

    // ✅ CHECK LOCATION ACCESS IF SPECIFIC LOCATION PROVIDED
    if (req.body.country && subAdmin.locationAccess?.countries?.length > 0) {
      if (!subAdmin.locationAccess.countries.includes(req.body.country)) {
        return res.status(403).send({
          success: 0,
          message: "No permission to create vendor in this country",
        });
      }
    }

    // ✅ PREPARE VENDOR DATA
    const vendorData = {
      ...req.body,
      vendor: vendorType.charAt(0).toUpperCase() + vendorType.slice(1), // Capitalize first letter
      createdBy: subAdmin._id
    };

    const newVendor = new Vendor(vendorData);
    await newVendor.save();

    return res.send({
      success: 1,
      message: `${vendorType.charAt(0).toUpperCase() + vendorType.slice(1)} vendor created successfully`,
      data: newVendor
    });

  } catch (error) {
    console.error('Create vendor error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ GET VENDORS BY SPECIFIC TYPE
const getVendorsByType = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    const { vendorType } = req.params; // lab, pharmacy, food

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ✅ CHECK SPECIFIC VENDOR TYPE PERMISSION
    if (!subAdmin.permissions?.vendors?.[vendorType]?.view) {
      return res.status(403).send({
        success: 0,
        message: `No permission to view ${vendorType} vendors`,
      });
    }

    const { 
      page = 1, 
      limit = 10, 
      search = "",
      status = "" 
    } = req.query;

    // ✅ BUILD LOCATION QUERY
    let locationQuery = {};
    if (subAdmin.locationAccess) {
      const { locationAccess } = subAdmin;
      if (locationAccess.countries && locationAccess.countries.length > 0) {
        locationQuery.country = { $in: locationAccess.countries };
      }
      if (locationAccess.states && locationAccess.states.length > 0) {
        locationQuery.state = { $in: locationAccess.states };
      }
      if (locationAccess.cities && locationAccess.cities.length > 0) {
        locationQuery.city = { $in: locationAccess.cities };
      }
    }

    // ✅ BUILD SEARCH QUERY
    const searchQuery = { 
      ...locationQuery, 
      vendor: vendorType.charAt(0).toUpperCase() + vendorType.slice(1) 
    };

    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { business: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { labName: { $regex: search, $options: "i" } }
      ];
    }

    if (status === "active") {
      searchQuery.isActive = true;
    } else if (status === "inactive") {
      searchQuery.isActive = false;
    }

    // ✅ PAGINATION
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const vendors = await Vendor.find(searchQuery)
      .select('name business email phone vendor isActive country state city address labName createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const totalVendors = await Vendor.countDocuments(searchQuery);

    return res.send({
      success: 1,
      message: `${vendorType} vendors fetched successfully`,
      data: {
        vendors,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalVendors / limitNum),
          totalVendors,
          hasNext: pageNum < Math.ceil(totalVendors / limitNum),
          hasPrev: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Get vendors by type error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = {
  getVendors,
  getVendorById,
  updateVendorStatus,
  deleteVendor,
  createVendor,
  getVendorsByType
};