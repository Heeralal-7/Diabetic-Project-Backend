const { Schema, model } = require("mongoose");

const userMemberSchema = Schema({
  membershipId: {
    type: Schema.Types.ObjectId,
    ref: "MemberShip",
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  planName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  durationDays: {
    type: Number,
    required: true
  },
  // Doctor Consultation Logic
  consultationLimit: {
    type: Number,
    required: true
  },
  consultationsUsed: {
    type: Number,
    default: 0
  },
  
  // ✅ NEW: LAB DELIVERY LOGIC
  labDeliveryLimit: { type: Number, default: 0 },
  labDeliveriesUsed: { type: Number, default: 0 },

  // ✅ NEW: FOOD DELIVERY LOGIC
  foodDeliveryLimit: { type: Number, default: 0 },
  foodDeliveriesUsed: { type: Number, default: 0 },

  // ✅ NEW: PHARMACY DELIVERY LOGIC
  pharmacyDeliveryLimit: { type: Number, default: 0 },
  pharmacyDeliveriesUsed: { type: Number, default: 0 },

  pricePaid: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ["active", "expired", "cancelled"],
    default: "active"
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending"
  },
  paymentId: {
    type: String,
    default: ""
  },
  paymentDetails: {
    type: Object,
    default: {}
  },
  BloodSugar: {
    type: String,
    default: ""
  },
  AgeGroup: {
    type: String,
    default: ""
  },
  HadDiabetes: {
    type: String,
    default: ""
  },
  LifeStyle: {
    type: String,
    default: ""
  }
}, { timestamps: true });

module.exports = model("UserMemberShip", userMemberSchema);