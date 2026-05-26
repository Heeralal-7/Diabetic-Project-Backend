const Appointment = require("../../../../modal/Appointment");
const BookedSlot = require("../../../../modal/BookedSlot");
const Wallet = require("../../../../modal/wallet");
const Coupon = require("../../../../modal/Coupon");
const Addtest = require("../../../../modal/addTest");
const formatTime = (time) => {
  let [hours, minutes] = time.split(":");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
};
  
// Create user appointments
// Method:Post
// EndPoits:/lab-appointment/appointment
// type 0 for digital and 1 for walkin
// day  may be Morning | Afternoon | Evening
//image : patient image 
//gallery image : when patient manually upload the prescription
//prescription image: when patient upload the prescription from prescription tab

// ✅ Make sure Addtest is imported (Uncomment if not already imported at top)
 

const bookUserAppointment = async (req, res) => {
  try {
    const {
      vendorId,
      doctorId,
      serviceType,
      name,
      address,
      phone,
      date,
      test,
      price,
      testName,
      startime,
      endtime,
      sampleRequired,
      sampleCollected,
      type,
      gender,
      country,
      state,
      city,
      dob,
      pinCode,
      day,
      image,
      prescriptionImage,
      testId,
      tax = 0,
      deliveryCharges = 0,
      rapidDeliveryFee = 0,
      isRapidDelivery = false,
      couponCode,
      
      // ✅ ADDED: Destructure Payment Details from Request Body
      paymentId,
      paymentStatus,
      paymentMethod,
      transactionId
    } = req.body;

    // Format time slot
    const formattedStartime = formatTime(startime);
    const formattedEndtime = formatTime(endtime);
    const formattedTimeSlot = `${formattedStartime} - ${formattedEndtime}`;

    // Check availability
    const isExist = await BookedSlot.findOne({
      $or: [
        {
          $and: [
            { doctorId },
            { startDate: date },
            { startTime: startime },
            { userId: req.user._id },
          ],
        },
        {
          $and: [
            { vendorId },
            { startDate: date },
            { startTime: startime },
            { userId: req.user._id },
          ],
        },
      ],
    });

    if (isExist) {
      return res.send({
        success: 0,
        message: "You have already booked your appointment.",
      });
    }

    // Coupon Logic
    let finalCouponId = null;
    if (couponCode) {
      const couponData = await Coupon.findOne({ 
        couponCode: couponCode, 
        status: "1" 
      });
      if (couponData) {
        finalCouponId = couponData._id;
      }
    }

    // ✅ ADDED: Logic to ensure Paid Status
    // If paymentId exists, assume paid (unless status explicitly says failed)
    const finalPaymentStatus = paymentStatus || (paymentId ? "completed" : "pending");
    const isPaidBoolean = finalPaymentStatus === "completed";

    // 🔥🔥🔥 FIX FOR DISCOUNT MISMATCH (START) 🔥🔥🔥
    // Hum yahan current discount nikal kar save karenge
    let frozenDiscountPercentage = "0";
    
    // Agar testId hai (User ne test select kiya hai)
    if (testId) {
      try {
        // Test Id array ho sakta hai ya string, hum pehla wala uthayenge ya direct ID
        const tId = Array.isArray(testId) ? testId[0] : testId;
        
        // Addtest model (Mongoose model name 'Addtest' hona chahiye) se data layenge
        // Agar aapne upar import nahi kiya hai to ye mongoose.model wala tarika use karein:
        const mongoose = require('mongoose');
        const AddtestModel = mongoose.models.Addtest || require("../models/Addtest"); // Path adjust karein agar zarurat ho

        const testData = await AddtestModel.findById(tId);
        
        if (testData && testData.discountPercentage) {
          frozenDiscountPercentage = testData.discountPercentage;
        }
      } catch (err) {
        console.log("Error fetching frozen discount:", err);
        // Error aane par default "0" rahega
      }
    }
    // 🔥🔥🔥 FIX FOR DISCOUNT MISMATCH (END) 🔥🔥🔥

    let valueData = {
      userId: req.user._id,
      serviceType,
      date,
      price,
      timeSlot: formattedTimeSlot,
      doctorId,
      vendorId,
      name,
      address,
      phone,
      test,
      testName,
      sampleRequired,
      sampleCollected,
      type,
      gender,
      country,
      state,
      city,
      dob,
      pinCode,
      day,
      method: "Test",
      image,
      prescriptionImage,
      galleryImage: req.file ? `/user/lab/galleryImage/${req.file.filename}` : "",
      testId,
      tax: Number(tax),
      deliveryCharges: Number(deliveryCharges),
      rapidDeliveryFee: Number(rapidDeliveryFee),
      isRapidDelivery: Boolean(isRapidDelivery),
      couponId: finalCouponId,
      
      // ✅ FIX: Saving Payment Details to Database
      paymentId: paymentId || null,
      paymentStatus: finalPaymentStatus,
      paymentMethod: paymentMethod || "online", // Default to online if ID is present
      transactionId: transactionId || null,
      isPaid: isPaidBoolean,

      // 🔥 Saving the Frozen Discount Percentage Here 🔥
      appliedDiscountPercentage: frozenDiscountPercentage 
    };

    // Add optional fields
    if (doctorId) valueData.doctorId = doctorId;
    if (vendorId) valueData.vendorId = vendorId;

    // Create appointment
    const newappointment = await Appointment.create(valueData);

    // Create booked slot
    await BookedSlot.create({
      startTime: startime,
      startDate: date,
      userId: req.user._id,
      doctorId,
      vendorId,
      price,
    });

    // Create wallet entry
    await Wallet.create({
      credit: price,
      userId: req.user._id,
      doctorId,
      vendorId,
    });

    return res.send({
      message: "Appointment created successfully",
      success: 1,
      appointment: newappointment,
    });
  } catch (error) {
    console.error("Appointment creation error:", error);
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Create user appointments
// Method:Post
// EndPoits:/lab-appointment/appointment/package
// type 0 for digital and 1 for walkin
//type 1 for presecription and 0 for non-prescription
// day  may be Morning | Afternoon | Evening
//image : patient image 
//gallery image : when patient manually upload the prescription
//prescription image: when patient upload the prescription from prescription tab
const bookUserAppointmentPackage = async (req, res) => {
  try {
    const {
      vendorId,
      doctorId,
      serviceType,
      name,
      address,
      phone,
      packageName,
      date,
      test,
      price,
      startime,
      endtime,
      sampleRequired,
      sampleCollected,
      type,
      gender,
      country,
      state,
      city,
      dob,
      pinCode,
      day,
      image,
      prescriptionImage,
      packageId,

      // ✅ ADDED: Destructure Payment Details
      paymentId,
      paymentStatus,
      paymentMethod
    } = req.body;

    const formattedStartime = formatTime(startime);
    const formattedEndtime = formatTime(endtime);
    const formattedTimeSlot = `${formattedStartime} - ${formattedEndtime}`;

    const isExist = await BookedSlot.findOne({
      $or: [
        {
          $and: [
            { doctorId },
            { startDate: date },
            { startTime: startime },
            { userId: req.user._id },
          ],
        },
        {
          $and: [
            { vendorId },
            { startDate: date },
            { startTime: startime },
            { userId: req.user._id },
          ],
        },
      ],
    });

    if (isExist) {
      return res.send({
        success: 0,
        message: "You have already booked your appointment.",
      });
    }

    // ✅ ADDED: Logic
    const finalPaymentStatus = paymentStatus || (paymentId ? "completed" : "pending");
    const isPaidBoolean = finalPaymentStatus === "completed";

    let valueData = {
      userId: req.user._id,
      serviceType,
      date,
      price,
      timeSlot: formattedTimeSlot,
      doctorId,
      vendorId,
      name,
      address,
      phone,
      packageName,
      sampleRequired,
      sampleCollected,
      test,
      type,
      gender,
      country,
      state,
      city,
      dob,
      pinCode,
      day,
      method: "Package",
      image,
      prescriptionImage,
      galleryImage: req.file ? `/user/lab/galleryImage/${req.file.filename}`: "",
      packageId,
      
      // ✅ FIX: Saving Payment Details
      paymentId: paymentId || null,
      paymentStatus: finalPaymentStatus,
      paymentMethod: paymentMethod || "online",
      isPaid: isPaidBoolean
    };

    if (doctorId) valueData.doctorId = doctorId;
    if (vendorId) valueData.vendorId = vendorId;

    const newappointment = await Appointment.create(valueData);

    await BookedSlot.create({
      startTime: startime,
      startDate: date,
      userId: req.user._id,
      doctorId,
      vendorId,
      price,
    });

    await Wallet.create({
      credit: price,
      userId: req.user._id,
      doctorId,
      vendorId,
    });

    return res.send({
      message: "Appointment created successfully",
      success: 1,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};



// lab-appointment/userorderHistory
const userorderHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const orders = await Appointment.find({
      userId: userId,
      $or: [
        { serviceType: 'lab' },
        { serviceType: 'Lab Test' },
        { serviceType: 'Walkin Collection' },
        { serviceType: 'Home Collection' },
        { method: { $in: ['Test', 'Package'] } }
      ]
    })
    .sort({ createdAt: -1 })
    .populate("userId") 
    .populate("vendorId", "name email phone labName address city state ") 
    .populate("driverId", "name phoneNumber")   
    .populate({
      path: 'testId',
      model: 'Addtest',
      select: 'testName price amount discountedAmount discountPercentage',
    })
    .populate({
      path: 'packageId',
      model: 'AddPackage',
      select: 'packageName price',
    })
    // ✅ NEW: Coupon ki full details populate ki gayi hain
    .populate({
      path: 'couponId',
      model: 'Coupon', // Ensure ye wahi model name hai jo aapne define kiya hai
      select: 'couponCode percentageDiscount fixedAmountDiscount description' // Specific fields select karein
    })
    .populate({
      path: "AddMemberId",
      model: "AddMember",
      populate: [
        {
          path: "addtestId",
          model: "Addtest",
          
        },
        {
          path: "AddPackageId",
          model: "AddPackage",
        },
      ], 
    });

    return res.send({
      success: 1,
      message: "Lab order history fetched successfully",
      count: orders.length,
      details: orders,
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

// Get specific order details by ID
const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    if (!orderId) {
      return res.status(400).send({
        success: 0,
        message: "Order ID is required",
      });
    }

    // Find the specific order
    const order = await Appointment.findOne({
      _id: orderId,
      userId: userId, // Ensure user can only access their own orders
    })
    .populate("userId", "name email phone") // User details
    .populate("vendorId", "name email phone address city state image") // Vendor details
    .populate("driverId", "name phoneNumber") // Driver details
    .populate({
      path: 'testId',
      model: 'Addtest',
      select: 'testName amount discountPercentage testType testCategory prescription sampleRequired description',
    })
    .populate({
      path: 'packageId',
      model: 'AddPackage',
      select: 'packageName amount discountPercentage packageType description includedTests duration',
    })
    .populate({
      path: "AddMemberId",
      model: "AddMember",
      populate: [
        {
          path: "addtestId",
          model: "Addtest",
        },
        {
          path: "AddPackageId",
          model: "AddPackage",
        },
      ],
    });

    if (!order) {
      return res.status(404).send({
        success: 0,
        message: "Order not found",
      });
    }

    return res.send({
      success: 1,
      message: "Order details fetched successfully",
      order: order,
    });

  } catch (error) {
    console.error("Order details error:", error);
    return res.status(500).send({
      success: 0,
      message: "Failed to fetch order details",
      error: error.message,
    });
  }
};

 //       lab-appointment/getAllActiveOrderss
const getAllActiveOrderss = async (req, res) => {
  try {
    // Get all food orders with status from 2 to 6
    const orders = await Appointment.find({
      status: { $gte: 2, $lte: 7 },
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

module.exports = { bookUserAppointment, bookUserAppointmentPackage,userorderHistory,getOrderDetails,getAllActiveOrderss };
