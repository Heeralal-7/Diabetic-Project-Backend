const mongoose = require("mongoose");
 
const serviceSchema = new mongoose.Schema(
  {
    categoryName: { type: String, required: true },
    name: { type: String, required: true },
    manufacturers: { type: String, required: true },
    saltComposition: { type: String, required: true },
    packaging: { type: String, required: true },
    primaryUse: { type: String, required: true },
    description: { type: String, required: true },
    saltSynonyms: { type: String, required: true },
    storage: { type: String, required: true },
    introduction: { type: String, required: true },
    useOf: { type: String, required: true },
    benefits: { type: String, required: true },
    sideEffects: { type: String, required: true },
    howToUse: { type: String, required: true },
    howItWorks: { type: String, required: true },
    safetyAdvice: { type: String, required: true },
    ifMissed: { type: String, required: true },
    alternativeAddress: { type: String, required: true },
    manufacturingAddress: { type: String, required: true },
    medicineType: { type: String, required: true },
    stock: { type: Number, required: true },
    mrp: { type: Number, required: true },
    bestPrice: { type: Number, required: true },
    discountPercentage: { type: Number, required: true },
    prescription: { type: Boolean, required: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
    photo: [{ type: String }],
    onStatus: { type: String, enum: ["0", "1"], default: "0" },
  },
  {
    timestamps: true,
  }
);
 
module.exports = mongoose.model("Service", serviceSchema);
 
 