const Driver = require("../../../../modal/driver");
const bcrypt = require("bcryptjs");
const Vendor = require("../../../../modal/vandor");
const Appointment = require("../../../../modal/Appointment");
const Order = require("../../../../modal/foodOrder");


// Register driver by vandor
// Method:Post
// EndPoint:driver/create-driver
const createDriver = async (req, res) => {
  try {
    const {
      name,
      email,
      ctrCode,
      phoneNumber,
      qualification,
      vehicleNumber,
      vehicleType,
      licenceNumber,
      aadharCard,
      address,
      country,
      state,
      city,
      password,
    } = req.body;

    if (
      !name ||
      !email ||
      !ctrCode ||
      !phoneNumber ||
      !qualification ||
      !vehicleNumber ||
      !vehicleType ||
      !licenceNumber ||
      !aadharCard ||
      !address ||
      !country ||
      !state ||
      !city ||
      !password
    ) {
      return res.send({
        success: 0,
        message: "Please enter all the required fields",
      });
    }

    const vendor = await Vendor.findById({ _id: req.user._id });
    if (!vendor) {
      return res.send({
        success: 0,
        message: "Vendor is not authenticated",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPass = await bcrypt.hash(password, salt);

    await Driver.create({
      name,
      email,
      ctrCode,
      phoneNumber,
      qualification,
      vehicleNumber,
      vehicleType,
      licenceNumber,
      aadharCard,
      address,
      country,
      state,
      city,
      password: hashPass,
      image: req.files.image
        ? `/vendor/driver/image/${req.files.image[0].filename}`
        : "",

      drivingLicenceNumber: req.files.drivingLicence
        ? `/vendor/driver/drivingLicence/${req.files.drivingLicence[0].filename}`
        : "",
      rc: req.files.rc ? `/vendor/driver/rc/${req.files.rc[0].filename}` : "",
      certificate: req.files.certificate
        ? `/vendor/driver/certificate/${req.files.certificate[0].filename}`
        : "",

      vendorId: req.user._id,
    });

    return res.send({
      success: 1,
      message: "Created successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Get driver of vandor
// Method:Get
// EndPoint:driver/get-driver
const getDriver = async (req, res) => {
  try {
    const driver = await Driver.find({ vendorId: req.user._id });
    if (!driver) {
      return res.send({
        success: 0,
        message: "No driver found",
      });
    }

    return res.send({
      success: 1,
      message: "Fetched successfully",
      details: driver,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};


// Get Only Online Drivers
// Method: GET
// Endpoint: /driver/online
// const getOnlineDrivers = async (req, res) => {
//   try {
//     const onlineDrivers = await Driver.find({
//       vendorId: req.user._id,
//       isOnline: true, // ✅ filter only online drivers
//     });

//     if (!onlineDrivers || onlineDrivers.length === 0) {
//       return res.send({
//         success: 0,
//         message: "No online driver found",
//         details: [], 
//       });
//     }

//     return res.send({
//       success: 1,
//       message: "Online drivers fetched successfully",
//       details: onlineDrivers,
//     });
//   } catch (error) {
//     return res.send({
//       success: 0,
//       message: error.message,
//     });
//   }
// };



// Update Driver
// Method:Patch
// EndPoint:/update-driver
const updateDriver = async (req, res) => {
  try {
    const {
      name,
      email,
      ctrCode,
      phoneNumber,
      qualification,
      vehicleNumber,
      vehicleType,
      licenceNumber,
      aadharCard,
      address,
      country,
      state,
      city,
      status, // status 0 for offline and 1 for online
    } = req.body;

    const vendor = await Vendor.findById({ _id: req.user._id });
    if (!vendor) {
      return res.send({
        success: 0,
        message: "Vendor is not authenticated",
      });
    }

    await Driver.updateOne({
      name,
      email,
      ctrCode,
      phoneNumber,
      qualification,
      vehicleNumber,
      vehicleType,
      licenceNumber,
      aadharCard,
      address,
      country,
      state,
      city,
      status,

      image: req.files.image
        ? `/vendor/driver/image/${req.files.image[0].filename}`
        : Driver.image,

      drivingLicenceNumber: req.files.drivingLicence
        ? `/vendor/driver/drivingLicence/${req.files.drivingLicence[0].filename}`
        : Driver.drivingLicenceNumber,
      rc: req.files.rc
        ? `/vendor/driver/rc/${req.files.rc[0].filename}`
        : Driver.rc,
      certificate: req.files.certificate
        ? `/vendor/driver/certificate/${req.files.certificate[0].filename}`
        : Driver.certificate,
    });

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

// Delete Driver
// Method:delete
// EndPoint:/delete-driver/:id
const deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findById(req.user._id);
    if (!vendor) {
      return res.send({
        success: 0,
        message: "Vendor not found",
      });
    }
    const driver = await Driver.findByIdAndDelete(id);
    if (!driver) {
      return res.send({
        success: 0,
        message: "Driver not found",
      });
    }

    return res.send({
      success: 1,
      message: "Deleted successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};



// Get orders assigned to driver
// Method: GET
// Endpoint: /driver/assigned-orders
const getAssignedOrders = async (req, res) => {
  try {
    // Verify driver exists and is authenticated
    const driver = await Driver.findById(req.user._id);
    if (!driver) {
      return res.send({
        success: 0,
        message: "Driver not authenticated",
      });
    }

    // Find all orders assigned to this driver with status "1" (accepted)
    const orders = await Order.find({
      driverId: req.user._id,
      status: "1" // Only show accepted orders
    })
      .populate("userId", "name phoneNumber") // Show basic user info
      .populate("vendorId", "name") // Show vendor name
      .populate("items.FoodItem", "name price") // Show food item details
      .sort({ createdAt: -1 }); // Newest first

    if (orders.length === 0) {
      return res.send({
        success: 1,
        message: "No orders assigned to you currently",
        details: []
      });
    }

    return res.send({
      success: 1,
      message: "Assigned orders fetched successfully",
      details: orders
    });

  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Update order status (for driver to mark as delivered)
// Method: PATCH
// Endpoint: /driver/update-order-status/:orderId
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body; // "2" for delivered/completed

    // Verify driver exists
    const driver = await Driver.findById(req.user._id);
    if (!driver) {
      return res.send({
        success: 0,
        message: "Driver not authenticated",
      });
    }

    // Find the order assigned to this driver
    const order = await Order.findOne({
      _id: orderId,
      driverId: req.user._id
    });

    if (!order) {
      return res.send({
        success: 0,
        message: "Order not found or not assigned to you",
      });
    }

    // Update status
    order.status = status;
    await order.save();

    return res.send({
      success: 1,
      message: "Order status updated successfully",
      details: order
    });

  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};


module.exports = {
  createDriver,
  getDriver,
  updateDriver,
  deleteDriver,
  // getOnlineDrivers,
  
  getAssignedOrders,
  updateOrderStatus,
};
