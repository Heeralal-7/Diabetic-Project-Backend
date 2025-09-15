const Vendor = require("../../../../modal/vandor");
const Addtest = require("../../../../modal/addTest");
const BookSlot = require("../../../../modal/BookedSlot");

// To Create test
// Method : Post,
// EndPoint: addtest/create-test
const createTest = async (req, res) => {
  try {
    const {
      testCategory,
      testName,
      description,
      precautions,
      amount,
      discountPercentage,
      other,
      vendorType,
      testType,
      sampleRequired,
      sampleCollected,
      prescription,
      organ
    } = req.body;

    // console.log(req.user);
    // return;

    if (
      !testCategory ||
      !testName ||
      !description ||
      !precautions ||
      !amount ||
      !discountPercentage ||
      !vendorType
    ) {
      return res.send({
        message: "All fields are required",
        success: 0,
      });
    }


    const vendor = await Vendor.findById({ _id: req.user._id });
    if (!vendor) {
      return res.send({
        success: 0,
        message: "Vendor is not authenticated",
      });
    }


    let discountedPrice = amount;
    if (discountPercentage && discountPercentage > 0) {
      discountedPrice = amount - (amount * discountPercentage) / 100;
    }


    const test = await Addtest.create({
      testCategory,
      testName,
      description,
      precautions,
      amount,
      discountPercentage,
      other,
      vendorId: req.user._id,
      vendorType,
      testType,
      sampleRequired,
      sampleCollected,
      prescription,
      discountedAmount: discountedPrice,
      organ
    });

    return res.send({
      success: 1,
      message: "Test created successfully",
    });
  } catch (error) {
    return res.send({
      message: error.message,
      success: 0,
    });
  }
};

// Get all test
// Method :/addTest
// EndPoint
// status : 0 for ongoing ,  and 1 for closed
// category : pathology and rediology
const getAllTests = async (req, res) => {
  try {
    const { status, category, page } = req.query;
    const limit = process.env.LIMIT;

    const pageNumber = parseInt(page, 10) || 1;
    const perPage = parseInt(limit, 10) || 10;

    const options = {
      skip: (pageNumber - 1) * perPage,
      limit: perPage,
    };

    const query = {
      $and: [
        { vendorId: req.user._id },
        { status },
        { testCategory: category },
      ],
    };

    const findAllTests = await Addtest.find(query, {}, options);

    if (!findAllTests) {
      return res.send({
        success: 0,
        message: "No Test found",
      });
    }
    return res.send({
      success: 1,
      message: "All test fetched successfully",
      details: findAllTests,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Delete particular test
// Method :DELETE
// EndPoint: addTest/:id

const deleteTest = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findById(req.user._id);
    if (!vendor) {
      return res.send({
        success: 0,
        message: "Vendor is not authenticated",
      });
    }

    const deleteappointment = await Addtest.findByIdAndDelete(id);
    if (!deleteappointment) {
      return res.send({
        success: 0,
        message: "Id is not authenticated",
      });
    }

    return res.send({
      success: 1,
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Edit particular test
// Method :PATCH
// EndPoint: addTest/:id
const editTest = async (req, res) => {
  try {
    const {
      testName,
      description,
      precautions,
      testCategory,
      testType,
      sampleRequired,
      sampleCollected,
      amount,
      discountPercentage,
    } = req.body;
    const { id } = req.params;
    const vendor = await Vendor.findById(req.user._id);
    if (!vendor) {
      return res.send({
        success: 0,
        message: "Vendor is not authenticated",
      });
    }
    const update = await Addtest.findByIdAndUpdate(
      id,
      {
        testName,
        description,
        precautions,
        testCategory,
        testType,
        sampleRequired,
        sampleCollected,
        amount,
        discountPercentage,
      },
      { new: true }
    );

    return res.send({
      success: 1,
      message: "Test updated",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};



//update test fields
const updateTest = async (req, res) => {
  try {
    const result = await Addtest.updateMany({}, { prescription: "false" });

    return res.send({
      success: 1,
      message: "Updated successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};


// Edit particular test status
// Method :PATCH
// EndPoint: addTest/update/:id
const updatestatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Get the status from the request body

    // Validate if status is provided
    if (status === undefined || status === null) {
      return res.status(400).send({
        success: 0,
        message: "Status is required in the request body.",
      });
    }

    const data = await Addtest.findByIdAndUpdate(
      id,
      { status: status }, // Use the provided status value
      { new: true }
    );

    if (!data) {
      return res.status(404).send({
        success: 0,
        message: "Record not found.",
      });
    }

    return res.send({
      success: 1,
      message: "Updated successfully",
      data,
    });
  } catch (error) {
    return res.status(500).send({ // Send appropriate status code for server errors
      success: 0,
      message: error.message,
    });
  }
};

module.exports = {
  createTest,
  getAllTests,
  deleteTest,
  editTest,
  updateTest,
  updatestatus,
};
