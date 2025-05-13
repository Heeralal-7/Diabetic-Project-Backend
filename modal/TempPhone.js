const { Schema, model } = require("mongoose");

const tempPhoneSchema = Schema(
  {
    phone: {
      type: String,
      default: "",
    },
    ctrcode: {
      type: String,
      default: "",
    },
    otp: {
      type: String,
      default: "",
    },
  },
  {
    Timestamp: true,
  }
);
module.exports = model("TempPhone", tempPhoneSchema);
