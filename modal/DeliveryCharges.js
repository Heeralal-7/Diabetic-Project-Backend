// models/DeliveryCharges.js
const mongoose = require("mongoose");

const DeliveryChargesSchema = new mongoose.Schema({
  baseDeliveryCharge: {
    type: Number,
    required: true,
    default: 50
  },
  freeDeliveryThreshold: {
    type: Number,
    required: true,
    default: 300
  },
  rapidDeliveryCharge: {
    type: Number,
    required: true,
    default: 100
  },
  taxPercentage: {
    type: Number,
    required: true,
    default: 2
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("DeliveryCharges", DeliveryChargesSchema);