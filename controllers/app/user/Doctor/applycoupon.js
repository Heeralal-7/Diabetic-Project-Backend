const Coupon = require("../../../../modal/Coupon");
const moment = require("moment");

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

//User apply coupon
//Method:Post
//Endpoint:/user-applycoupon/apply
const applyCoupon = async (req, res) => {
  try {
    const { couponCode, doctorId, price } = req.body;
    await checkCoupon(doctorId);

    // const numericPrice = Number(price);

    const coupon = await Coupon.findOne({
      $and: [{ doctorId }, { couponCode }],
    });

    if (!coupon) {
      return res.send({
        success: 0,
        message: "Coupon not found",
      });
    }

    const currentDate = new Date();
    if (coupon.expiryDate < currentDate) {
      return ressend({
        success: 0,
        message: "Coupon is expired",
      });
    }

    const discountAmount = coupon.percentageDiscount.split("%")[0];

    const discountedPrice = price - price * (discountAmount / 100);

    return res.send({
      success: 1,
      message: "Applied successfully",
      originalPrice: price,
      discountedPrice,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = { applyCoupon };
