// modal/footerContent.js
const mongoose = require("mongoose");
 
const footerContentSchema = new mongoose.Schema({
  privacyPolicy: {
    type: String,
  },
  termsAndConditions: {
    type: String,
  },
 
  // Section 1
  easyHeading: { type: String },
  easyContent: { type: String },
  easyIcon: { type: String },
 
  // Section 2
  affordableHeading: { type: String },
  affordableContent: { type: String },
  affordableIcon: { type: String },
 
  // Section 3
  accessibleHeading: { type: String },
  accessibleContent: { type: String },
  accessibleIcon: { type: String },
 
  // ✅ Multiple Banks Logo Field
  banksLogos: [{
    url: {
      type: String,
      required: true
    },
    name: {
      type: String,
      default: ""
    },
    order: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
 
}, {
  timestamps: true
});
 
module.exports = mongoose.model("footerContent", footerContentSchema);
 