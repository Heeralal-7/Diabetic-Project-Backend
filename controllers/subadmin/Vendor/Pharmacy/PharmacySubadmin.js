const Vendor = require("../../../../modal/vandor");
const PharmacyProduct = require("../../../../modal/PharmacyProducts");
const Medicine = require("../../../../modal/MedicineSchema");
const PharmacyMedicine = require("../../../../modal/VendorMedicine");
const DeliveryCharges = require("../../../../modal/DeliveryCharges");
const fs = require("fs");
const ExcelJS = require('exceljs');
const mongoose = require("mongoose");

// ✅ GET ALL PHARMACY VENDORS
const getPharmacyVendors = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    
    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ✅ CHECK PHARMACY VENDOR VIEW PERMISSION
    if (!subAdmin.permissions?.vendors?.pharmacy?.view) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view pharmacy vendors",
      });
    }

    const { 
      page = 1, 
      limit = 10, 
      search = "",
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

    // ✅ BUILD SEARCH QUERY FOR PHARMACY VENDORS
    let searchQuery = { 
      ...locationQuery, 
      vendor: "Pharmacy" 
    };
    
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { business: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
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

    // ✅ GET PHARMACY VENDORS WITH PAGINATION
    const pharmacyVendors = await Vendor.find(searchQuery)
      .select('name business email phone vendor isActive country state city address createdAt location')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // ✅ GET TOTAL COUNTS FOR PHARMACY VENDORS
    const totalPharmacies = await Vendor.countDocuments(searchQuery);
    const activePharmacies = await Vendor.countDocuments({ ...searchQuery, isActive: true });
    const inactivePharmacies = await Vendor.countDocuments({ ...searchQuery, isActive: false });

    return res.send({
      success: 1,
      message: "Pharmacy vendors fetched successfully",
      data: {
        vendors: pharmacyVendors,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalPharmacies / limitNum),
          totalPharmacies,
          hasNext: pageNum < Math.ceil(totalPharmacies / limitNum),
          hasPrev: pageNum > 1
        },
        stats: {
          total: totalPharmacies,
          active: activePharmacies,
          inactive: inactivePharmacies
        },
        permissions: {
          view: subAdmin.permissions.vendors.pharmacy?.view || false,
          create: subAdmin.permissions.vendors.pharmacy?.create || false,
          edit: subAdmin.permissions.vendors.pharmacy?.edit || false,
          delete: subAdmin.permissions.vendors.pharmacy?.delete || false
        }
      }
    });

  } catch (error) {
    console.error('Get pharmacy vendors error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ GET SINGLE PHARMACY VENDOR DETAILS
const getPharmacyVendorById = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    const { id } = req.params;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ✅ CHECK PHARMACY VENDOR VIEW PERMISSION
    if (!subAdmin.permissions?.vendors?.pharmacy?.view) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view pharmacy vendors",
      });
    }

    const pharmacyVendor = await Vendor.findById(id)
      .select('-password -token -phnOtp -emailOtp -confirmpass');

    if (!pharmacyVendor) {
      return res.status(404).send({
        success: 0,
        message: "Pharmacy vendor not found",
      });
    }

    // ✅ CHECK IF IT'S ACTUALLY A PHARMACY VENDOR
    if (pharmacyVendor.vendor !== "Pharmacy") {
      return res.status(404).send({
        success: 0,
        message: "This vendor is not a pharmacy",
      });
    }

    // ✅ CHECK LOCATION ACCESS
    if (subAdmin.locationAccess) {
      const { locationAccess } = subAdmin;
      if (locationAccess.countries && locationAccess.countries.length > 0 && 
          !locationAccess.countries.includes(pharmacyVendor.country)) {
        return res.status(403).send({
          success: 0,
          message: "No permission to access this pharmacy vendor",
        });
      }
    }

    return res.send({
      success: 1,
      message: "Pharmacy vendor details fetched successfully",
      data: pharmacyVendor
    });

  } catch (error) {
    console.error('Get pharmacy vendor by ID error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ GET PHARMACY VENDORS STATISTICS
const getPharmacyVendorsStats = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ✅ CHECK PHARMACY VENDOR VIEW PERMISSION
    if (!subAdmin.permissions?.vendors?.pharmacy?.view) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view pharmacy vendors",
      });
    }

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

    const pharmacyQuery = { ...locationQuery, vendor: "Pharmacy" };

    // ✅ GET STATISTICS
    const totalPharmacies = await Vendor.countDocuments(pharmacyQuery);
    const activePharmacies = await Vendor.countDocuments({ ...pharmacyQuery, isActive: true });
    const inactivePharmacies = await Vendor.countDocuments({ ...pharmacyQuery, isActive: false });

    // ✅ RECENT PHARMACIES (LAST 7 DAYS)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentPharmacies = await Vendor.countDocuments({ 
      ...pharmacyQuery, 
      createdAt: { $gte: sevenDaysAgo } 
    });

    return res.send({
      success: 1,
      message: "Pharmacy vendors statistics fetched successfully",
      data: {
        stats: {
          total: totalPharmacies,
          active: activePharmacies,
          inactive: inactivePharmacies,
          recent: recentPharmacies
        },
        permissions: {
          view: subAdmin.permissions.vendors.pharmacy?.view || false,
          create: subAdmin.permissions.vendors.pharmacy?.create || false,
          edit: subAdmin.permissions.vendors.pharmacy?.edit || false,
          delete: subAdmin.permissions.vendors.pharmacy?.delete || false
        }
      }
    });

  } catch (error) {
    console.error('Get pharmacy vendors stats error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ GET ALL PHARMACY VENDORS (LEGACY SUPPORT)
const getAllVendorsLists = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    
    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ✅ CHECK PHARMACY VENDOR VIEW PERMISSION
    if (!subAdmin.permissions?.vendors?.pharmacy?.view) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view pharmacy vendors",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { country, state, city, search } = req.query;

    const skip = (page - 1) * limit;

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
    
    // ✅ OVERRIDE WITH QUERY PARAMETERS
    if (country) locationQuery.country = country;
    if (state) locationQuery.state = state;
    if (city) locationQuery.city = city;

    // ✅ BUILD SEARCH QUERY
    let searchQuery = {};
    if (search) {
      const regex = new RegExp(search, "i");
      searchQuery = {
        $or: [
          { name: { $regex: regex } },
          { email: { $regex: regex } },
          { business: { $regex: regex } }
        ]
      };
    }

    const getAll = await Vendor.aggregate([
      {
        $match: { 
          vendor: "Pharmacy",
          isActive: true,
          ...locationQuery,
          ...searchQuery
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);

    const totalLength = await Vendor.countDocuments({
      vendor: "Pharmacy",
      isActive: true,
      ...locationQuery,
      ...searchQuery
    });
    
    const pages = Math.ceil(totalLength / limit);
    
    return res.send({
      success: 1,
      message: "All vendor fetched successfully",
      pages,
      details: getAll,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ GET PHARMACY STATS MONTHLY
const getpharmacystats = async(req,res)=>{
  try {
    const subAdmin = req.subAdmin;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ✅ CHECK PHARMACY VENDOR VIEW PERMISSION
    if (!subAdmin.permissions?.vendors?.pharmacy?.view) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view pharmacy vendors",
      });
    }

    const currentDate = new Date();
    
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

    const months = Array.from({length: 12},(_,i)=>{
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() -i,1);
      return {
        year: date.getFullYear(),
        month: date.getMonth() +1,
      };
    }).reverse();
     
    const pharmacystats = await Vendor.aggregate([
      {
        $match: {
          vendor: "Pharmacy",
          ...locationQuery
        },
      },
      {
        $addFields:{
          year:{$year:"$createdAt"},
          month:{$month:"$createdAt"},
        },
      },
      {
        $group:{
          _id:{year :"$year", month:"$month"},
          count:{$sum:1},
          vendors:{$push:"$$ROOT"},
        },
      },
      {
        $sort:{"_id.year":1, "_id.month":1},
      },
    ]);
   
    const stats = months.map(({year,month})=>{
      const stat = pharmacystats.find(
        (item)=> item._id.year === year && item._id.month === month
      );
      return{
        year,
        month,
        count :stat ? stat.count :0,
        vendors : stat ? stat.vendors: [],
      };
    });

    return res.send({
      success:1,
      message:"monthly data",
      details:stats,
    });
           
  } catch (error) {
    return res.send({
      success:0,
      message:error.message
    })
  }
}

// ✅ GET INACTIVE PHARMACY VENDORS
const inActivePharmacy = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ✅ CHECK PHARMACY VENDOR VIEW PERMISSION
    if (!subAdmin.permissions?.vendors?.pharmacy?.view) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view pharmacy vendors",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { country, state, city } = req.query;
    const skip = (page - 1) * limit;

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
    
    // ✅ OVERRIDE WITH QUERY PARAMETERS
    if (country) locationQuery.country = country;
    if (state) locationQuery.state = state;
    if (city) locationQuery.city = city;
    
    const getAll = await Vendor.aggregate([
      { 
        $match: { 
          vendor: "Pharmacy", 
          isActive: false,
          ...locationQuery
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const totalLength = await Vendor.countDocuments({
      vendor: "Pharmacy",
      isActive: false,
      ...locationQuery
    });

    const pages = Math.ceil(totalLength / limit);

    return res.send({
      success: 1,
      message: "All inactive Pharmacy fetched successfully",
      pages,
      details: getAll,
    });
  } catch (error) {
    console.error("Error in inActivePharmacy:", error.message);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ✅ UPLOAD PRODUCT EXCEL
const uploadProductExcel = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ✅ PERMISSION CHECK UPDATED
    if (!subAdmin.permissions?.vendors?.pharmacy?.create) {
      return res.status(403).send({
        success: 0,
        message: "No permission to upload pharmacy products",
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: 0, message: 'No file uploaded' });
    }
 
    const stream = fs.createReadStream(req.file.path);
    const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(stream);
 
    const batchSize = 1000;
    let batch = [];
    let headers = [];
 
    for await (const worksheetReader of workbookReader) {
      for await (const row of worksheetReader) {
        const cells = row.values.slice(1); // remove first null value
 
        if (row.number === 1) {
          headers = cells.map(h => String(h).trim());
        } else {
          const obj = {};
          headers.forEach((h, i) => {
             if (h === 'image_url' && cells[i]) {
              obj[h] = String(cells[i]).split(',').map(url => url.trim());
            } else {
              obj[h] = cells[i] != null ? cells[i] : "";
            }
          });
          batch.push(obj);
        }
 
        if (batch.length >= batchSize) {
          await PharmacyProduct.insertMany(batch);
          batch = [];
        }
      }
    }
 
    if (batch.length > 0) {
      await PharmacyProduct.insertMany(batch);
    }
 
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('File delete error:', err);
    });
 
    res.status(200).json({ success: 1, message: 'Excel uploaded and product data saved successfully' });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: 0, message: 'Something went wrong', error: err.message });
  }
};
 
// ✅ GET ALL PRODUCT DATA
const getAllProductData = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ✅ PERMISSION CHECK UPDATED
    if (!subAdmin.permissions?.vendors?.pharmacy?.view) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view pharmacy products",
      });
    }

    const products = await PharmacyProduct.find({});
    const totalCount = products.length;
 
    res.send({
      success: 1,
      message: "All product data",
      totalCount,
      details: products
    });
  } catch (err) {
    res.status(500).send({ success: 0, message: err.message });
  }
};

