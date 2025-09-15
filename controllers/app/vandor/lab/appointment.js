const Appointment = require("../../../../modal/Appointment");
const Vendor = require("../../../../modal/vandor");
const moment = require("moment");

const Driver = require("../../../../modal/driver");

const Document = require("../../../../modal/Document");

// Get All Vendor Appointments
// Method:Get
// EndPoints:/ all-appointments/getallaapointments
// type 0 for genralOrder and 1 for prescriptionOrder
// status 0 pending 1 for accepted 2 for rejected and 3 for pending for reports
const getAllVendorAppointments = async (req, res) => {
  try {
    const { type, page, limit, status } = req.query;

    // Convert page and limit to integers with default values
    const pageNumber = parseInt(page, 10) || 1; // Default page number to 1
    const pageSize = parseInt(limit, 10) || 10;
    let query = {
      $and: [
        { vendorId: req.user._id },
        { type: type == "0" ? "0" : "1" },
        { status: status && status.length > 0 ? status : "0" },
      ],
    };

    const findAppointment = await Appointment.find(query)
      .populate({
        path: "userId",
        select: "name",
      })
      .populate({
        path: 'testId',
        model: 'Addtest',
        select: 'testName',
      })

      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .exec();

    if (!findAppointment) {
      return res.send({
        success: 0,
        message: "No appointment found",
      });
    }

    return res.send({
      success: 1,
      message: "All Appointments fetched successfully",
      details: findAppointment,
    });
  } catch (error) {
    return res.send({ success: 0, message: error.message });
  }
};


// Update appointment
// Method:Patch
// EndPoints:/all-appointments/updatestatus
// type : 1 for accept and  2 for reject
const updateAppointmentStatus = async (req, res) => {
  try {
    const { type, appointmentId,rejectionReason } = req.body;

    // Find and update the appointment status
    const updatedAppointment = await Appointment.findOneAndUpdate(
      { _id: appointmentId, vendorId: req.user._id },
      { status: type },
      {rejectionReason:rejectionReason},
      { new: true }
    );

    // Check if the appointment was found and updated
    if (!updatedAppointment) {
      return res.send({
        message:
          "Appointment not found or you do not have permission to update it",
        success: 0,
      });
    }

    return res.send({
      message: `Appointment ${
        type == 1 ? "Accepted" : type == 2 ? "Rejected" : "Pending"
      } successfully`,
      success: 1,
    });
  } catch (error) {
    return res.send({
      message: error.message,
      success: 0,
    });
  }
};

