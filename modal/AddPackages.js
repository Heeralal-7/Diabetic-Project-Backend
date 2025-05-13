const { Schema, model } = require("mongoose");

const addPackageSchema = Schema(
  {
    packageName: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    precautions: {
      type: String,
      default: "",
    },
    testType: {
      type: [String],
      default: [],
    },
    sampleRequired: {
      type: [String],
      default: [],
    },
    sampleCollected: {
      type: [String],
      default: [],
    },
    addTest: {
      type: [String],
      default: [],
    },
    amount: {
      type: String,
      default: "",
    },
    method:{
      type:String,
      default:""
    },

    discountPercentage: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "0",
    },
    discountedAmount:{
      type:String,
      default:""
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "vandor",
    },
  },
  { timestamps: true }
);

module.exports = model("AddPackage", addPackageSchema);