// ✅ GET ALL PRODUCT DATA FOR SUB-ADMIN
// Method: Get
// Endpoint: /subadmin/pharmacy/products/allSub
const getAllProductDataSubadmin = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
 
    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }
 
    // ✅ PERMISSION CHECK UPDATED
    if (!subAdmin.permissions?.vendors?.pharmacy?.view) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view pharmacy products",
      });
    }
 
    const products = await PharmacyProduct.find({
      onStatus: { $nin: [0, "", null] }
    })
    .sort({ createdAt: -1 }); // Newest first
    const totalCount = products.length;
 
    res.send({
      success: 1,
      message: "All product data",
      totalCount,
      details: products
    });
  } catch (err) {
    res.status(500).send({ success: 0, message: err.message });
  }
};
 
// ✅ UPDATE PRODUCT STATUS (SUB-ADMIN)
// Method: PUT
// Endpoint: /subadmin/pharmacy/update-product-status
const updateProductStatusBySubAdmin = async (req, res) => {
  try {
    // 1. Sub-Admin Auth Check (Get API se seekha hua pattern)
    const subAdmin = req.subAdmin;
 
    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }
 
    // 2. Permission Check
    // Note: Yahan maine '.view' ki jagah '.edit' check kiya hai kyunki ye write operation hai.
    // Aap apne DB schema ke hisaab se isse '.approve' ya '.edit' rakh sakte hain.
    if (!subAdmin.permissions?.vendors?.pharmacy?.edit) {
      return res.status(403).send({
        success: 0,
        message: "No permission to edit/approve pharmacy products",
      });
    }
 
    // 3. Request Body se data lena (Admin API wala logic)
    const { productId, onStatus } = req.body;
 
    // 4. Validation: Check karein data aaya ya nahi
    if (!productId) {
      return res.status(400).send({
          success: 0,
          message: "Product ID (productId) is required."
      });
    }
 
    // Check onStatus validation (0 = Approve, 1 = Reject)
    if (onStatus == undefined || (onStatus != 0 && onStatus != 1)) {
        return res.status(400).send({
            success: 0,
            message: "Invalid status. Send 0 for Approve, 1 for Reject."
        });
    }
 
    // 5. Status Action define karna
    const action = onStatus == 0 ? "Approved" : "Rejected";
 
    // 6. Database Update
    const updatedProduct = await PharmacyProduct.findByIdAndUpdate(
      productId,
      {
          onStatus: onStatus
      },
      { new: true } // Return updated document
    );
 
    // 7. Agar product nahi mila
    if (!updatedProduct) {
      return res.status(404).send({
          success: 0,
          message: "Product not found."
      });
    }
 
    // 8. Success Response
    res.send({
      success: 1,
      message: `Product successfully ${action} by Sub-Admin`,
      data: updatedProduct
    });
 
  } catch (err) {
    console.error("Sub-Admin Update Status Error:", err);
    res.status(500).send({ success: 0, message: err.message });
  }
};
 

