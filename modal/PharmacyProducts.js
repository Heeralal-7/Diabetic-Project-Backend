// models/PharmacyProducts.js
const mongoose = require('mongoose');
 
const hospitalProductVendorSchema = new mongoose.Schema({
    Id: String,
    bread_crumb: String,
    url: String,
    name: String,
    manufacturers: String,
    salt_composition: String,
    packaging: String,
    mrp: String,
    best_price: String,
    discont_percent: String,
    prescription_required: String,
    image_url: String,
    primary_use: String,
    description: String,
    salt_synonyms: String,
    storage: String,
    introduction: String,
    use_of: String,
    benefits: String,
    side_effect: String,
    how_to_use: String,
    how_works: String,
    safety_advise: String,
    if_miss: String,
    alternate_brand: String,
    manufacturer_address: String,
    for_sale: String,
    stock: {
      type: Number,
    //   required: true,
    },
    discount_seller: {
      type: Number, // percentage
      default: 0,
    },
  
    bestPrice: String,
   
  }, {
    timestamps: true
  });
 
const PharmacyProduct = mongoose.model('PharmacyProduct', hospitalProductVendorSchema);
 
module.exports = PharmacyProduct;
 