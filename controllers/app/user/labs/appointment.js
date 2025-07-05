const Appointment = require("../../../../modal/Appointment");
const BookedSlot = require("../../../../modal/BookedSlot");
const Wallet = require("../../../../modal/wallet");

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
    } = req.body;


    const requiredFields = {
      serviceType: "Service type is required",
      price: "Price is required",
      startime: "Start time is required",
      endtime: "End time is required",
      test: "Test is required",
      country: "Country is required",
      state: "State is required",
      city: "City is required",
      type: "Type is required",
      name: "Name is required",
      address: "Address is required",
      phone: "Phone is required",
      date: "Date is required",
      day: "Day is required",
    };


    const formattedStartime = formatTime(startime);
    const formattedEndtime = formatTime(endtime);
    const formattedTimeSlot = `${formattedStartime} - ${formattedEndtime}`;

    // Checking you have booked your appointment or not
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
      method:"Test",
      // image: req.file ? `/user/lab/image/${req.file.filename}` : "",
      image,
      prescriptionImage,
      galleryImage: req.file ? `/user/lab/galleryImage/${req.file.filename}`: "",
     
      testId,  
    };



    if (doctorId) {
      valueData.doctorId = doctorId;
    }

    if (vendorId) {
      valueData.vendorId = vendorId;
    }

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
      packageId,   // Include packageId

    } = req.body;

    const requiredFields = {
      serviceType: "Service type is required",
      price: "Price is required",
      startime: "Start time is required",
      endtime: "End time is required",
      test: "Test is required",
      country: "Country is required",
      state: "State is required",
      city: "City is required",
      type: "Type is required",
      name: "Name is required",
      address: "Address is required",
      phone: "Phone is required",
      date: "Date is required",
      day: "Day is required",
    };



    const formattedStartime = formatTime(startime);
    const formattedEndtime = formatTime(endtime);
    const formattedTimeSlot = `${formattedStartime} - ${formattedEndtime}`;

    // Checking you have booked your appointment or not
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
      method:"Package",
      // image: req.file ? `/user/lab/image/${req.file.filename}` : "",
      image,
      prescriptionImage,
      galleryImage: req.file ? `/user/lab/galleryImage/${req.file.filename}`: "",
      packageId,   // Include packageId

    };


    if (doctorId) {
      valueData.doctorId = doctorId;
    }

    if (vendorId) {
      valueData.vendorId = vendorId;
    }

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

    // Get all orders that are either delivered (5) or rejected (6)
    const orders = await Appointment.find({
      userId,
      status: { $in: [ "8"] }, // 5 = Delivered, 6 = Rejected
    })
    .populate("userId") // Full user details
    .populate("vendorId") // Full vendor details
    .populate("driverId") // ✅ Add driver details (self)
    // .populate("Appointment") // food items
      .populate("driverId", "name phoneNumber")   
      .populate({
        path: 'testId',
        model: 'Addtest',
        select: 'testName',
      })
      .populate({
        path: 'packageId',
        model: 'AddPackage',
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
        ], })  // driver info
      .sort({ updatedAt: -1 });                           // latest first


    return res.send({
      success: 1,
      message: "Order history fetched successfully",
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

module.exports = { bookUserAppointment, bookUserAppointmentPackage,userorderHistory,getAllActiveOrderss };
