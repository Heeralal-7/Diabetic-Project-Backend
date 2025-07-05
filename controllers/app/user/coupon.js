const Coupon = require("../../../modal/Coupon");

//Get all dcotor and vendor coupon
//Method: Get
//Endpoints:/user-coupons/get-coupon
const getCoupons = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.send({
        success: 0,
        message: "ID is required",
      });
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const filter = {
      createdAt: { $gte: startDate, $lte: endDate },
      $or: [
        { doctorId: id },
        { vendorId: id },
        { pharmacyId: id }
      ]
    };

    const coupons = await Coupon.find(filter);
    const couponcounts = coupons.length;

    return res.send({
      success: 1,
      message: "Fetched successfully",
      count: couponcounts,
      data: coupons,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};


module.exports = { getCoupons };
