const Coupon = require("../../../modal/Coupon");
const moment = require("moment");
const Doctor = require("../../../modal/docter");

// Check Coupon is expired or not
const checkCoupon = async (userId) => {
  try {
    const checkIt = await Coupon.find({ doctorId: userId });
    const currentDate = moment();

    for (const coupon of checkIt) {
      const expireDate = moment(coupon.expireDate, "DD/MM/YYYY");

      if (expireDate.isAfter(currentDate)) {
        if (coupon.status !== "1") {
          await Coupon.findByIdAndUpdate(coupon._id, { status: "1" });
          // console.log(`Coupon ${coupon._id} status updated to 1.`);
        }
      } else {
        if (coupon.status !== "2") {
          await Coupon.findByIdAndUpdate(coupon._id, { status: "2" });
          // console.log(`Coupon ${coupon._id} status updated to 2.`);
        }
      }
    }
  } catch (error) {
    console.log("Error:", error.message);
  }
};

// Create coupon
// Method:post
// EndPoints:/doctor-coupon/create
const createCouponOfDoctor = async (req, res) => {
  try {
    const {
      couponCode,
      description,
      percentageDiscount,
      fixedAmountDiscount,
      couponApplied,
      limitRedeem,
      startDate,
      expireDate,
    } = req.body;

    console.log(req.body);

    if (
      !couponCode ||
      !description ||
      !couponApplied ||
      !limitRedeem ||
      !startDate ||
      !expireDate
    ) {
      return res.send({
        success: 0,
        message: "Please enter all the required fields ",
      });
    }

    const doctor = await Doctor.find(req.user._id);
    if (!doctor) {
      return res.send({
        success: 0,
        message: "Not found",
      });
    }

    const newCoupon = await Coupon.create({
      couponCode,
      description,
      percentageDiscount,
      fixedAmountDiscount,
      couponApplied,
      limitRedeem,
      startDate,
      expireDate,
      doctorId: req.user._id,
    });

    return res.send({
      success: 1,
      message: "Coupon created successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Get All coupon of Doctor
// Method:Get
// EndPoints:/doctor-coupon/all
const getCouponOfDoctor = async (req, res) => {
  try {
    await checkCoupon(req.user._id);

    const findVendorCoupon = await Coupon.find({
      doctorId: req.user._id
    });

    if (!findVendorCoupon || findVendorCoupon.length === 0) {
      return res.send({
        success: 0,
        message: "No Coupon found",
      });
    }

    return res.send({
      success: 1,
      message: "Coupon fetched successfully",
      details: findVendorCoupon,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};


// Get all coupon according to status
// Method:get
// Endpoints:/doctor-coupon/coupon
// Status 1 for ongoing and 2 for close
const acceptCloseCouponOfDoctor = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {
      $and: [
        { doctorId: req.user._id },
        { status: status == "1" ? "1" : status == "2" ? "2" : "1" },
      ],
    };
    const vendor = await Coupon.find(query);

    return res.send({
      success: 1,
      message: `Coupon ${
        status == 1 ? "Ongoing" : "Expired"
      } Fetched successfully`,
      coupon: vendor,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.messsage,
    });
  }
};

// Delete Coupon of Doctor
// Method:delete
// Endpoints:/doctor-coupon/delete/:id
const deleteCouponOfDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    
    const coupon = await Coupon.findOne({ _id: id, doctorId: req.user._id });
    if (!coupon) {
      return res.send({
        success: 0,
        message: "Coupon not found or not authorized",
      });
    }

    
    await Coupon.findByIdAndDelete(id);

    return res.send({
      success: 1,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Edit Coupon of Doctor
// Method:put
// Endpoint:/doctor-coupon/edit/:id
const editCouponOfDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    // coupon exist करता है या नहीं + उसी doctor का है या नहीं check करो
    const coupon = await Coupon.findOne({ _id: id, doctorId: req.user._id });
    if (!coupon) {
      return res.send({
        success: 0,
        message: "Coupon not found or not authorized",
      });
    }

    // जिन fields को update करना है वो body से लो
    const {
      couponCode,
      description,
      percentageDiscount,
      fixedAmountDiscount,
      couponApplied,
      limitRedeem,
      startDate,
      expireDate,
    } = req.body;

    // update करो
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id,
      {
        couponCode,
        description,
        percentageDiscount,
        fixedAmountDiscount,
        couponApplied,
        limitRedeem,
        startDate,
        expireDate,
      },
      { new: true } // return updated document
    );

    return res.send({
      success: 1,
      message: "Coupon updated successfully",
      details: updatedCoupon,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

// Expire Coupon of Doctor (Force expire)
// Method:put
// Endpoint:/doctor-coupon/expire/:id
const expireCouponOfDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    // पहले check करें कि coupon exist करता है और उसी doctor का है
    const coupon = await Coupon.findOne({ _id: id, doctorId: req.user._id });
    if (!coupon) {
      return res.send({
        success: 0,
        message: "Coupon not found or not authorized",
      });
    }

    // status को 2 कर दो (Expired)
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id,
      { status: "2" },
      { new: true }
    );

    return res.send({
      success: 1,
      message: "Coupon expired successfully",
      details: updatedCoupon,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = {
  createCouponOfDoctor,
  getCouponOfDoctor,
  acceptCloseCouponOfDoctor,
  deleteCouponOfDoctor,
  editCouponOfDoctor,
  expireCouponOfDoctor,
  editCouponOfDoctor,
};
