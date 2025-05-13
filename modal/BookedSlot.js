const { Schema, model } = require("mongoose");

const bookedSchema = Schema(
  {
    startTime: {
      type: String,
      default: "",
    },

    startDate: {
      type: String,
      default: "",
    },

    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    day: {
      type: String,
      default: "",
    },
    price: {
      type: String,
      default: "",
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
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },
    expireAt: {
      type: Date,
      default: function () {
        return new Date(Date.now() + 24 * 60 * 60 * 1000);
      },
    },
  },
  {
    Timestamp: true,
  }
);
module.exports = model("BookedSlot", bookedSchema);
