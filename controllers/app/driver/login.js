const Driver = require("../../../modal/driver");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const TempPhone = require("../../../modal/TempPhone");
const Vendor = require("../../../modal/vandor");
const Order = require("../../../modal/foodOrder");
const Appointment = require("../../../modal/Appointment");
const OrderPharmacy = require("../../../modal/OrderPharmacy");
const FoodOrder = require("../../../modal/foodOrder");


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
// Sending service type for frontend ref
// Endpoint: /driver/assigned-orders
// status 2 means assigned but not yet picked up
const getAssignedOrders = async (req, res) => {
  try {
    // 1. Verify driver exists
    const driver = await Driver.findById(req.user._id);
    if (!driver) {
      return res.send({
        success: 0,
        message: "Driver not authenticated",
      });
    }

    let orders = [];
    const serviceType = driver.serviceType || ""; // e.g., "Pharmacy", "Food", "Lab"

    // ------------------------------------------
    // CASE 1: PHARMACY ORDERS
    // ------------------------------------------
    if (serviceType.toLowerCase() === "pharmacy") {
      orders = await OrderPharmacy.find({
        driverAssignedId: driver._id, // Pharmacy uses 'driverAssignedId'
        status: 2,                    // Pharmacy uses Number 2
      })
      .populate("userId", "name phone address")
      .populate("items.productId", "name brand")
      .populate("items.medicineId", "name brand")
      .populate("vendorId", "name phone address")
      .sort({ createdAt: -1 });
    } 
    
    // ------------------------------------------
    // CASE 2: FOOD ORDERS
    // ------------------------------------------
    else if (serviceType.toLowerCase() === "food") {
      orders = await FoodOrder.find({
        driverId: driver._id,         // Food uses 'driverId'
        status: "2",                  // Food uses String "2"
      })
      .populate("userId", "name phone address")
      .populate("vendorId", "name phone address")
      .populate("items.FoodItem", "name price description")
      .sort({ createdAt: -1 });
    } 
    
    // ------------------------------------------
    // CASE 3: LAB APPOINTMENTS (Lab Test)
    // ------------------------------------------
    else if (serviceType.toLowerCase() === "lab") {
      orders = await Appointment.find({
        driverId: driver._id,         // Appointment uses 'driverId'
        status: "2",                  // Appointment uses String "2" (Assuming same pattern as Food)
      })
      .populate("userId", "name phone")
      .populate("testId", "testName price") // Populate Test details
      .populate("packageId", "packageName price") // Populate Package details
      .populate("vendorId", "name phone address") // Lab/Vendor details
      .populate("patientId", "name age gender")
      .sort({ createdAt: -1 });
    }

    // ------------------------------------------
    // RESPONSE HANDLING
    // ------------------------------------------
    if (!orders || orders.length === 0) {
      return res.send({
        success: 1,
        message: `No active ${serviceType} orders assigned to you currently`,
        details: [],
      });
    }

    return res.send({
      success: 1,
      message: "Assigned orders fetched successfully",
      serviceType: serviceType, // Sending service type for frontend ref
      details: orders,
    });

  } catch (error) {
    console.error("Error fetching assigned orders:", error);
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};


//    /driver/getAllActiveOrders
const getAllActiveOrders = async (req, res) => {
  try {
    // Get all food orders with status from 2 to 6
    const orders = await Order.find({
      status: { $gte: 2, $lte: 6 },
    })
      .populate("userId")     // Full customer info
      .populate("driverId");  // Full driver info

    return res.status(200).send({
      success: 1,
      message: "Active orders fetched successfully",
      data: orders,
    });

  } catch (error) {
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// ==========================================================
// 1. START ORDER (food,pharmacy,lab Status: 3)
// ==========================================================
const startOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // 1. Get Driver
    const driver = await Driver.findById(req.user._id);
    if (!driver) return res.send({ success: 0, message: "Driver not authenticated" });

    const serviceType = driver.serviceType?.toLowerCase();
    let order;

    // 2. Find Order based on Service Type
    if (serviceType === "pharmacy") {
      order = await OrderPharmacy.findOne({ _id: orderId, driverAssignedId: driver._id });
      if (order) {
        order.status = 3; // Pharmacy uses Number 3
      }
    } 
    else if (serviceType === "food") {
      order = await FoodOrder.findOne({ _id: orderId, driverId: driver._id });
      if (order) {
        order.status = "3"; // Food uses String
      }
    } 
    else if (serviceType === "lab") {
      order = await Appointment.findOne({ _id: orderId, driverId: driver._id });
      if (order) {
        order.status = "3"; // Lab uses String
      }
    }

    if (!order) {
      return res.send({ success: 0, message: "Order not found or not assigned to you" });
    }

    await order.save();
    return res.send({ success: 1, message: "Order started successfully", details: order });

  } catch (error) {
    return res.send({ success: 0, message: error.message });
  }
};

// ==========================================================
// 2. ARRIVED ORDER (Status: 4)
// ==========================================================
const arrivedOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const driver = await Driver.findById(req.user._id);
    if (!driver) return res.send({ success: 0, message: "Driver not authenticated" });

    const serviceType = driver.serviceType?.toLowerCase();
    let order;

    if (serviceType === "pharmacy") {
      order = await OrderPharmacy.findOne({ _id: orderId, driverAssignedId: driver._id });
      if (order) order.status = 4; // Number
    } 
    else if (serviceType === "food") {
      order = await FoodOrder.findOne({ _id: orderId, driverId: driver._id });
      if (order) order.status = "4"; // String
    } 
    else if (serviceType === "lab") {
      order = await Appointment.findOne({ _id: orderId, driverId: driver._id });
      if (order) order.status = "4"; // String
    }

    if (!order) {
      return res.send({ success: 0, message: "Order not found or not assigned to you" });
    }

    await order.save();
    return res.send({ success: 1, message: "Driver marked as arrived", details: order });

  } catch (error) {
    return res.send({ success: 0, message: error.message });
  }
};

