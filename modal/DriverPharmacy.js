const { Schema, model } = require("mongoose");
 
const driverPharmacySchema = Schema(
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
      default: "",
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
    isOnline: {
      type: Boolean,
      default: false,
    },
    isBusy: {
      type: Boolean,
      default: false,
    },
    dateSlot: {
      type: Schema.Types.ObjectId,
      ref: "OrderPharmacy",
    },
  },
  { timestamps: true }
);
 
module.exports = model("DriverPharmacy", driverPharmacySchema);
 
 