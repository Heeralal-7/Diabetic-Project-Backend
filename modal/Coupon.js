const { Schema, model } = require("mongoose");
const moment = require("moment");

const couponSchema = Schema(
  {
    couponCode: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    percentageDiscount: {
      type: String,
      default: "",
    },
    fixedAmountDiscount: {
      type: String,
      default: "",
    },
    couponApplied: {
      type: String,
      default: "",
    },
    limitRedeem: {
      type: String,
      default: "",
    },
    startDate: {
      type: String,
      default: "",
    },
    expireDate: {
      type: String,
      default: "",
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "vandor",
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
    },
    status: {
      type: String,
      default: "1",
    },
  },
  { timestamps: true }
);

const Coupon = model("Coupon", couponSchema);
module.exports = Coupon;
