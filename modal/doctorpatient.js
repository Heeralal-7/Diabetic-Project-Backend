const { Schema, model } = require("mongoose");

const doctorpatientSchema = Schema(
  {
    name: {
      type: String,
      default: "",
    },
    dob: {
      type: String,
      default: "",
    },
    phone: {
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
    country: {
      type: String,
      default: "",
    },
    state: {
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
    pic: {
      type: String,
      default: "",
    },
    problemDescription:{
      type:String
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = new model("DoctorPatient", doctorpatientSchema);