// ✅ DELETE SINGLE PRODUCT
const deleteProduct = async (req, res) => {
    try {
        const subAdmin = req.subAdmin;
        const { id } = req.params;

        if (!subAdmin) {
            return res.status(401).send({
                success: 0,
                message: "Sub-admin not authenticated",
            });
        }

        // ✅ PERMISSION CHECK UPDATED
        if (!subAdmin.permissions?.vendors?.pharmacy?.delete) {
            return res.status(403).send({
                success: 0,
                message: "No permission to delete pharmacy products",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send({ success: 0, message: "Invalid product ID format." });
        }

        const deletedProduct = await PharmacyProduct.findByIdAndDelete(id);

        if (!deletedProduct) {
            return res.status(404).send({ success: 0, message: "Product not found." });
        }

        return res.send({ success: 1, message: "Product deleted successfully." });

    } catch (error) {
        return res.status(500).send({ success: 0, message: error.message });
    }
};

// ✅ DELETE MULTIPLE PRODUCTS
const deleteMultipleProducts = async (req, res) => {
    try {
        const subAdmin = req.subAdmin;
        const { ids } = req.body;

        if (!subAdmin) {
            return res.status(401).send({
                success: 0,
                message: "Sub-admin not authenticated",
            });
        }

        // ✅ PERMISSION CHECK UPDATED
        if (!subAdmin.permissions?.vendors?.pharmacy?.delete) {
            return res.status(403).send({
                success: 0,
                message: "No permission to delete pharmacy products",
            });
        }

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).send({ success: 0, message: "Please provide an array of product IDs to delete." });
        }

        const result = await PharmacyProduct.deleteMany({
            _id: { $in: ids },
        });

        if (result.deletedCount === 0) {
            return res.status(404).send({ success: 0, message: "No products found with the provided IDs." });
        }

        return res.send({ success: 1, message: `${result.deletedCount} products deleted successfully.` });

    } catch (error) {
        return res.status(500).send({ success: 0, message: error.message });
    }
};
const updateProduct = async (req, res) => {
    try {
        const subAdmin = req.subAdmin;
        const { id } = req.params;
        const updateData = req.body;

        // 1. Authenticate sub-admin
        if (!subAdmin) {
            return res.status(401).send({
                success: 0,
                message: "Sub-admin not authenticated",
            });
        }

        // 2. Check for 'edit' permission
        // ✅ PERMISSION CHECK ADDED
        if (!subAdmin.permissions?.vendors?.pharmacy?.edit) {
            return res.status(403).send({
                success: 0,
                message: "No permission to edit pharmacy products",
            });
        }

        // 3. Validate the product ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send({ success: 0, message: "Invalid product ID format." });
        }

        // 4. Find the product by its ID and update it with the new data
        const updatedProduct = await PharmacyProduct.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true } // Options: return the modified document and run schema validators
        );

        // 5. Handle case where the product does not exist
        if (!updatedProduct) {
            return res.status(404).send({ success: 0, message: "Product not found." });
        }

        // 6. Send a success response with the updated product data
        return res.send({
            success: 1,
            message: "Product updated successfully.",
            details: updatedProduct
        });

    } catch (error) {
        // 7. Handle any server-side errors
        console.error('Update product error:', error);
        return res.status(500).send({
            success: 0,
            message: "An error occurred while updating the product.",
            error: error.message
        });
    }
};





