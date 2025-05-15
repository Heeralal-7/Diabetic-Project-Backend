const Driver = require("../../../modal/driver");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const TempPhone = require("../../../modal/TempPhone");
const Vendor = require("../../../modal/vandor");
const Order = require("../../../modal/foodOrder");


// Generate token
const genrateToken = (id) => {
  return jwt.sign({ id }, process.env.SECRETKEY, { expiresIn: "30d" });
};

// Login driver
// Method: POST
// Endpoint: /driver/login
const loginDriver = async (req, res) => {
  try {
    const { serviceType, email, password } = req.body;

    if (!serviceType || !email || !password) {
      return res.status(400).send({
        success: 0,
        message: "Please enter all the required fields",
      });
    }

    const isExist = await Driver.findOne({
      $or: [{ email }, { phoneNumber: email }],
    }).populate({
      path: "vendorId",
      select: "vendor",
    });

    if (!isExist) {
      return res.status(404).send({
        success: 0,
        message: "No Driver found",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, isExist.password);

    if (
      isExist.vendorId?.vendor === serviceType &&
      isPasswordCorrect
    ) {
      const token = genrateToken(isExist._id);

      // Save token in DB (optional)
      isExist.token = token;
      await isExist.save();

      return res.status(200).send({
        success: 1,
        message: "Driver logged in successfully",
        details: {
          token,
          driver: {
            id: isExist._id,
            name: isExist.name,
            email: isExist.email,
            phoneNumber: isExist.phoneNumber,
          },
        },
      });
    }

    return res.status(401).send({
      success: 0,
      message: "Invalid credentials",
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).send({
      success: 0,
      message: "Server error",
    });
  }
};


//Change password
//Method:Post
//Endpoint:driver-addmember/change
const changePassword = async (req, res) => {
  try {
    const { oldpassword, password, confirmpassword } = req.body;
    if (!oldpassword || !password || !confirmpassword) {
      return res.send({
        success: 0,
        message: "Pleasee enter required fields",
      });
    }

    const isExist = await Driver.findOne({ _id: req.user._id });
    // console.log(req.user);
    if (!isExist) {
      return res.send({
        success: 0,
        message: "Pleasee enter required fields",
      });
    }

    if (isExist && (await bcrypt.compare(oldpassword, isExist.password))) {
      const salt = await bcrypt.genSalt(10);
      const hashPass = await bcrypt.hash(password, salt);
      if (password === confirmpassword) {
        await isExist.updateOne({ password: hashPass });
        return res.send({
          success: 1,
          message: "Password changed successfully",
        });
      } else {
        return res.send({
          success: 0,
          message: "Password did not matched",
        });
      }
    }
    return res.send({
      success: 0,
      message: "Incorrect password",
    });
  } catch (error) {
    // console.log(error);
    return res.send({
      message: "Something went wrong",
      success: 0,
      error: error.message,
    });
  }
};

//otp send to phone driver
//Method:post
//Endpoint:driver-addmember/phone-otp-sent
const otpSentToPhone = async (req, res) => {
  try {
    const { phone, ctrcode } = req.body;
    // const otp = Math.floor(1000 + Math.random() * 9000);
    const otp = 1111;

    const isUnqiue = await Driver.findOne({ phone });
    if (isUnqiue) {
      return res.send({
        success: 0,
        message: "Phone number is already in use.Try another one.",
      });
    }

    const checkPhone = await TempPhone.findOne({ phone });
    if (!checkPhone) {
      const createOtpOfPhone = await TempPhone.create({
        phone,
        ctrcode,
        otp: otp,
      });
      return res.send({
        success: 1,
        message: "Otp has been sent to your phone.",
      });
    } else {
      const updateOtpOfPhone = await checkPhone.updateOne({ otp: otp });
      return res.send({
        success: 1,
        message: "Otp has been sent to your phone.",
      });
    }
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};


//verify driver phone otp
//Method:post
//Endpoint:driver-addmember/phone-otp-verify
const verifyPhoneOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const findPhone = await TempPhone.findOne({ phone });

    if (!findPhone) {
      return res.send({
        success: 0,
        message: "Please enter correct phone number",
      });
    }

    if (findPhone && findPhone.otp !== otp) {
      return res.send({
        success: 0,
        message: "Please enter correct otp",
      });
    }

    return res.send({
      success: 1,
      message: "Phone number verified successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};


//Reset driver password
//Method:post
//Endpoint:driver-addmember/reset-password
const resetPassword = async (req, res) => {
  try {
    const { ctrCode, phoneNumber, password } = req.body;

    const user = await Driver.findOne({
      $and: [{ ctrCode }, { phoneNumber }],
    });
    if (!user) {
      return res.send({
        success: 0,
        message: "User is not authenticated",
      });
    }
    const salt = await bcrypt.genSalt(10);
    var hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    await user.save();

    return res.send({
      success: 1,
      message: "Password reset successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};





// Get Driver profile
// Method: GET
// Endpoint: /driver/profile
const getDriverProfile = async (req, res) => {
  try {
    const isExist = await Driver.findOne({ _id: req.user._id });

    if (!isExist) {
      return res.send({
        success: 0,
        message: "No driver found",
      });
    }

    return res.send({
      success: 1,
      message: "Driver profile fetched successfully",
      details: {
        ...isExist._doc, // spread existing fields
        isOnline: isExist.isOnline, // explicitly add status
      },
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};


// Toggle Driver Online/Offline
// Method: POST
// Endpoint: /driver/toggle-status
const toggleDriverStatus = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user._id);

    if (!driver) {
      return res.status(404).send({
        success: 0,
        message: "Driver not found",
      });
    }

    // Toggle status
    driver.isOnline = !driver.isOnline;

    // If going offline, mark driver as not busy
    if (!driver.isOnline) {
      driver.isBusy = false;
    }
    await driver.save();

    return res.send({
      success: 1,
      message: `Driver is now ${driver.isOnline ? "Online" : "Offline"}`,
      isOnline: driver.isOnline,
    });
  } catch (error) {
    console.error("Toggle Status Error:", error);
    return res.status(500).send({
      success: 0,
      message: "Server error",
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
      status: "2" // "2" indicates the order is assigned to the driver
    })
    .populate("userId") // Full user details
    .populate("vendorId") // Full vendor details
    .populate("driverId") // ✅ Add driver details (self)
    .populate("items.FoodItem") // food items

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


// Update order status (for driver to mark as picked or delivered)
// Method: PATCH
// Endpoint: /driver/start-order/:orderId
const startOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const driver = await Driver.findById(req.user._id);
    if (!driver) return res.send({ success: 0, message: "Driver not authenticated" });

    const order = await Order.findOne({ _id: orderId, driverId: req.user._id });
    if (!order) return res.send({ success: 0, message: "Order not found or not assigned to you" });

    order.status = "3"; // 3 = started
    await order.save();

    return res.send({ success: 1, message: "Order started", details: order });
  } catch (error) {
    return res.send({ success: 0, message: error.message });
  }
};

// Get all orders assigned to driver
// Method: GET
// Endpoint: /driver/arrived-order/:orderId
const arrivedOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, driverId: req.user._id });
    if (!order) return res.send({ success: 0, message: "Order not found or not assigned to you" });

    order.status = "4"; // 4 = arrived
    await order.save();

    return res.send({ success: 1, message: "Driver marked as arrived", details: order });
  } catch (error) {
    return res.send({ success: 0, message: error.message });
  }
};

// Get all orders assigned to driver
// Method: GET
// Endpoint: /driver/order-delivered/:orderId
const markAsDelivered = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, driverId: req.user._id });

    if (!order) return res.send({ success: 0, message: "Order not found" });

    order.status = "5"; // 5 = delivered
    order.deliveryOtp = undefined; // Optional: clear OTP
    await order.save();

    return res.send({ success: 1, message: "Order marked as delivered", details: order });
  } catch (error) {
    return res.send({ success: 0, message: error.message });
  }
};

// Get all orders assigned to driver
// Method: PATCH
// Endpoint: /driver/reject-order/:orderId
const rejectOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.send({
        success: 0,
        message: "Rejection reason is required",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      driverId: req.user._id,
    });

    if (!order) {
      return res.send({
        success: 0,
        message: "Order not found or not assigned to you",
      });
    }

    // Mark order as rejected/returned
    order.status = "6"; // 6 = Rejected/Returned
    order.rejectionReason = reason;
    await order.save();

    return res.send({
      success: 1,
      message: "Order marked as rejected/returned",
      details: order,
    });

  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Get order history for driver
// Method: GET
// Endpoint: /driver/order-history

const orderHistory = async (req, res) => {
  try {
    const driverId = req.user._id;

    // Get all orders that are either delivered (5) or rejected (6)
    const orders = await Order.find({
      driverId,
      status: { $in: ["5", "6"] }, // 5 = Delivered, 6 = Rejected
    })
    .populate("userId") // Full user details
    .populate("vendorId") // Full vendor details
    .populate("driverId") // ✅ Add driver details (self)
    .populate("items.FoodItem") // food items
      .populate("driverId", "name phoneNumber")          // driver info
      .sort({ updatedAt: -1 });                           // latest first

    // Format the response with more details
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      orderId: order.orderId, // if you have an order ID field
      status: order.status,
      statusText: order.status === "5" ? "Delivered" : "Rejected",
      totalAmount: order.totalAmount,
      deliveryAddress: order.deliveryAddress,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      rejectionReason: order.rejectionReason || null,
      user: order.userId,
      vendor: order.vendorId,
      driver: order.driverId,
      items: order.items.map(item => ({
        foodItem: item.FoodItem,
        quantity: item.quantity,
        price: item.price,
      })),
    }));

    return res.send({
      success: 1,
      message: "Order history fetched successfully",
      count: orders.length,
      details: formattedOrders,
    });

  } catch (error) {
    console.error("Order history error:", error);
    return res.status(500).send({
      success: 0,
      message: "Failed to fetch order history",
      error: error.message,
    });
  }
};



