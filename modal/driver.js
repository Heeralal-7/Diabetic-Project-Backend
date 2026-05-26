const { Schema, model } = require("mongoose");

const driverSchema = Schema(
  {
    name: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    ctrCode: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    serviceType: {
      type: String,
      default: "",// [Pharmacy,Food,Lab]
    },
    token: {
      type: String,
      default: "",
    },

    phoneNumber: {
      type: String,
      default: "",
    },
    qualification: {
      type: String,
      default: "",
    },
    vehicleNumber: {
      type: String,
      default: "",
    },
    vehicleType: {
      type: String,
      default: "",
    },
    licenceNumber: {
      type: String,
      default: "",
    },
    aadharCard: {
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
    certificate: {
      type: String,
      default: "",
    },
    drivingLicenceNumber: {
      type: String,
      default: "",
    },
    rc: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      default: "",
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "vandor",
    },
    status: {
      type: String,
      default: "0",
    },
    token: {
      type: String,
      default: "",
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    isBusy: {
      type: Boolean,
      default: false,
    },
    
  },
  { timestamps: true }
);

module.exports = model("Driver", driverSchema);
