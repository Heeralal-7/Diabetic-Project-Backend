const { Schema, model } = require("mongoose");

const tempSchema = Schema(
  {
    email: {
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
module.exports = model("TempEmail", tempSchema);
