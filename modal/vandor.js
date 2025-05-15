const { Schema, model } = require("mongoose");

const VendorSchema = new Schema(
  {
    name: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    altrphone: {
      type: String,
      default: "",
    },
    ctrcode: {
      type: String,
      default: "",
    },
    altphnctrcode: {
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
    address: {
      type: String,
      default: "",
    },
    vendor: {
      type: String,
      default: "",
    },
    business: {
      type: String,
      default: "",
    },
    registrationcert: {
      type: String,
      default: "",
    },
    licencenum: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      default: "",
    },
    confirmpass: {
      type: String,
      default: "",
    },
    phnOtp: {
      type: String,
      default: "",
    },
    emailOtp: {
      type: String,
      default: "",
    },
    token: {
      type: String,
      default: "",
    },
    verify: {
      type: Boolean,
      default: false,
    },
    banner: {
      type: String,
      default: "",
    },
    labName: {
      type: String,
      default: "",
    },
    myDocumentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },
    addtestId: {
      type: Schema.Types.ObjectId,
      ref: "Addtest",
      default: null,
    },
    avaibilityId: {
      type: Schema.Types.ObjectId,
      ref: "Available",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    latitude: {
      type: String,
      default: "",
    },
    longitude: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = model("vandor", VendorSchema);
