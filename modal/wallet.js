const { Schema, model } = require("mongoose");

const walletSchema = Schema(
  {
    credit: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "",
    },
    deposit: {
      type: String,
      default: "",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please enter userId"],
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
  },
  { timestamps: true }
);

module.exports = model("wallet", walletSchema);
