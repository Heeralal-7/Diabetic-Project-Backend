const { Schema, model } = require("mongoose");

const appointmentSchema = Schema(
  {
    image: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      default: "",
    },
    yearOfBirth: {
      type: String,
      default: "",
    },
    phoneNumber: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    pinCode: {
      type: String,
      default: "",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model("AddMember", appointmentSchema);
