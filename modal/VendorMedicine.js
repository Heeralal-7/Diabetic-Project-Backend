const mongoose = require("mongoose");
 
const pharmacyMedicineSchema = new mongoose.Schema({
  medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "vandor", required: true },
  stock: { type: Number, required: true },
  discount_seller: { type: Number, default: 0 },
  vendorPrice: { type: Number, required: true },
  sellingPrice: {
    type: String, // ग्राहक को दिखाई जाने वाली कीमत
    default: "0",
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  onStatus: { type: String, default: "0" },
  latitude: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "vandor",
  },
  longitude: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "vandor",
  },  // Or Number: 0 or 1
}, { timestamps: true });
module.exports = mongoose.model("PharmacyMedicine", pharmacyMedicineSchema);
 
 