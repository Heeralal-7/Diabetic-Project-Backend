const { Schema, model } = require("mongoose");

const pickupSchema = Schema(
  {
    fixedPrice: {
      type: String,
      default: "",
    },
    fixedDistance: {
      type: String,
      default: "",
    },
    pricePerkm: {
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
  },
  { timestamps: true }
);

module.exports = model("Pickup", pickupSchema);
