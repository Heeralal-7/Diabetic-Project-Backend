// modal/CancellationSettings.js
const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const cancellationSettingsSchema = new Schema({
  food: {
    enabled: { type: Boolean, default: true },
    chargeType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    percentage: { type: Number, default: 10 },
    fixedAmount: { type: Number, default: 50 },
    applyAfterStatus: { type: String, default: '1' }
  },
  
  pharmacy: {
    enabled: { type: Boolean, default: true },
    chargeType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    percentage: { type: Number, default: 15 },
    fixedAmount: { type: Number, default: 75 },
    applyAfterStatus: { type: String, default: '1' }
  },
  
  lab: {
    enabled: { type: Boolean, default: true },
    chargeType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    percentage: { type: Number, default: 20 },
    fixedAmount: { type: Number, default: 100 },
    applyAfterStatus: { type: String, default: '1' }
  },
  
  doctor: {
    enabled: { type: Boolean, default: true },
    chargeType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    percentage: { type: Number, default: 25 },
    fixedAmount: { type: Number, default: 200 },
    applyAfterStatus: { type: String, default: '1' }
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = model('CancellationSettings', cancellationSettingsSchema);