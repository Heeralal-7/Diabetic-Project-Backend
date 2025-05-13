const { Schema, model } = require("mongoose");

const availableSchema = Schema(
  {
    day: {
      type: String,
      default: "",
    },
    startTime: {
      type: String,
      default: "",
    },
    endTime: {
      type: String,
      default: "",
    },
    startDate: {
      type: String,
      default: "",
    },
    endDate: {
      type: String,
      default: "",
    },
    slotTime: {
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
  },

  { timestamps: true }
);

module.exports = model("Available", availableSchema);
