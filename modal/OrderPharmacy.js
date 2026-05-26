const { Schema, model } = require('mongoose');
const mongoose = require('mongoose');
 
const orderItemSchema = new Schema({
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: 'PharmacyProduct' },
    medicineId: { type: Schema.Types.ObjectId, ref: 'PharmacyMedicine' },
    itemName: String,
    productName: String,
    vendorId: { type: Schema.Types.ObjectId, ref: 'vandor' },
    vendorName: String,
    quantity: Number,
    unitPrice: Number,
    vendorPrice: Number,  
    discount: Number,
    totalPrice: Number,
    itemType: String
  }],
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  status: { type: Number, default: 0 },
  driverAssignedId: { type: Schema.Types.ObjectId, ref: 'Driver' },
  address: String,
  timeSlot: String,
  dateSlot: String,
  addressId: { type: Schema.Types.ObjectId, ref: 'Patient' },
  
  // Patient details
  patientDetails: {
    name: { type: String, default: "" },
    phone: { type: String, default: "" },
    gender: { type: String, default: "" },
    dob: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pinCode: { type: String, default: "" },
    country: { type: String, default: "" },
    pic: { type: String, default: "" },
    latitude: { type: Number },
    longitude: { type: Number }
  },
  
  // ✅ Added Prescription Image Field
  prescriptionImage: { type: String, default: "" },

  coupon: {
    id: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    code: String,
    discountType: String,
    discountValue: Number,
    description: String
  },
  subTotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  deliveryCharges: { type: Number, required: true },
  rapidDeliveryFee: { type: Number, default: 0 },
  isRapidDelivery: { type: Boolean, default: false },
  grandTotal: { type: Number, required: true },
  orderStatus: { type: String, default: 'confirmed' },
  vendorAcceptedAt: Date,
  expectedDeliveryTime: Date,
  rejectionReason: String,
  vendorId: { type: Schema.Types.ObjectId, ref: 'vandor' },
  cutoffPercentage: { type: Number, default: 5 },
  adminEarnings: { type: Number, default: 0 },
  vendorPayout: { type: Number, default: 0 },
  cancellationStatus: {
    type: String,
    enum: ['none', 'cancelled'],
    default: 'none'
  },
  cancellationCharge: { type: Number, default: 0 },
  cancellationReason: String,
  cancelledAt: Date,
  paymentId: {
    type: String,
    default: null
  },
  paymentMethod: {
    type: String,
    default: null
  },
  paymentGateway: {
    type: String,
    default: null
  },
  transactionId: {
    type: String,
    default: null
  },
    
    paymentDetails: {
      type: Object,
      default: {}, // Optional: ensures it's initialized as an object
    },
  refundAmount: { type: Number, default: 0 },
  refundStatus: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  refundId: {
    type: String, // Yahan Razorpay Refund ID (rfnd_...) save hogi
    default: null
  },
  refundedAt: {
    type: Date,
    default: null
  },

  refundBeneficiaryDetails: {
  mode: { type: String, enum: ['bank', 'upi'], default: null },
  bankName: { type: String, default: '' },
  accountNumber: { type: String, default: '' },
  ifsc: { type: String, default: '' },
  accountHolderName: { type: String, default: '' },
  upiId: { type: String, default: '' }
},
manualRefundDetails: {
  adminTransactionId: { type: String, default: '' }, // Transaction ID entered by Admin
  refundedByMode: { type: String, default: '' }, // 'IMPS', 'NEFT', 'UPI'
  refundDate: { type: Date }
},

  payoutStatus: {
  type: String,
  enum: ['pending', 'requested', 'paid'],
  default: 'pending' // pending = eligible but not requested, requested = sent to admin, paid = money transferred
},
payoutRequestId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "PayoutRequest",
  default: null
},
eligibleForPayoutDate: {
  type: Date, // We will store when this order becomes eligible (Created/Completed + 7 days)
  default: null
}
}, { timestamps: true });
 
module.exports = model('OrderPharmacy', orderItemSchema);