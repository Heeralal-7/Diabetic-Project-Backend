const Coupon = require("../../../../modal/Coupon");
const moment = require("moment");
const Test = require("../../../../modal/addTest");

const checkCoupon = async (userId) => {
  try {
    const checkIt = await Coupon.find({ vendorId: userId });
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
//Endpoint:/apply/coupon
const applyCouponUser = async (req, res) => {
  try {
    const { couponCode, vendorId, price } = req.body;
    await checkCoupon(vendorId);

    // const numericPrice = Number(price);

    const coupon = await Coupon.findOne({
      $and: [{ vendorId }, { couponCode }],
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

    let discountedPrice = price;

    if (coupon.percentageDiscount) {
      const discountPercentage = parseFloat(
        coupon.percentageDiscount.split("%")[0]
      );
      discountedPrice = price - price * (discountPercentage / 100);
    } else if (coupon.fixedAmountDiscount) {
      const fixedDiscount = parseFloat(coupon.fixedAmountDiscount);
      discountedPrice = price - fixedDiscount;
    }
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

module.exports = { applyCouponUser };