//Get particular appointment
//Method:Get
//EndPoints: all-appointments/particular
// status 0 pending 1 for accepted 2 for rejected and 3 for pending for reports
const getParticularAppointment = async (req, res) => {
  try {
    const { status, page, limit } = req.query;

    if (status === undefined || ![0, 1, 2, 3, 6 ,7,8].includes(parseInt(status))) {
      return res.send({
        success: 0,
        message:
          "Valid status is required (0 for pending, 1 for accepted, 2 for rejected)",
      });
    }

    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;

    const statusInt = parseInt(status);

    const data = await Appointment.find({ status: statusInt })
      .populate({
        path: 'testId',         // field in appointment schema
        model: 'Addtest',       // correct model name
        select: 'testName',     // you can add more fields here if needed
      })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .exec();

    if (!data) {
      return res.send({
        success: 0,
        message: "No data found",
      });
    }

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


//   all-appointments/getHomeCollection
const getHomeCollection = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);

    const data = await Appointment.find({
      serviceType: { $in: ["Home Collection", "HomeCollection"] },
      status: "1"
    })
      .populate({
        path: 'testId',
        model: 'Addtest',
        select: 'testName',
      })
      .populate({
        path: 'packageId',
        model: 'AddPackage',
      })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .exec();

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



// const assignDriverToLabOrder = async (req, res) => {
//   try {
//     const { AppointmentId, driverId } = req.body;

//     if (!AppointmentId || !driverId) {
//       return res.send({
//         success: 0,
//         message: "Order ID and Driver ID are required",
//       });
//     }

//     // check order exists and is accepted
//     const order = await Appointment.findOne({ _id: AppointmentId, status: "1" });

//     if (!order) {
//       return res.send({
//         success: 0,
//         message: "Accepted order not found",
//       });
//     }

//     // check driver is online
//     const driver = await Driver.findOne({ _id: driverId, isOnline: true });

//     if (!driver) {
//       return res.send({
//         success: 0,
//         message: "Driver not found or not online",
//       });
//     }

//     // Assign driver to order
//     order.driverId = driverId;
//     order.status = "2"; // assigned to driver 
//     await order.save();

//     // Mark driver as busy
//     driver.isBusy = true;
//     await driver.save();

//     return res.send({
//       success: 1,
//       message: "Driver assigned successfully to the order",
//       details: order,
//     });

//   } catch (error) {
//     return res.send({
//       success: 0,
//       message: error.message,
//     });
//   }
// };


// Get Today appointment
// Method:Get
// EndPoints:
const todayAppointment = async (req, res) => {
  try {
    const startOfDay = moment().startOf("day").toDate();
    const endOfDay = moment().endOf("day").toDate();

    const appointments = await Appointment.find({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    });

    return res.send({
      success: 1,
      message: "Today appointment fetched successfully",
      details: appointments,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//vendor upload report
//Method:Patch
//EndPoints:all-appointments/report/id
const uploadReport = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Appointment.findByIdAndUpdate(
      id,
      {
        report: `/vendor/report/${req.file.filename}`,
        status: 8
      },
      { new: true }
    );



    return res.send({
      success: 1,
      message: "Uploaded successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Search appointment
//Method:Get
//EndPoints:all-appointments/search
const searchVendor = async (req, res) => {
  try {
    const { q } = req.query;
    let query = {};

    if (q) {
      const regex = new RegExp(q, "i");
      query = {
        $or: [{ name: { $regex: regex } }],
      };
    }

    const search = await Appointment.find(query).sort({ createdAt: -1 });

    if (search.length === 0) {
      return res.send({
        success: 0,
        message: "No result found",
      });
    }

    return res.send({
      success: 1,
      message: "Results fetched successfully",
      details: search,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

const updateDocumentStatus = async (req, res) => {
  const updatedocument = await Vendor.updateMany({
    driverId: null,
  });
  return res.send({
    messsage: "Updated document",
    success: 0,
  });
};

// Assign driver
// Method:Patch
// EndPoints:all-appointments/assign
// type : 3 for pending report
const assignDriverToAppointment = async (req, res) => {
  try {
    const { driverId, appointmentId } = req.body;
    if (!driverId || !appointmentId) {
      return res.send({
        success: 0,
        message: "All fields are required",
      });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.send({
        success: 0,
        message: "Driver is not available",
      });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      {
        driverId: driverId,
        status: 3,
      },
      { new: true }
    );

    return res.send({
      success: 1,
      message: "Assigned successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};
 // all-appointments/getOrderWithDriver
const getOrderWithDrivers = async (req, res) => {
  try {
    const { orderId } = req.query;

    const order = await Appointment.findById(orderId)
      .populate("userId")
      .populate("driverId"); // ✅ include driver details

    if (!order) {
      return res.send({
        success: 0,
        message: "Order not found",
      });
    }

    return res.send({
      success: 1,
      message: "Order with driver fetched successfully",
      details: order,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// all-appointments/venorderHistory
const venorderHistory = async (req, res) => {
  try {
    const vendorId = req.user._id;

    // Get all orders that are either delivered (5) or rejected (6)
    const orders = await Appointment.find({
      vendorId,
      status: { $in: [ "8"] }, // 5 = Delivered, 6 = Rejected
    })
    .populate("userId") // Full user details
    .populate("vendorId") // Full vendor details
    .populate("driverId")
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
    }) // ✅ Add driver details (self)
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
      })       // driver info
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


module.exports = {
  getAllVendorAppointments,
  updateAppointmentStatus,
  updateDocumentStatus,
  todayAppointment,
  assignDriverToAppointment,
  getParticularAppointment,
  uploadReport,
  searchVendor,
  getHomeCollection,
  getOrderWithDrivers,
  venorderHistory
};
