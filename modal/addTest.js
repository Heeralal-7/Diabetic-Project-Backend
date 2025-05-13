const { Schema, model } = require("mongoose");

const addTestSchema = Schema(
  {
    testCategory: {
      type: String,
      default: "",
    },
    testName: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    organ:{
      type:String,
      default:""
    },
    precautions: {
      type: String,
      default: "",
    },
    testType: {
      type: String,
      default: "",
    },
    discountedAmount:{
      type:String,
      default:""
    },
    sampleRequired: {
      type: String,
      default: "",
    },
    sampleCollected: {
      type: String,
      default: "",
    },
    other: {
      type: String,
      default: "",
    },
    amount: {
      type: String,
      default: "",
    },
    discountPercentage: {
      type: String,
      default: "",
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "vandor",
    },
    vendorType: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "0",
    },
    prescription: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = model("Addtest", addTestSchema);
