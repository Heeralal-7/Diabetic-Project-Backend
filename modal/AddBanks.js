const { Schema, model } = require("mongoose");

const addBankSchema = Schema(
  {
    bankName: {
      type: String,
      default: "",
    },
    accountHolderName: {
      type: String,
      default: "",
    },
    accountNumber: {
      type: String,
      default: "",
    },
    ifsc: {
      type: String,
      default: "",
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model("AddBank", addBankSchema);
