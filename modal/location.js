// models/Location.js
const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['country', 'state', 'city', 'area'],
    required: true
  },
  code: {
    type: String,
    unique: true,
    sparse: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    default: null
  },
  hierarchy: {
    country: String,
    state: String,
    city: String,
    area: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  metadata: {
    population: Number,
    timezone: String,
    language: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

// ✅ Indexes for better performance
locationSchema.index({ type: 1, parent: 1 });
locationSchema.index({ 'hierarchy.country': 1, 'hierarchy.state': 1, 'hierarchy.city': 1 });
locationSchema.index({ code: 1 }, { unique: true, sparse: true });

// ✅ Virtual for full address
locationSchema.virtual('fullAddress').get(function() {
  const parts = [];
  if (this.hierarchy.area) parts.push(this.hierarchy.area);
  if (this.hierarchy.city) parts.push(this.hierarchy.city);
  if (this.hierarchy.state) parts.push(this.hierarchy.state);
  if (this.hierarchy.country) parts.push(this.hierarchy.country);
  return parts.join(', ');
});

module.exports = mongoose.model('Location', locationSchema);