// Update order status (for driver to mark as delivered)
// Method: PATCH
// Endpoint: /driver/update-order-status/:orderId
// const updateOrderStatus = async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const { status } = req.body; // Expected values: "3" (picked), "4" (delivered)

//     // Validate status
//     if (!["3", "4"].includes(status)) {
//       return res.status(400).send({
//         success: 0,
//         message: "Invalid status. Must be '3' (picked) or '4' (delivered)",
//       });
//     }

//     // Verify driver exists
//     const driver = await Driver.findById(req.user._id);
//     if (!driver) {
//       return res.status(401).send({
//         success: 0,
//         message: "Driver not authenticated",
//       });
//     }

//     // Find the order assigned to this driver
//     const order = await FoodOrder.findOne({
//       _id: orderId,
//       driverId: req.user._id
//     });

//     if (!order) {
//       return res.status(404).send({
//         success: 0,
//         message: "Order not found or not assigned to you",
//       });
//     }

//     // Update order status
//     order.status = status;
//     await order.save();

//     // If order is delivered (status "4"), set driver as not busy
//     if (status === "4") {
//       driver.isBusy = false;
//       await driver.save();
//     }

//     return res.send({
//       success: 1,
//       message: `Order status updated to ${status === "4" ? "Delivered" : "Picked"}`,
//       details: order
//     });

//   } catch (error) {
//     console.error("Error in updateOrderStatus:", error);
//     return res.status(500).send({
//       success: 0,
//       message: error.message,
//     });
//   }
// };


module.exports = {
  loginDriver,
  getDriverProfile,
  getDriverProfile,
  changePassword,
  otpSentToPhone,
  verifyPhoneOtp,
  resetPassword,
  toggleDriverStatus,
  getAssignedOrders,
  // updateOrderStatus,
  startOrder,
  arrivedOrder,
  markAsDelivered,
  rejectOrder,
  orderHistory
};