// ==========================================================
// 3. COLLECT SAMPLE (Lab Only - Status: 5)
// ==========================================================
const collectSample = async (req, res) => {
  try {
    const { AppointmentId } = req.query;

    if (!AppointmentId) {
      return res.send({ success: 0, message: "AppointmentId is required" });
    }

    // Verify it is a Lab driver
    const driver = await Driver.findById(req.user._id);
    if (!driver || driver.serviceType.toLowerCase() !== "lab") {
       return res.send({ success: 0, message: "Authorized for Lab Drivers only" });
    }

    // Lab uses String status "5" usually for sample collected/completed
    const updated = await Appointment.findOneAndUpdate(
      { _id: AppointmentId, driverId: driver._id },
      { status: "5" }, 
      { new: true }
    );

    if (!updated) {
      return res.send({ success: 0, message: "Appointment not found or not assigned" });
    }

    return res.send({
      success: 1,
      message: "Sample collected, status updated to 5",
      data: updated,
    });

  } catch (error) {
    return res.send({ success: 0, message: error.message });
  }
};

// ==========================================================
// 4. MARK AS DELIVERED (food,pharmacy Status: 5 || lab status 6)
// ==========================================================
// Note: Pharmacy uses Number, others String. 
// Assuming Delivered Status is 5 (completed) or 6 based on your flow. 
// I will use 5 for delivered (standard) unless you strictly want 6.
// endpoint: /driver/mark-delivered/:orderId
const markAsDelivered = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { otp } = req.body; // If you use OTP verification

    const driver = await Driver.findById(req.user._id);
    if (!driver) return res.send({ success: 0, message: "Driver not authenticated" });

    const serviceType = driver.serviceType?.toLowerCase();
    let order;
    let isDelivered = false;

    // --- PHARMACY ---
    if (serviceType === "pharmacy") {
      order = await OrderPharmacy.findOne({ _id: orderId, driverAssignedId: driver._id });
      if (order) {
        // Optional: Check OTP here if needed
        order.status = 5; // Number 5 for Delivered
        // order.paymentStatus = 'completed'; // Optional update
        isDelivered = true;
      }
    } 
    // --- FOOD ---
    else if (serviceType === "food") {
      order = await FoodOrder.findOne({ _id: orderId, driverId: driver._id });
      if (order) {
        order.status = "5"; // String "5" for Delivered
        if(order.deliveryOtp) order.deliveryOtp = undefined; 
        isDelivered = true;
      }
    } 
    // --- LAB ---
    else if (serviceType === "lab") {
      // Lab usually ends at 'collectSample' (status 5), but if there is a report delivery:
      order = await Appointment.findOne({ _id: orderId, driverId: driver._id });
      if (order) {
        order.status = "6"; // Or "Completed"
        isDelivered = true;
      }
    }

    if (!order) {
      return res.send({ success: 0, message: "Order not found" });
    }

    await order.save();

    // Make driver available again
    driver.isBusy = false;
    await driver.save();

    return res.send({ success: 1, message: "Order marked as delivered/completed", details: order });

  } catch (error) {
    return res.send({ success: 0, message: error.message });
  }
};

