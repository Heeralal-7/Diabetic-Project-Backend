const { Schema, model } = require("mongoose");

const banksSchema = Schema(
  {
    name: {
      type: String,
      default: "",
    },
    code: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model("Banks", banksSchema);
