const { Schema, model } = require("mongoose");

const historySchema = Schema(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      default: null,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "vandor",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = model("History", historySchema);
