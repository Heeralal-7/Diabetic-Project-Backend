const { Schema, model } = require("mongoose");

const privacySchema = new Schema(
  {
    privacyPolicy: {
      type: String,
      default: "",
    },
    termsAndCondition: {
      type: String,
      default: "",
    },
    aboutUs: {
      type: String,
    },
    paymentPolicy: {
      type: String,
    },
  },
  { new: true }
);

module.exports = model("Privacy", privacySchema);
