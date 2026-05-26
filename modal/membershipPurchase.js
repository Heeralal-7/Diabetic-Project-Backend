const { Schema, model } = require("mongoose");

const membershipPurchaseSchema = Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  membershipId: {
    type: Schema.Types.ObjectId,
    ref: "MemberShip",
    required: true
  },
  planName: {
    type: String,
    required: true
  },
  durationDays: {
    type: Number,
    required: true
  },
  consultationLimit: {
    type: Number,
    required: true
  },
  // ✅ NEW FIELDS FOR SNAPSHOT
  labDeliveryLimit: { type: Number, default: 0 },
  foodDeliveryLimit: { type: Number, default: 0 },
  pharmacyDeliveryLimit: { type: Number, default: 0 },
  
  pricePaid: {
    type: Number,
    required: true
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
  }
}, { timestamps: true });

module.exports = model("MembershipPurchase", membershipPurchaseSchema);