const Coupon = require("../../../../modal/Coupon");

//get vendor coupon
//Method:Get
//Endpoint:/vendor-coupon/getcoupon/id
const getCoupon = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await Coupon.find({ vendorId: id });
    if (!data) {
      return res.send({
        success: 0,
        message: "Coupon is not available",
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

const searchVendorCoupon = async (req, res) => {
  try {
    const { q, vendorId } = req.query;
    let query = {};
    if (q) {
      const regex = new RegExp(q, "i");
      query = {
        $and: [
          { vendorId },
          {
            $or: [
              { couponCode: { $regex: regex } },
              { description: { $regex: regex } },
              { startDate: { $regex: regex } },
              { expireDate: { $regex: regex } },
              { percentageDiscount: { $regex: regex } },
              { limitRedeem: { $regex: regex } },
            ],
          },
        ],
      };
    }
    const search = await Coupon.find(query);

    if (!search) {
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
module.exports = { getCoupon, searchVendorCoupon };
