const { Schema, model } = require("mongoose");

const servicesSchema = Schema(
  {
    // onstatus only 3
    // 0 = on hold
    // 1 = approved
    // 2 = rejected
    onStatus: {
      type: String,
      default: "0",
    },

    categoryName: {
      type: String,
      // enum: ["Allopathy", "Ayurvedic", "Prescription"],
      default: "",
    },
   
    name: {
      type: String,
      default: "",
    },
    manufacturers: {
      type: String,
      default: "",
    },
    saltComposition: {
      type: String,
      default: "",
    },
    packaging: {
      type: String,
      default: "",
    },
    primaryUse: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    saltSynonyms: {
      type: String,
      default: "",
    },
    storage: {
      type: String,
      default: "",
    },
    introduction: {
      type: String,
      default: "",
    },
    useOf: {
      type: String,
      default: "",
    },
    benefits: {
      type: String,
      default: "",
    },
    sideEffects: {
      type: String,
      default: "",
    },
    howToUse: {
      type: String,
      default: "",
    },
    howItWorks: {
      type: String,
      default: "",
    },
    safetyAdvice: {
      type: String,
      default: "",
    },
    ifMissed: {
      type: String,
      default: "",
    },
    alternativeAddress: {
      type: String,
      default: "",
    },
    manufacturingAddress: {
      type: String,
      default: "",
    },
    medicineType: {
      type: String,
      default: "",
    },
    quantity: {
      type: String,
      default: "",
    },
    price: {
      type: String,
      default: "",
    },
    bestPrice: {
      type: String,
      default: "",
    },
    discountPercentage: {
      type: String,
      default: "",
    },
    photo: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      default: "0",
    },
    prescription: {
      type: Boolean,
      default: false,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "vandor",
    },
  },
  { timestamps: true }
);

module.exports = new model("Services", servicesSchema);
