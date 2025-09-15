const mongoose = require("mongoose");
 
const cartSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "vandor", required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "PharmacyProduct" },
  medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine" },
  quantity: { type: Number, default: 1 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  pricePerUnit: { type: Number },
  discountPercent: { type: Number },
  estimatedTax: { type: Number, default: 0 },
  estimatedDeliveryCharge: { type: Number, default: 0 },
  estimatedPlatformCharge: { type: Number, default: 0 },
}, {
  timestamps: true,
  // Modified validation to be more flexible
  validate: {
    validator: function() {
      // Either productId or medicineId must exist, but not both
      return (this.productId || this.medicineId) && !(this.productId && this.medicineId);
    },
    message: 'Cart item must have either a productId or medicineId, but not both'
  }
});
 
module.exports = mongoose.model("CartPharmacy", cartSchema);
 