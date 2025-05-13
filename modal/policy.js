const { Schema, model } = require("mongoose");

const policySchema = new Schema(
  {
    privacyPolicy: {
      type: String,
      default: "",
    },
    termsAndCondition: {
      type: String,
      default: "",
    },
    aboutUs: {
      type: String,
      default: "",
    },
    paymentPolicy: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      
      default: "",
    },
    whypres:{
      type:String,
      default:""
    }
  },
  { timestamps: true }
);

module.exports = model("Policy", policySchema);
