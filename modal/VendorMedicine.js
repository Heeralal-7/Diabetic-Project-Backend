const mongoose = require("mongoose");
 
const pharmacyMedicineSchema = new mongoose.Schema(
  {
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor", // your vendor model
      required: true,
    },
    stock: {
      type: Number,
      required: true,
    },
    discount_seller: {
      type: Number, // in percent
      default: 0,
    },
    vendorPrice: {
      type: String, // store as string to match bestPrice
      default: "0",
    },
 
    
  },
  { timestamps: true }
);
 
 
 
module.exports = mongoose.model("PharmacyMedicine", pharmacyMedicineSchema);
 
 