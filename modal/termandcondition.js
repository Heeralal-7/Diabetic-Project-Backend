const { Schema, model } = require("mongoose");

const termSchema = Schema(
  {
    termCondition: {
      type: String,
      default: "",
    },
  },
  { new: true }
);

module.exports = model("Term", termSchema);
