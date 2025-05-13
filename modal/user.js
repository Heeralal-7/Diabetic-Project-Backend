const { Schema, model } = require("mongoose");
const User = Schema(
  {
    name: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    occupation: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      default: "",
    },
    diabteticType: {
      type: String,
      default: "",
    },
    diabeticduration: {
      type: String,
      default: "",
    },
    dailyactivity: {
      type: String,
      default: "",
    },
    bloodgroup: {
      type: String,
      default: "",
    },
    familyhistorydiabetic: {
      type: [String],
      default: [],
    },
    takingmedicines: {
      type: String,
      default: "",
    },

    caregiversname: {
      type: String,
      default: "",
    },
    relationship: {
      type: String,
      default: "",
    },
    caregiversnumber: {
      type: String,
      default: "",
    },
    caregiversdibtype: {
      type: String,
      default: "",
    },
    otherMedicalCondition: {
      type: [String],
      default: [],
    },

    dob: {
      type: String,
      default: "",
    },
    otp: {
      type: String,
      default: "",
    },
    number: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    age: {
      type: String,
      default: "",
    },
    birthyear: {
      type: String,
      default: "",
    },
    ctrCode: {
      type: String,
    },
    token: {
      type: String,
      default: "",
    },
    verified: {
      type: String,
      default: false,
    },
    couponApplied: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
    },
    redeem: {
      type: String,
      default: "0",
    },
    weight: {
      type: String,
      default: "",
    },
    height: {
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
      ref: "Vandor",
      default: null,
    },
    referralCode: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    partnerCode:{
      type:String,
      default:""
    }
  },
  {
    timestamps: true,
  }
);

module.exports = model("User", User);
