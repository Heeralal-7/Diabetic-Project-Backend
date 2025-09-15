const AddPackage = require("../../../../modal/AddPackages");
const { updateOne } = require("../../../../modal/docter");
const PackageCategory = require("../../../../modal/addPackageCategories");

// Create Package
// Method:Post
// EndPoint: /package/create-package
// status 0 for ongoing and onhold and 1 for rejected
//method: Only for simple package (rediology and pathology)
const createPackage = async (req, res) => {
  try {
    const {
      packageName,
      description,
      precautions,
      testType,
      sampleRequired,
      sampleCollected,
      addTest,
      amount,
      discountPercentage,

    } = req.body;

    if (!packageName || !description || !precautions || !addTest || !amount) {
      return res.send({
        success: 0,
        message: "Please enter all the required fields",
      });
    }

    let discountedPrice = amount;
    if (discountPercentage && discountPercentage > 0) {
      discountedPrice = amount - (amount * discountPercentage) / 100;
    }

    const createPackageD = await AddPackage.create({
      packageName,
      description,
      precautions,
      testType,
      sampleRequired,
      sampleCollected,
      addTest,
      discountPercentage,

      amount,
      method: "Simple Package",
      discountedAmount: discountedPrice,
      vendorId: req.user._id,
    });

    return res.send({
      success: 1,
      message: "Package created successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Get All Packages
// Method: Get
// EndPoint:/package/all-package
const getAllPackages = async (req, res) => {
  try {
    const { status, page } = req.query;

    // Convert page, limit, and status to integers
    const pageNumber = parseInt(page, 10);
    const perPage = process.env.LIMIT;

    // Calculate skip value for pagination
    const skip = (pageNumber - 1) * perPage;

    const query = {
      $and: [{ vendorId: req.user._id }, { status }],
    };

    const findAllPackages = await AddPackage.find(query)
      .skip(skip)
      .limit(perPage);
    if (!findAllPackages) {
      return res.send({
        success: 0,
        message: "No package found",
      });
    }

    return res.send({
      success: 1,
      message: "All package fetched successfully",
      details: findAllPackages,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Get Single Packages
// Method: Get
// EndPoint:/package/:packageId
// Query: packageId
const getSinglePackage = async (req, res) => {
  try {
    const { packageId } = req.query;
    const findSinglePackage = await AddPackage.findOne({ _id: packageId });
    if (!findSingle) {
      return res.send({
        success: 0,
        message: "No Package found",
      });
    }
    return res.send({
      success: 1,
      message: "Package found successfully",
      details: findSinglePackage,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Delete Packages
// Method: Delete
// EndPoint:/package/delete
// Query: packageId
const deletePackage = async (req, res) => {
  try {
    const { packageId } = req.query;
    const findPackage = await AddPackage.findOne({ _id: packageId });
    if (!findPackage) {
      return res.send({
        success: 0,
        message: "No Package Found",
      });
    }

    await findPackage.deleteOne();
    return res.send({
      success: 1,
      message: "Package deleted successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Update Packages
// Method: Patch
// EndPoint:/package
// Query: packageId
const updatePackage = async (req, res) => {
  try {
    const { packageId } = req.query;
    const { packageName, description, precautions, testType, addTest, amount, discountPercentage } =
      req.body;
    const findPackage = await AddPackage.findOne({ _id: packageId });
    if (!findPackage) {
      return res.send({
        success: 0,
        message: "Package not found",
      });
    }

    await findPackage.updateOne({
      packageName,
      description,
      precautions,
      testType,
      // sampleRequired,
      // sampleCollected,
      addTest,
      amount,
      discountPercentage,
    });
    return res.send({
      success: 1,
      message: "Package updated successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Update Status of Packages
// Method: Patch
// EndPoint:/package/status
// status: 0 for ongoing and onhold and 1 for reject
const updatePackageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Get the status from the request body

    // Validate if status is provided
    if (status === undefined) {
      return res.status(400).send({
        success: 0,
        message: "Status is required in the request body.",
      });
    }

    // You can add more validation here for the status, e.g., if it should be a number, within a specific range, etc.
    // For example:
    // if (typeof status !== 'number' || status < 0 || status > 10) {
    //   return res.status(400).send({
    //     success: 0,
    //     message: "Invalid status value.",
    //   });
    // }

    await AddPackage.findByIdAndUpdate(id, { status: status }, { new: true }); // Use the dynamic status

    return res.send({
      success: 1,
      message: "Package updated successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Get package category (like full body checkup - test)
//Method:Get
//Endpoint:package/category?test_category
const getpackagecategory = async (req, res) => {
  try {
    const { test_category } = req.query;

    const data = await PackageCategory.find({ test_category });

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

//Get all category (like full body checkup)
//Method:Get
//Endpoints:package/allcategory
const packagecategory = async (req, res) => {
  try {
    const data = await PackageCategory.find({});

    const uniqueCategories = data.reduce((acc, current) => {
      const category = current.test_category;

      if (!acc.some((item) => item.test_category === category)) {
        acc.push(current);
      }
      return acc;
    }, []);

    return res.send({
      success: 1,
      message: "Fetched successfully",
      details: uniqueCategories,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Create Package Category
//Method:Post
//Endpoint:package/create-collectionPackage
// status 0 for ongoing and onhold and 1 for rejected
//method: Only for collection package (all body types)
const createPackageCategory = async (req, res) => {
  try {
    const {
      packageName,
      testType,
      addTest,
      amount,
      discountPercentage,
    } = req.body;

    let discountedPrice = amount;
    if (discountPercentage && discountPercentage > 0) {
      discountedPrice = amount - (amount * discountPercentage) / 100;
    }

    await AddPackage.create({
      packageName,
      testType,
      addTest,
      discountPercentage,

      amount,
      method: "Package Collection",
      discountedAmount: discountedPrice,
      vendorId: req.user._id,
    });

    return res.send({
      success: 1,
      message: "Package created successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};




module.exports = {
  createPackage,
  getAllPackages,
  deletePackage,
  updatePackage,
  getSinglePackage,
  updatePackageStatus,
  getpackagecategory,
  packagecategory,
  createPackageCategory,
  
};
