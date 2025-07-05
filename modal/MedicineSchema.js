const mongoose = require("mongoose");
// const pharmacyMedicineSchema = require("./VendorMedicine");
 
const MedicineSchema = new mongoose.Schema({
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
  },
  discount_seller: {
    type: Number, // percentage
    default: 0,
  },
 
  bestPrice: String,
 
 
    // ⭐ New Fields (as per your request)
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviews: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        comment: String,
        rating: { type: Number, min: 1, max: 5 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    boughtParameter: {
      type: Number,
      default: 0, // how many times bought
    },
    expectedDelivery: {
      type: String, // e.g. "2-4 days"
      default: "3-5 Days",
    },
          popularCategory: {
    type: Boolean,
    default: false
  },
  orderCount: {
    type: Number,
    default: 0
  },
 
 
}, {
  timestamps: true
});
 
module.exports = mongoose.model("Medicine", MedicineSchema);
 
 