// ✅ UPLOAD MEDICINE EXCEL
const uploadMedicineExcel = async (req, res) => {
    try {
        const subAdmin = req.subAdmin;

        if (!subAdmin) {
            return res.status(401).send({
                success: 0,
                message: "Sub-admin not authenticated",
            });
        }

        // ✅ PERMISSION CHECK UPDATED
        if (!subAdmin.permissions?.vendors?.pharmacy?.create) {
            return res.status(403).send({
                success: 0,
                message: "No permission to upload pharmacy medicines",
            });
        }

        if (!req.file) {
            return res.status(400).json({ success: 0, message: 'No file uploaded' });
        }
  
        const stream = fs.createReadStream(req.file.path);
        const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(stream);
  
        const batchSize = 1000;
        let batch = [];
        let headers = [];
  
        for await (const worksheetReader of workbookReader) {
            for await (const row of worksheetReader) {
                const cells = row.values.slice(1); // first value is null
    
                if (row.number === 1) {
                    headers = cells.map(h => String(h).trim());
                } else {
                    const obj = {};
                    headers.forEach((h, i) => {
                        obj[h] = cells[i] != null ? cells[i] : "";
                    });
                    batch.push(obj);
                }
    
                if (batch.length >= batchSize) {
                    await Medicine.insertMany(batch);
                    batch = [];
                }
            }
        }
  
        if (batch.length > 0) {
            await Medicine.insertMany(batch);
        }
  
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('File delete error:', err);
        });
  
        res.status(200).json({ success: 1, message: 'Excel uploaded and data saved successfully' });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ success: 0, message: 'Something went wrong', error: err.message });
    }
};
  
