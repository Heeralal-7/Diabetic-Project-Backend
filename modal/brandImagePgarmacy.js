const mongoose = require('mongoose');
 
const BrandSchema = new mongoose.Schema({
  brandName: {
    type: String,
    required: false,
    trim: true,
    default: ""
  },
  brandImage: {
    type: String,
    required: true
  },
  imageType: {
    type: String,
    enum: ['upload', 'url'],
    default: 'upload'
  },
  isExternal: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });
 
module.exports = mongoose.model('BrandImagePharmacy', BrandSchema);
 