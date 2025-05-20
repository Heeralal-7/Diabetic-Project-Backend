const mongoose = require("mongoose");
 
const pharmacyProductsSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PharmacyProduct", // यह आपकी Product model को रेफर करेगा
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor", // Vendor model को रेफर करेगा
      required: true,
    },
    stock: {
      type: Number,
      required: true,
    },
    discount_seller: {
      type: Number, // प्रतिशत में छूट
      default: 0,
    },
    vendorPrice: {
      type: String, // स्ट्रिंग फॉर्म में ताकि आप decimal prices handle कर सको
      default: "0",
    },
    sellingPrice: {
      type: String, // ग्राहक को दिखाई जाने वाली कीमत
      default: "0",
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);
 
module.exports = mongoose.model("PharmacyProductVendor", pharmacyProductsSchema);
 
 