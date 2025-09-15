const { Schema, model } = require("mongoose");

const tempOtpSchema = new Schema(
  {
    otp: {
      type: String,
      default: "",
    },
    number: {
      type: String,
      default: "",
    },
    ctrCode: {
      type: String,
      default: "",
    },
    referralCode: {
      type: String,
      default: "",
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "vandor",
      default: null,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      default: null,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
 
  },
  { timestamps: true }
);

module.exports = model("TempOtp", tempOtpSchema);
