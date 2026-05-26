// models/CutoffSettings.js
const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const cutoffSettingsSchema = new Schema(
  {
    foodCutoff: {
      type: Number,
      default: 5,
      min: 0,
      max: 100
    },
    pharmacyCutoff: {
      type: Number,
      default: 5,
      min: 0,
      max: 100
    },
    labCutoff: {
      type: Number,
      default: 5,
      min: 0,
      max: 100
    },
    doctorCutoff: {
      type: Number,
      default: 5,
      min: 0,
      max: 100
    },
    clinicCutoff: {  // ✅ CLINIC CUTOFF ADD KIYA
      type: Number,
      default: 5,
      min: 0,
      max: 100
    },
     membershipCutoff: {  // ✅ NEW: Membership cutoff add kiya
    type: Number,
    default: 20,  // Default 20% for membership plans
    min: 0,
    max: 100
  },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

module.exports = model("CutoffSettings", cutoffSettingsSchema);