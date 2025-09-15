const AddMembers = require("../../../modal/AddMembers");
const Addtest = require("../../../modal/addTest");
const Availability = require("../../../modal/availability");
const moment = require("moment");
const Package = require("../../../modal/AddPackages");
const Vendor = require("../../../modal/vandor");
const Appointment = require("../../../modal/Appointment");

// Add member in appointment
// Method:
// EndPoint // /member/member

const addMembersInAppointment = async (req, res) => {
  try {
    const {
      name,
      yearOfBirth,
      phoneNumber,
      gender,
      address,
      city,
      pinCode,
      userId,
      vendorId,
      AppointmentId,
      addtestId,
      AddPackageId,
    } = req.body;

    // Validation
    if (
      !name ||
      !yearOfBirth ||
      !phoneNumber ||
      !gender ||
      !address ||
      !city ||
      !pinCode
    ) {
      return res.send({
        success: 0,
        message: "Please enter all the required fields",
      });
    }

    // Image path if uploaded
    const image = req.file ? `/vendor/driver/image/${req.file.filename}` : "";

    // Ensure arrays
    const addtestArray = Array.isArray(addtestId) ? addtestId : addtestId ? [addtestId] : [];
    const addPackageArray = Array.isArray(AddPackageId) ? AddPackageId : AddPackageId ? [AddPackageId] : [];

    // Create member
    const newMember = await AddMembers.create({
      image,
      name,
      yearOfBirth,
      phoneNumber,
      gender,
      address,
      city,
      pinCode,
      userId,
      vendorId,
      addtestId: addtestArray,
      AddPackageId: addPackageArray,
      AppointmentId: AppointmentId || null,
    });

    // If AppointmentId is provided, update the corresponding appointment
    if (AppointmentId) {
      await Appointment.findByIdAndUpdate(AppointmentId, {
        AddMemberId: newMember._id,
      });
    }

    return res.send({
      success: 1,
      message: "Member added successfully",
      data: newMember,
    });

  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};



// member/getVendorTest
const getVendorTest = async (req, res) => {
  try {
    const { id } = req.query;

    const data = await Addtest.find({ vendorId: id });

    return res.send({
      success: 1,
      message: "fetched",
      details: data,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// member/getpackages
const getpackages = async (req, res) => {
  try {
    const { id } = req.query;
    const { page = 1, limit = 10 } = req.query;

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.send({
        success: 0,
        message: "Vendor not registered yet",
      });
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const data = await Package.find({ vendorId: vendor._id })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    return res.send({
      success: 1,
      details: data,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//   member/getmember
const getmember = async (req, res) => {
  try {
    const { AppointmentId } = req.body;

    // Filter by AppointmentId if provided
    const filter = AppointmentId ? { AppointmentId } : {};

    const data = await AddMembers.find(filter)
      .populate({ path: "userId", model: "User" })
      .populate({ path: "vendorId", model: "vandor" }) // Capital 'V' if model is 'Vandor'
      .populate({ path: "addtestId", model: "Addtest" })
      .populate({ path: "AddPackageId", model: "AddPackage" })
      .populate({ path: "AppointmentId", model: "Appointment" })
      .sort({ createdAt: -1 }); // Newest first

    return res.send({
      success: 1,
      message: "Member data fetched successfully",
      data,
    });

  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};


//    member/createprice
const createprice = async (req, res) => {
  try {
    const { id, AppointmentId, price } = req.body;

    // Validation
    if (!id || !AppointmentId || !price) {
      return res.send({
        success: 0,
        message: "AddMember ID, Appointment ID, and price are required",
      });
    }

    // Update the AddMember document
    const updatedMember = await AddMembers.findByIdAndUpdate(
      id,
      {
        AppointmentId,
        price,
      },
      { new: true } // return updated document
    );

    if (!updatedMember) {
      return res.send({
        success: 0,
        message: "AddMember not found",
      });
    }

    return res.send({
      success: 1,
      message: "Price and appointment ID updated successfully",
      data: updatedMember,
    });

  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = { addMembersInAppointment,getVendorTest,getpackages,getmember,createprice };
