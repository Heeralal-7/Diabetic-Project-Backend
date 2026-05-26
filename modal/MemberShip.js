const { Schema, model } = require("mongoose");

const membershipSchema = Schema({
  planName: {
    type: String,
    required: true,
    default: ""
  },
  description: {
    type: String,
    default: ""
  },
  durationDays: {
    type: Number,
    required: true,
    default: 30
  },
  consultationLimit: {
    type: Number,
    required: true,
    default: 10
  },
  // ✅ NEW FIELDS FOR FREE DELIVERY LIMITS
  labDeliveryLimit: {
    type: Number,
    default: 0 // 0 means no free deliveries
  },
  foodDeliveryLimit: {
    type: Number,
    default: 0
  },
  pharmacyDeliveryLimit: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  features: {
    type: [String],
    default: []
  },
  discountPercentage: {
    type: Number,
    default: 0
  },
  BloodSugar: {
    type: [String],
    default: []
  },
  AgeGroup: {
    type: [String],
    default: []
  },
  HadDiabetes: {
    type: [String],
    default: []
  },
  LifeStyle: {
    type: [String],
    default: []
  },
  // Discount Matrix Structure
  discountMatrix: {
    type: Object,
    default: {}
  },
  showDiscounts: {
    type: Boolean,
    default: true
  },
  adminId: {
    type: Schema.Types.ObjectId,
    ref: "Admin",
    required: true
  }
}, { timestamps: true });

module.exports = model("MemberShip", membershipSchema);