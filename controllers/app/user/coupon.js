const Coupon = require("../../../modal/Coupon");

//Get all dcotor and vendor coupon
//Method: Get
//Endpoints:/user-coupons/get-coupon
const getCoupons = async (req, res) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const coupons = await Coupon.find({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const couponcounts  = coupons.length
    return res.send({
      success: 1,
      message: "Fetched successfully",
      count :couponcounts,
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
