const Appointment = require("../../../../modal/Appointment");
const Vendor = require("../../../../modal/vandor");
const moment = require("moment");

const Driver = require("../../../../modal/driver");

const Document = require("../../../../modal/Document");

// Get All Vendor Appointments
// Method:Get
// EndPoints:/
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
    const { type, appointmentId } = req.body;

    // Find and update the appointment status
    const updatedAppointment = await Appointment.findOneAndUpdate(
      { _id: appointmentId, vendorId: req.user._id },
      { status: type },
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

    if (status === undefined || ![0, 1, 2, 3].includes(parseInt(status))) {
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
        status: 3
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

module.exports = {
  getAllVendorAppointments,
  updateAppointmentStatus,
  updateDocumentStatus,
  todayAppointment,
  assignDriverToAppointment,
  getParticularAppointment,
  uploadReport,
  searchVendor,
};
