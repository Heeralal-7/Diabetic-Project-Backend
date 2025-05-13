const { Schema, model } = require("mongoose");

const prescribeSchema = Schema(
  {
    adviceInvestigation: {
      type: String,
      default: "",
    },
    anyAdvice: {
      type: String,
      default: "",
    },
    specialInstruction: {
      type: String,
      default: "",
    },
    nextAppointment: {
      type: String,
      default: "",
    },
    medicineName: {
      type: String,
      default: "",
    },
    morning: {
      type: String,
      default: "",
    },
    afternoon: {
      type: String,
      default: "",
    },
    evening: {
      type: String,
      default: "",
    },
    days: {
      type: String,
      default: "",
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = model("Prescribe", prescribeSchema);
