const { Schema, model } = require("mongoose");

const qualificationSchema = Schema(
  {
    qualification: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = model("Qualification", qualificationSchema);
