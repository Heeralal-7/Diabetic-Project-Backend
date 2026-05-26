// models/labDeliveryCharges.js
const mongoose = require("mongoose");

const labDeliveryChargesSchema = new mongoose.Schema({
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
    default: 0
  },
  // NEW FIELDS FOR DISTANCE-BASED CHARGES
  freeDeliveryRadius: {
    type: Number,
    required: true,
    default: 10 // kilometers
  },
  perKmCharge: {
    type: Number,
    required: true,
    default: 5 // rupees per kilometer beyond free radius
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("labDeliveryCharges", labDeliveryChargesSchema);