// ✅ GET ALL MEDICINE DATA
const getAllMedicineData = async (req, res) => {
    try {
        const subAdmin = req.subAdmin;

        if (!subAdmin) {
            return res.status(401).send({
                success: 0,
                message: "Sub-admin not authenticated",
            });
        }

        // ✅ PERMISSION CHECK UPDATED
        if (!subAdmin.permissions?.vendors?.pharmacy?.view) {
            return res.status(403).send({
                success: 0,
                message: "No permission to view pharmacy medicines",
            });
        }

        const medicines = await Medicine.find({});
        const totalCount = medicines.length;
  
        res.send({
            success: 1,
            message: "All medicine data",
            totalCount,
            details: medicines
        });
    } catch (err) {
        res.status(500).send({ success: 0, message: err.message });
    }
};

// ✅ UPDATE MEDICINE DETAILS
const updateMedicine = async (req, res) => {
    try {
        const subAdmin = req.subAdmin;
        const { Id } = req.query;
        const updateData = req.body;

        if (!subAdmin) {
            return res.status(401).send({
                success: 0,
                message: "Sub-admin not authenticated",
            });
        }

        // ✅ PERMISSION CHECK UPDATED
        if (!subAdmin.permissions?.vendors?.pharmacy?.edit) {
            return res.status(403).send({
                success: 0,
                message: "No permission to edit pharmacy medicines",
            });
        }
    
        if (!Id) {
            return res.status(400).send({
                success: 0,
                message: "Id is required",
            });
        }
    
        let updatedMedicine;
    
        if (mongoose.Types.ObjectId.isValid(Id)) {
            updatedMedicine = await Medicine.findByIdAndUpdate(
                Id,
                updateData,
                { new: true, runValidators: true }
            );
        }
        
        if (!updatedMedicine) {
            updatedMedicine = await Medicine.findOneAndUpdate(
                { Id: Id },
                updateData,
                { new: true, runValidators: true }
            );
        }
    
        if (!updatedMedicine) {
            return res.status(404).send({
                success: 0,
                message: "Medicine not found",
            });
        }
    
        return res.send({
            success: 1,
            message: "Medicine updated successfully",
            details: updatedMedicine,
        });
    } catch (error) {
        return res.status(500).send({
            success: 0,
            message: error.message,
        });
    }
};