// ==========================================================
// 5. REJECT ORDER / return order (After Assignment)
// ==========================================================
// cancel or return order (food,pharmacy status 6, lab status 7)
// endpoint: /driver/reject-order/:orderId
const rejectOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    if (!reason) return res.send({ success: 0, message: "Rejection reason is required" });

    const driver = await Driver.findById(req.user._id);
    if (!driver) return res.send({ success: 0, message: "Driver not authenticated" });

    const serviceType = driver.serviceType?.toLowerCase();
    let order;

    if (serviceType === "pharmacy") {
      order = await OrderPharmacy.findOne({ _id: orderId, driverAssignedId: driver._id });
      if (order) {
        order.status = 6; // Number (6 for Cancelled/Returned)
      }
    } 
    else if (serviceType === "food") {
      order = await FoodOrder.findOne({ _id: orderId, driverId: driver._id });
      if (order) {
        order.status = "6"; // String
      }
    } 
    else if (serviceType === "lab") {
      order = await Appointment.findOne({ _id: orderId, driverId: driver._id });
      if (order) {
        order.status = "7"; // String
      }
    }

    if (!order) return res.send({ success: 0, message: "Order not found" });

    order.rejectionReason = reason;
    await order.save();

    // Free up driver
    driver.isBusy = false;
    await driver.save();

    return res.send({ success: 1, message: "Order marked as rejected/returned", details: order });

  } catch (error) {
    return res.send({ success: 0, message: error.message });
  }
};

// ==========================================================
// 6. ORDER HISTORY (Completed/Rejected Orders)
// ==========================================================
// endpoint: /driver/order-history
const orderHistory = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user._id);
    if (!driver) return res.send({ success: 0, message: "Driver not authenticated" });

    const serviceType = driver.serviceType?.toLowerCase();
    let orders = [];

    // --- PHARMACY HISTORY ---
    if (serviceType === "pharmacy") {
      // Assuming status 5 is Delivered, 6 is Cancelled
      orders = await OrderPharmacy.find({
        driverAssignedId: driver._id,
        status: { $in: [5, 6] } 
      })
      .populate("userId", "name phone address")
      .populate("items.productId", "name")
      .sort({ updatedAt: -1 });
    } 
    // --- FOOD HISTORY ---
    else if (serviceType === "food") {
      // Assuming status "5" is Delivered, "6" is Cancelled
      orders = await FoodOrder.find({
        driverId: driver._id,
        status: { $in: ["5", "6"] }
      })
      .populate("userId", "name phone address")
      .populate("items.FoodItem", "name price")
      .sort({ updatedAt: -1 });
    } 
    // --- LAB HISTORY ---
    else if (serviceType === "lab") {
      // Assuming status "5" or "6" is Completed
      orders = await Appointment.find({
        driverId: driver._id,
        status: { $in: ["5", "6"] }
      })
      .populate("userId", "name phone")
      .populate("testId", "testName")
      .sort({ updatedAt: -1 });
    }

    return res.send({
      success: 1,
      message: "Order history fetched successfully",
      count: orders.length,
      details: orders,
    });

  } catch (error) {
    console.error("Order history error:", error);
    return res.send({ success: 0, message: error.message });
  }
};

// ==========================================================
// 7. DRIVER ASSIGN REJECT (Initially Rejecting Request by driver go back to (status 1) for accepted orders)
// ==========================================================
// endpoint: /driver/assign-reject/:orderId
const driverAssignReject = async (req, res) => {
  try {
    const { orderId } = req.params;
    const driver = await Driver.findById(req.user._id);
    if (!driver) return res.send({ success: 0, message: "Driver not authenticated" });

    const serviceType = driver.serviceType?.toLowerCase();
    let order;

    if (serviceType === "pharmacy") {
      // Pharmacy uses driverAssignedId
      order = await OrderPharmacy.findOne({ _id: orderId, driverAssignedId: driver._id });
      if (order) {
        order.status = 1; // Back to 'Searching' or 'Pending' (Number)
        order.driverAssignedId = null; // Unassign driver
      }
    } 
    else if (serviceType === "food") {
      // Food uses driverId
      order = await FoodOrder.findOne({ _id: orderId, driverId: driver._id });
      if (order) {
        order.status = "1"; // Back to 'Searching' (String)
        order.driverId = null; // Unassign driver
      }
    } 
    else if (serviceType === "lab") {
      // Lab uses driverId
      order = await Appointment.findOne({ _id: orderId, driverId: driver._id });
      if (order) {
        order.status = "1"; // String
        order.driverId = null;
      }
    }

    if (!order) return res.send({ success: 0, message: "Order not found or not assigned" });

    await order.save();
    return res.send({ success: 1, message: "Assignment rejected successfully", details: order });
 
  } catch (error) {
    return res.send({ success: 0, message: error.message });
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
  orderHistory,
  getAllActiveOrders,
  driverAssignReject,
  collectSample

};
