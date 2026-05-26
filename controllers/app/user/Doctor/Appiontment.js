const Appointment = require("../../../../modal/Appointment");
const BookedSlot = require("../../../../modal/BookedSlot");
const Wallet = require("../../../../modal/wallet");
const UserMemberShip = require("../../../../modal/UsermemberShip");
const AddMember = require("../../../../modal/AddMembers");
const Doctor = require("../../../../modal/docter");
const Prescribe = require("../../../../modal/Prescribe");
const Availablity = require("../../../../modal/availability");
const patient = require("../../../../modal/addpatientdetails")
const doctorPrescription = require("../../../../modal/DoctorPrescription")
const mongoose = require("mongoose"); // ज़रूरी है अगर ObjectId check करना हो
const User = require("../../../../modal/user")
const formatTime = (time) => {
  // If already includes AM or PM, return as-is
  if (time.toLowerCase().includes("am") || time.toLowerCase().includes("pm")) {
    return time.toUpperCase(); // Normalize casing
  }

  let [hours, minutes] = time.split(":");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes.padStart(2, "0")} ${ampm}`;
};

// Create user appointments
// Method:Post
// EndPoits:/user-appointment/appointment
// type 0 for digital and 1 for walkin
// day  may be Morning | Afternoon | Evening
const appointment = async (req, res) => {
  try {
    const {
      doctorId,
      vendorId,
      serviceType,
      date,
      price,
      startime,
      type,
      day,
      patientId,
      couponId,
      problemDescription, // <- new
      age,                // <- new
    } = req.body;

    const requiredFields = {
      serviceType: "Service type is required",
      price: "Price is required",
      startime: "Start time is required",
      day: "Day is required",
      type: "Type is required",
      patientId: "Patient ID is required",
      problemDescription: "Problem description is required",
      age: "Age is required", // <- age validation
    };

    const fieldsToCheck = [
      { field: serviceType, errorMessage: requiredFields.serviceType },
      { field: price, errorMessage: requiredFields.price },
      { field: startime, errorMessage: requiredFields.startime },
      { field: day, errorMessage: requiredFields.day },
      { field: type, errorMessage: requiredFields.type },
      { field: patientId, errorMessage: requiredFields.patientId },
      { field: problemDescription, errorMessage: requiredFields.problemDescription },
      { field: age, errorMessage: requiredFields.age }, // <- check age
    ];

    const missingFields = fieldsToCheck.filter((field) => !field.field);

    if (missingFields.length > 0) {
      const errorMessages = missingFields.map((field) => field.errorMessage);
      return res.send({
        success: 0,
        message: "The following fields are required:",
        errors: errorMessages,
      });
    }

    const formattedStartime = formatTime(startime);
    const formattedTimeSlot = `${formattedStartime}`;

    // Check for duplicate booking
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

    // Appointment data
    let valueData = {
      userId: req.user._id,
      serviceType,
      date,
      price,
      timeSlot: formattedTimeSlot,
      type,
      day,
      patientId,
      problemDescription,
      age, // <- added
    };

    if (doctorId) valueData.doctorId = doctorId;
    if (vendorId) valueData.vendorId = vendorId;
    if (couponId && couponId !== "") valueData.couponId = couponId;

    const newappointment = await Appointment.create(valueData);

    // Booked slot data
    const bookedSlotData = {
      startTime: startime,
      startDate: date,
      userId: req.user._id,
      day,
      price,
      patientId,
    };

    if (doctorId) bookedSlotData.doctorId = doctorId;
    if (vendorId) bookedSlotData.vendorId = vendorId;
    if (couponId && couponId !== "") bookedSlotData.couponId = couponId;

    await BookedSlot.create(bookedSlotData);

    // Wallet data
    const walletData = {
      credit: price,
      userId: req.user._id,
    };

    if (doctorId) walletData.doctorId = doctorId;
    if (vendorId) walletData.vendorId = vendorId;

    await Wallet.create(walletData);

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

// /user-appointment/getAllDoctorAppointments
const getAllUserAppointments = async (req, res) => {
  try {
    const { type, status, page = 1 } = req.query;
    const limit = Number(process.env.LIMIT);
    const pageNumber = +page;
    const skip = (pageNumber - 1) * limit;

    const pipeline = [
      { $match: { userId: req.user._id } },
      {
        $match: {
          ...(status && status === "6"
            ? { status: "6", PostponeStaus: "1" }
            : status ? { status } : {}),
          ...(type && { type })
        }
      },
      {
        $lookup: {
          from: "doctors",
          localField: "doctorId",
          foreignField: "_id",
          as: "doctorDetails"
        }
      },
      { $unwind: "$doctorDetails" },
      {
        $lookup: {
          from: "patients",
          localField: "patientId",
          foreignField: "_id",
          as: "patientDetails"
        }
      },
      {
        $unwind: {
          path: "$patientDetails",
          preserveNullAndEmptyArrays: true
        }
      },

      // Get prescription details
      {
        $lookup: {
          from: "doctorprescriptions",
          localField: "_id",
          foreignField: "AppointmentId",
          as: "prescriptionDetails"
        }
      },
      {
        $unwind: {
          path: "$prescriptionDetails",
          preserveNullAndEmptyArrays: true
        }
      },

      // Get insurance details from prescription
      {
        $lookup: {
          from: "addinsurancetypes",
          localField: "prescriptionDetails.addInsuranceTypeId",
          foreignField: "_id",
          as: "insuranceDetails"
        }
      },
      {
        $unwind: {
          path: "$insuranceDetails",
          preserveNullAndEmptyArrays: true
        }
      },

      // Get coupon details
      {
        $lookup: {
          from: "coupons",
          localField: "couponId",
          foreignField: "_id",
          as: "couponDetails"
        }
      },
      {
        $unwind: {
          path: "$couponDetails",
          preserveNullAndEmptyArrays: true
        }
      },

      // Final projection with merged insurance fields into prescription
      {
        $project: {
          _id: 0,
          appointment: "$$ROOT",
          doctor: "$doctorDetails",
          patient: "$patientDetails",
          coupon: "$couponDetails",
          prescription: {
            $mergeObjects: [
              "$prescriptionDetails",
              {
                insuranceName: "$insuranceDetails.addInsurance",
                insuranceImage: "$insuranceDetails.insuranceImage"
              }
            ]
          }
        }
      },

      { $skip: skip },
      { $limit: limit }
    ];

    const details = await Appointment.aggregate(pipeline);

    res.send({
      success: 1,
      message: "User appointments fetched successfully",
      details
    });
  } catch (error) {
    res.send({ success: 0, message: error.message });
  }
};

// website k liye hai... 
// Method: POST
// Endpoint: /user-appointment/appointmentReact
// ✅ UPDATED: Fixed membership logic + Clinic-based status
// ✅ UPDATED: Fixed membership logic + Clinic-based status FROM DOCTOR MODEL
const appointmentReact = async (req, res) => {
  try {
    const {
      doctorId,
      clinicId, // Frontend se aane wala clinicId
      serviceType,
      date,
      price,
      startime,
      type,
      day,
      patientId,
      problemDescription,
      age,
      couponId,
      status, // ✅ Frontend se explicit status (9 ya 0)
      
      // 🚨 CRITICAL FLAGS FROM FRONTEND
      useMembership = false,
      isPaid = false,
      paymentStatus = "pending",
      paymentId = null,
      paymentMethod = null,
      
      // 🚨 NEW FORCE FLAGS FROM FRONTEND
      forcePaidAppointment = false,
      skipMembershipCheck = false
    } = req.body;

    const userId = req.user._id;

    // 🔍 Validate required fields
    const required = {
      date,
      price,
      day,
      patientId,
      problemDescription,
      age,
    };

    const missing = Object.entries(required)
      .filter(([key, val]) => !val)
      .map(([key]) => key);

    if (missing.length > 0) {
      return res.send({
        success: 0,
        message: "The following fields are required:",
        errors: missing,
      });
    }

    // 🚨 NEW: DOCTOR MODEL CHECK FOR CLINIC ID
    let doctorClinicId = null;
    let hasDoctorClinic = false;
    
    if (doctorId) {
      const doctor = await Doctor.findById(doctorId).select('clinicId');
      if (doctor) {
        doctorClinicId = doctor.clinicId;
        hasDoctorClinic = doctorClinicId && doctorClinicId.toString().trim() !== "";
        console.log(`✅ Doctor Model Clinic Check:`, {
          doctorId,
          doctorClinicId: doctorClinicId || "None",
          hasDoctorClinic
        });
      }
    }

    // ✅ 🚨 DYNAMIC STATUS LOGIC (UPDATED WITH DOCTOR MODEL CHECK)
    // Priority: 1. Frontend status, 2. Doctor Model Clinic ID, 3. Request Clinic ID, 4. Default
    let finalStatus = "0"; // Default
    
    if (status && (status === "0" || status === "9")) {
      // 1. If frontend sends explicit status, use it (highest priority)
      finalStatus = status;
      console.log(`✅ Using explicit frontend status: ${finalStatus}`);
    } else if (hasDoctorClinic) {
      // 2. If doctor model has clinicId, set to 9
      finalStatus = "9";
      console.log(`✅ Doctor has clinic in model, setting status: ${finalStatus}`);
    } else if (clinicId && clinicId.trim() !== "") {
      // 3. If request has clinicId (but doctor doesn't have), set to 9
      finalStatus = "9";
      console.log(`✅ Request has clinicId (doctor model doesn't), setting status: ${finalStatus}`);
    } else {
      // 4. No clinic anywhere, set to 0
      finalStatus = "0";
      console.log(`✅ No clinic found anywhere, setting default status: ${finalStatus}`);
    }

    console.log("📊 Status Logic Summary:", {
      frontendStatus: status,
      doctorModelHasClinic: hasDoctorClinic,
      doctorClinicId: doctorClinicId || "None",
      requestClinicId: clinicId || "None",
      finalStatus: finalStatus
    });

    let finalPrice = price;
    let isFreeConsultation = false;
    let userMembershipId = null;
    let membershipConsultationUsed = false;

    // ✅ 🚨 UPDATED MEMBERSHIP LOGIC: Handle different scenarios
    if (forcePaidAppointment === true || skipMembershipCheck === true) {
      // 🚨 SCENARIO 1: FORCE PAID APPOINTMENT (from payment gateway)
      console.log("✅ Force paid appointment - skipping membership check");
      isFreeConsultation = false;
      userMembershipId = null;
      membershipConsultationUsed = false;
      finalPrice = price; // Keep the paid price
      
    } else if (useMembership === true) {
      // 🚨 SCENARIO 2: EXPLICIT MEMBERSHIP USAGE REQUESTED
      console.log("✅ Checking membership as requested");
      const activeMembership = await UserMemberShip.findOne({
        userId,
        isActive: true,
        endDate: { $gt: new Date() },
      });

      if (activeMembership) {
        // ✅ Handle missing/null consultationLimit safely
        const consultationLimit = activeMembership.consultationLimit ?? 0;
        const consultationsUsed = activeMembership.consultationsUsed ?? 0;
        
        const consultationsRemaining = Math.max(consultationLimit - consultationsUsed, 0);

        if (consultationsRemaining > 0) {
          isFreeConsultation = true;
          userMembershipId = activeMembership._id;
          membershipConsultationUsed = true;
          
          // ✅ Update membership usage
          await UserMemberShip.findByIdAndUpdate(
            activeMembership._id,
            { 
              $inc: { consultationsUsed: 1 },
              lastUsed: new Date()
            }
          );

          console.log(`✅ Membership used: ${activeMembership.planName}, ${consultationsRemaining - 1} consultations remaining`);
        } else {
          // ❌ Membership exists but no consultations remaining
          return res.send({
            success: 0,
            message: "No free consultations remaining in your membership",
          });
        }
      } else {
        // ❌ No active membership found but user requested to use it
        return res.send({
          success: 0,
          message: "No active membership found to use for free consultation",
        });
      }
    } else {
      // 🚨 SCENARIO 3: REGULAR PAID APPOINTMENT (no membership)
      console.log("✅ Regular paid appointment - no membership");
      isFreeConsultation = false;
      userMembershipId = null;
      membershipConsultationUsed = false;
      finalPrice = price; // Keep original price
    }

    // ✅ Format time
    const formattedStartime = formatTime(startime);

    // ✅ Prevent duplicate booking for same user + time
    const isExist = await BookedSlot.findOne({
      userId: req.user._id,
      startDate: date,
      startTime: startime,
      ...(doctorId && { doctorId }),
      ...(clinicId && { vendorId: clinicId }),
    });

    if (isExist) {
      return res.send({
        success: 0,
        message: "You have already booked this appointment slot.",
      });
    }

    // ✅ Appointment object - COMPLETE WITH ALL FIELDS
    const appointmentData = {
      userId: req.user._id,
      serviceType,
      date,
      price: finalPrice,
      timeSlot: formattedStartime,
      type,
      day,
      patientId,
      problemDescription,
      age,
      
      // 🚨 STATUS: Doctor Model ClinicId based or frontend provided 
      status: finalStatus,
      
      // Clinic status logic - based on doctor model clinicId
      clinicStatus: hasDoctorClinic ? "1" : "0",
      
      // 🚨 Store both clinic IDs for reference
      ...(doctorClinicId && { doctorModelClinicId: doctorClinicId }),
      ...(clinicId && { requestClinicId: clinicId }),
      
      // 🚨 MEMBERSHIP FIELDS
      isFreeConsultation,
      userMembershipId,
      membershipConsultationUsed,
      
      // 🚨 PAYMENT FIELDS
      isPaid: isPaid || paymentStatus === "completed" || forcePaidAppointment,
      paymentStatus: paymentStatus || (forcePaidAppointment ? "completed" : "pending"),
      paymentId,
      paymentMethod,
      
      // Additional fields
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add IDs
    if (doctorId) appointmentData.doctorId = doctorId;
    if (clinicId) {
      appointmentData.vendorId = clinicId;
      appointmentData.clinicId = clinicId;
    }
    
    // Use doctor's clinicId if available (higher priority)
    if (hasDoctorClinic && doctorClinicId) {
      appointmentData.vendorId = doctorClinicId;
      appointmentData.clinicId = doctorClinicId;
      appointmentData.clinicStatus = "1";
    }
    
    if (couponId) appointmentData.couponId = couponId;

    // ✅ Create appointment
    const appointment = await Appointment.create(appointmentData);

    // ✅ BookedSlot with same status
    const slotData = {
      startTime: startime,
      startDate: date,
      userId: req.user._id,
      day,
      price: finalPrice,
      patientId,
      isFreeConsultation,
      membershipConsultationUsed,
      status: finalStatus, // ✅ Same status
      appointmentId: appointment._id,
      ...(doctorId && { doctorId }),
      ...(clinicId && { vendorId: clinicId }),
      // Use doctor's clinicId in booked slot too
      ...(hasDoctorClinic && doctorClinicId && { vendorId: doctorClinicId }),
      ...(couponId && { couponId }),
    };

    await BookedSlot.create(slotData);

    // ✅ Wallet - only create entry for paid appointments (not free ones)
    if (!isFreeConsultation && finalPrice !== "0" && finalPrice !== 0) {
      const walletData = {
        credit: finalPrice,
        userId: req.user._id,
        transactionType: "appointment_payment",
        status: "completed",
        appointmentId: appointment._id,
        ...(doctorId && { doctorId }),
        // Use doctor's clinicId for wallet if available
        ...((hasDoctorClinic && doctorClinicId) && { vendorId: doctorClinicId }),
        ...((clinicId && !hasDoctorClinic) && { vendorId: clinicId }),
        createdAt: new Date()
      };
      await Wallet.create(walletData);
    }

    // ✅ Return response with all details
    const responseMessage = isFreeConsultation ? 
      "Appointment created successfully using membership (Free)" : 
      `Appointment created successfully (Paid: ₹${finalPrice})`;

    return res.send({
      success: 1,
      message: responseMessage,
      appointment,
      isFreeConsultation,
      pricePaid: finalPrice,
      status: finalStatus,
      doctorClinicId: doctorClinicId || null,
      requestClinicId: clinicId || null,
      paymentStatus: forcePaidAppointment ? "completed" : paymentStatus
    });

  } catch (error) {
    console.error("❌ Error in appointmentReact:", error);
    return res.send({
      success: 0,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get Order History (Only Valid Orders with Patient Details + Prescription Data)
// Method: GET
// Endpoint: /user-appointment/order-history

const getOrderHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // ✅ 1. Match Logic
    const matchQuery = {
      userId: req.user._id,
      patientId: { $exists: true, $ne: null },
      serviceType: { $ne: "Lab Test" }
    };

    // Status filter (Pending, Completed, Cancelled, etc.)
    if (status && status !== 'all') {
      matchQuery.status = status;
    }

    const pipeline = [
      // ✅ 2. Match Phase
      { $match: matchQuery },

      // ✅ 3. Sort by Latest Created Date
      { $sort: { createdAt: -1 } },

      // ✅ 4. Join Doctor Details
      {
        $lookup: {
          from: "doctors",
          localField: "doctorId",
          foreignField: "_id",
          as: "doctorDetails",
        },
      },
      {
        $unwind: {
          path: "$doctorDetails",
          preserveNullAndEmptyArrays: true, 
        },
      },

      // ✅ 5. Join Clinic/Vendor Details
      {
        $lookup: {
          from: "vendors",
          localField: "vendorId",
          foreignField: "_id",
          as: "clinicDetails",
        },
      },
      {
        $unwind: {
          path: "$clinicDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      // ✅ 6. Join Patient Details
      {
        $lookup: {
          from: "patients",
          localField: "patientId",
          foreignField: "_id",
          as: "patientDetails",
        },
      },
      {
        $unwind: {
          path: "$patientDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      // ✅ 7. [NEW] Join Doctor Prescription (Generated PDF)
      // Checks the 'doctorprescriptions' collection for a record matching this AppointmentId
      {
        $lookup: {
          from: "doctorprescriptions", // Ensure this matches your actual MongoDB collection name (usually lowercase plural)
          localField: "_id",
          foreignField: "AppointmentId",
          as: "prescriptionData"
        }
      },
      {
        $unwind: {
          path: "$prescriptionData",
          preserveNullAndEmptyArrays: true // Keep appointment even if no prescription exists yet
        }
      },

      // ✅ 8. Pagination
      { $skip: skip },
      { $limit: limitNumber },

      // ✅ 9. Project Data
      {
        $project: {
          orderId: "$_id",
          bookingDate: "$date",
          timeSlot: "$timeSlot",
          serviceType: "$serviceType",
          
          // Financials
          amount: {
            $cond: {
              if: { $and: [
                { $eq: ["$isFreeConsultation", true] },
                { $eq: ["$price", "0"] }
              ]},
              then: "$originalPrice",
              else: "$price"
            }
          },
          originalPrice: "$originalPrice",
          finalAmount: "$finalAmount",
          discountAmount: "$discountAmount",
          
          // Statuses
          paymentStatus: { $ifNull: ["$paymentStatus", "pending"] },
          isPaid: { $ifNull: ["$isPaid", false] },
          orderStatus: "$status",
          clinicStatus: "$clinicStatus",
          createdAt: "$createdAt",
          
          // Clinic Info
          clinicId: { $ifNull: ["$clinicId", "$vendorId"] },
          clinicName: { $ifNull: ["$clinicDetails.clinicName", "$doctorDetails.clinicName"] },
          clinicAddress: { $ifNull: ["$clinicDetails.address", "$doctorDetails.clinicAddress"] },
          clinicImage: "$clinicDetails.image",

          // Doctor Info
          doctorName: "$doctorDetails.name",
          doctorImage: "$doctorDetails.image",
          specialization: "$doctorDetails.specialist",

          // Patient Info
          patientName: "$patientDetails.name",
          patientAge: "$patientDetails.dob",
          patientGender: "$patientDetails.gender",
          patientPhone: "$patientDetails.phone",
          problemDescription: "$problemDescription",
         
          // 🚨 PRESCRIPTION DETAILS 🚨
          
          // 1. User Uploaded Files (if user uploaded an image during booking)
          // Adjust "$image" if your schema uses a different name like "documents" or "prescriptionImage"
          userUploadedPrescription: "$image", 

          // 2. Doctor Generated PDF (from createDoctorPrescription API)
          doctorPrescriptionPdf: "$prescriptionData.pdfUrl",
          doctorPrescriptionId: "$prescriptionData._id",

          // Membership & Coupon
          isFreeConsultation: "$isFreeConsultation",
          membershipConsultationUsed: "$membershipConsultationUsed",
          userMembershipId: "$userMembershipId",
          couponId: "$couponId",
          couponCode: "$couponCode",
        },
      },
    ];

    // ✅ Execute aggregation
    const orders = await Appointment.aggregate(pipeline);

    // ✅ Total Count
    const totalOrders = await Appointment.countDocuments(matchQuery);

    return res.send({
      success: 1,
      message: "Order history fetched successfully",
      totalOrders,
      totalPages: Math.ceil(totalOrders / limitNumber),
      currentPage: pageNumber,
      data: orders,
    });
  } catch (error) {
    console.error("Error in getOrderHistory:", error);
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};
 


module.exports = { appointment,getAllUserAppointments,appointmentReact, getOrderHistory };