// ✅ GET PENDING APPROVAL MEDICINES
// ✅ GET PENDING APPROVAL MEDICINES
const getPendingMedicines = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;

    if (!subAdmin) {
      return res.status(401).send({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ✅ PERMISSION CHECK
    if (!subAdmin.permissions?.vendors?.pharmacy?.view) {
      return res.status(403).send({
        success: 0,
        message: "No permission to view pending medicines",
      });
    }

    // ✅ FETCH + POPULATE (same as your second code)
    const data = await PharmacyMedicine.find({ onStatus: "1" })
      .populate({
        path: "medicineId",
        model: "Medicine",
        strictPopulate: false,
      })
      .populate({
        path: "vendorId",
        model: "vandor",
        strictPopulate: false,
      });

    return res.send({
      success: 1,
      message: "Fetched successfully",
      details: data,
    });

  } catch (error) {
    console.log("Populate Error:", error);
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};


// ✅ APPROVE A MEDICINE
const approveMedicine = async (req, res) => {
    try {
        const subAdmin = req.subAdmin;
        const { id } = req.params;

        if (!subAdmin) {
            return res.status(401).send({
                success: 0,
                message: "Sub-admin not authenticated",
            });
        }

        // ✅ PERMISSION CHECK UPDATED
        if (!subAdmin.permissions?.vendors?.pharmacy?.edit) {
            return res.status(403).send({
                success: 0,
                message: "No permission to approve pharmacy medicines",
            });
        }

        console.log("Approving Medicine ID:", id);
    
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send({
                success: 0,
                message: "Invalid ID format",
            });
        }
    
        const updated = await PharmacyMedicine.findByIdAndUpdate(
            id,
            { onStatus: "0" },
            { new: true }
        );
    
        if (!updated) {
            console.log("Medicine not found in DB");
            return res.status(404).send({
                success: 0,
                message: "Medicine not found",
            });
        }
    
        return res.send({
            success: 1,
            message: "Medicine approved successfully",
            details: updated,
        });
    } catch (error) {
        console.log("Error:", error.message);
        return res.status(500).send({
            success: 0,
            message: error.message,
        });
    }
};

// ✅ REJECT A MEDICINE
const rejectMedicine = async (req, res) => {
    try {
        const subAdmin = req.subAdmin;
        const { id } = req.params;

        if (!subAdmin) {
            return res.status(401).send({
                success: 0,
                message: "Sub-admin not authenticated",
            });
        }

        // ✅ PERMISSION CHECK UPDATED
        if (!subAdmin.permissions?.vendors?.pharmacy?.edit) {
            return res.status(403).send({
                success: 0,
                message: "No permission to reject pharmacy medicines",
            });
        }
    
        const updated = await PharmacyMedicine.findByIdAndUpdate(
            id,
            { onStatus: "2" },
            { new: true }
        );
    
        if (!updated) {
            return res.status(404).send({
                success: 0,
                message: "Medicine not found",
            });
        }
    
        return res.send({
            success: 1,
            message: "Medicine rejected successfully",
            details: updated,
        });
    } catch (error) {
        return res.status(500).send({
            success: 0,
            message: error.message,
        });
    }
};
// ✅ DELETE A SINGLE MEDICINE
const deleteMedicine = async (req, res) => {
    try {
        const subAdmin = req.subAdmin;
        const { id } = req.params;

        if (!subAdmin) {
            return res.status(401).send({
                success: 0,
                message: "Sub-admin not authenticated",
            });
        }

        // ✅ PERMISSION CHECK
        if (!subAdmin.permissions?.vendors?.pharmacy?.delete) {
            return res.status(403).send({
                success: 0,
                message: "No permission to delete pharmacy medicines",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send({ success: 0, message: "Invalid medicine ID format." });
        }

        const deletedMedicine = await Medicine.findByIdAndDelete(id);

        if (!deletedMedicine) {
            return res.status(404).send({ success: 0, message: "Medicine not found." });
        }

        return res.send({ success: 1, message: "Medicine deleted successfully." });

    } catch (error) {
        return res.status(500).send({ success: 0, message: error.message });
    }
};

// --- NEW ---
// ✅ DELETE MULTIPLE MEDICINES
const deleteMultipleMedicines = async (req, res) => {
    try {
        const subAdmin = req.subAdmin;
        const { ids } = req.body;

        if (!subAdmin) {
            return res.status(401).send({
                success: 0,
                message: "Sub-admin not authenticated",
            });
        }

        // ✅ PERMISSION CHECK
        if (!subAdmin.permissions?.vendors?.pharmacy?.delete) {
            return res.status(403).send({
                success: 0,
                message: "No permission to delete pharmacy medicines",
            });
        }

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).send({ success: 0, message: "Please provide an array of medicine IDs to delete." });
        }

        const result = await Medicine.deleteMany({
            _id: { $in: ids },
        });

        if (result.deletedCount === 0) {
            return res.status(404).send({ success: 0, message: "No medicines found with the provided IDs." });
        }

        return res.send({ success: 1, message: `${result.deletedCount} medicines deleted successfully.` });

    } catch (error) {
        return res.status(500).send({ success: 0, message: error.message });
    }
};




// ✅ GET DELIVERY CHARGES - Subadmin
const getDeliveryCharges = async (req, res) => {
    try {
        const subAdmin = req.subAdmin;

        if (!subAdmin) {
            return res.status(401).send({
                success: 0,
                message: "Sub-admin not authenticated",
            });
        }

        // ✅ PERMISSION CHECK UPDATED
        if (!subAdmin.permissions?.vendors?.pharmacy?.view) {
            return res.status(403).send({
                success: 0,
                message: "No permission to view delivery charges",
            });
        }

        const charges = await DeliveryCharges.findOne().sort({ lastUpdated: -1 });
        
        if (!charges) {
            return res.status(200).json({
                success: 1,
                message: "Using default delivery charges",
                data: {
                    baseDeliveryCharge: 50,
                    freeDeliveryThreshold: 300,
                    rapidDeliveryCharge: 100,
                    taxPercentage: 2,
                    freeDeliveryRadius: 10,
                    perKmCharge: 5,
                    lastUpdated: null
                }
            });
        }
    
        return res.status(200).json({
            success: 1,
            message: "Delivery charges fetched successfully",
            data: charges
        });
    } catch (error) {
        console.error("Get Delivery Charges Error:", error);
        return res.status(500).json({
            success: 0,
            message: "Failed to fetch delivery charges",
            error: error.message
        });
    }
};

// ✅ UPDATE DELIVERY CHARGES - Subadmin (PATCH method)
const updateDeliveryCharges = async (req, res) => {
  try {
    const subAdmin = req.subAdmin;
    const {
      baseDeliveryCharge,
      freeDeliveryThreshold,
      rapidDeliveryCharge,
      taxPercentage,
      freeDeliveryRadius,
      perKmCharge
    } = req.body;

    // ✅ Check authentication
    if (!subAdmin) {
      return res.status(401).json({
        success: 0,
        message: "Sub-admin not authenticated",
      });
    }

    // ✅ Check permission
    if (!subAdmin.permissions?.vendors?.pharmacy?.edit) {
      return res.status(403).json({
        success: 0,
        message: "No permission to update delivery charges",
      });
    }

    // ✅ Validate inputs — ensure all numbers are valid
    const numericFields = [
      baseDeliveryCharge,
      freeDeliveryThreshold,
      rapidDeliveryCharge,
      taxPercentage,
      freeDeliveryRadius,
      perKmCharge
    ];

    if (numericFields.some((val) => val === undefined || isNaN(val))) {
      return res.status(400).json({
        success: 0,
        message: "All charges must be valid numbers",
      });
    }

    // ✅ Find the latest delivery charges record and UPDATE it (PATCH behavior)
    const latestCharges = await DeliveryCharges.findOne().sort({ lastUpdated: -1 });
    
    let updatedCharges;
    
    if (latestCharges) {
      // Update existing record with new values
      latestCharges.baseDeliveryCharge = Number(baseDeliveryCharge);
      latestCharges.freeDeliveryThreshold = Number(freeDeliveryThreshold);
      latestCharges.rapidDeliveryCharge = Number(rapidDeliveryCharge);
      latestCharges.taxPercentage = Number(taxPercentage);
      latestCharges.freeDeliveryRadius = Number(freeDeliveryRadius);
      latestCharges.perKmCharge = Number(perKmCharge);
      latestCharges.lastUpdated = new Date();
      
      updatedCharges = await latestCharges.save();
    } else {
      // Create new record if none exists
      updatedCharges = new DeliveryCharges({
        baseDeliveryCharge: Number(baseDeliveryCharge),
        freeDeliveryThreshold: Number(freeDeliveryThreshold),
        rapidDeliveryCharge: Number(rapidDeliveryCharge),
        taxPercentage: Number(taxPercentage),
        freeDeliveryRadius: Number(freeDeliveryRadius),
        perKmCharge: Number(perKmCharge),
        lastUpdated: new Date(),
      });
      await updatedCharges.save();
    }

    // ✅ Respond
    return res.status(200).json({
      success: 1,
      message: "Delivery charges updated successfully",
      data: updatedCharges,
    });
  } catch (error) {
    console.error("Update Delivery Charges Error:", error);
    return res.status(500).json({
      success: 0,
      message: "Failed to update delivery charges",
      error: error.message,
    });
  }
};

// ✅ GET DELIVERY CHARGES HISTORY - Subadmin
const getDeliveryChargesHistory = async (req, res) => {
    try {
        const subAdmin = req.subAdmin;
        const { page = 1, limit = 10 } = req.query;

        if (!subAdmin) {
            return res.status(401).send({
                success: 0,
                message: "Sub-admin not authenticated",
            });
        }

        // ✅ PERMISSION CHECK UPDATED
        if (!subAdmin.permissions?.vendors?.pharmacy?.view) {
            return res.status(403).send({
                success: 0,
                message: "No permission to view delivery charges history",
            });
        }

        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            sort: { lastUpdated: -1 }
        };
    
        const history = await DeliveryCharges.paginate({}, options);
    
        return res.status(200).json({
            success: 1,
            message: "Delivery charges history fetched successfully",
            data: history
        });
    } catch (error) {
        console.error("Get Delivery Charges History Error:", error);
        return res.status(500).json({
            success: 0,
            message: "Failed to fetch delivery charges history",
            error: error.message
        });
    }
};

module.exports = {
    // Vendor Management
    getPharmacyVendors,
    getPharmacyVendorById,
    getPharmacyVendorsStats,
    getAllVendorsLists,
    getpharmacystats,
    inActivePharmacy,
    
    // Product Management
    uploadProductExcel,
    getAllProductData,
    deleteProduct,
    deleteMultipleProducts,
    updateProduct,
    
    // Medicine Management
    uploadMedicineExcel,
    getAllMedicineData,
    updateMedicine,
    getPendingMedicines,
    approveMedicine,
    rejectMedicine,
    deleteMedicine,
    deleteMultipleMedicines,

    // Delivery Charges Management
    getDeliveryCharges,
    updateDeliveryCharges,
    getDeliveryChargesHistory,
    getAllProductDataSubadmin,
    updateProductStatusBySubAdmin 
};