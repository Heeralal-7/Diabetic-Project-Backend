const { Schema, model } = require("mongoose");
const mongoose = require('mongoose');

const appointmentSchema = Schema(
  {
    serviceType: {
      type: String,
      default: "",
    },
    packageName:{
      type:String,
      default:""
    },
    testName:{
      type:String,
      default:""
    },
    name: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    pinCode: {
      type: String,
      default: "",
    },
    dob: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      deafult: "",
    },
    sampleRequired:{
      type:[String],
      default:[]
    },
    sampleCollected:{
      type:[String],
      default:[]
    },
    phone: {
      type: String,
      default: "",
    },
    date: {
      type: String,
      default: "",
    },
    timeSlot: {
      type: String,
      default: "",
    },
    price: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      default: null,
    },
    prescribe: {
      type: Schema.Types.ObjectId,
      ref: "Prescribe",
      default: null,
    },
    status: {
      type: String,
      default: "0",
    },
    report: {
      type: String,
      default: "",
    },
    prescription: {
      type: String,
      default: "",
    },
    test: {
      type: [String],
      default: [],
    },
    gender: {
      type: String,
      default: "",
    },
    packageId: {
      type: Schema.Types.ObjectId,
      ref: "AddPackage",
      default: null,
    },
    testId: [{
      type: Schema.Types.ObjectId,
      ref: "Addtest",
      default: null
    }],
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "vandor",
      default: null,
    },
    type: {
      type: String, // "online" or "offline"
      required: true
    },
    callStatus: {
      type: String, 
      default: "0"
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      default: null,
    },
    Patient: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      default: null,
    },
   problemDescription: {
      type: String,
      default: "",
    },
    day: {
      type: String,
      default: "",
    },
    prescriptionImage: {
      type: String,
      default: "",
    },
    galleryImage: {
      type: String,
      default: "",
    },
    method:{
      type:String,
      default:""
    },
    age: {
      type: Number,
      required: false, 
    },
    // couponId
    couponId: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },
    PostponeStaus:{
      type:String,
      default:"0"
    },
    selectavailbilty: {
      type: String,
      enum: ['morning', 'afternoon', 'evening'],
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      default: null,
    },
    clinicStatus:{
      type:String,
      defaut:""
    },
    AddMemberId: {
      type: Schema.Types.ObjectId,
      ref: "AddMember",
      default: null,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded','free'],
      default: 'pending'
    },
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
      default: {}, 
    },
    // Membership related fields
    userMembershipId: {
      type: Schema.Types.ObjectId,
      ref: "UserMemberShip",
      default: null
    },
    isFreeConsultation: {
      type: Boolean,
      default: false
    },
    membershipConsultationUsed: {
      type: Boolean,
      default: false
    },
    cutoffPercentage: {
      type: Number,
      default: 5
    },
    adminEarnings: {
      type: Number,
      default: 0
    },
    vendorPayout: {
      type: Number,
      default: 0
    },
    // ✅ Simple cancellation fields
    cancellationStatus: {
      type: String,
      enum: ['none', 'cancelled'],
      default: 'none'
    },
    cancellationCharge: {
      type: Number,
      default: 0
    },
    cancellationReason: String,
    cancelledAt: Date,
    refundAmount: {
      type: Number,
      default: 0
    },
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
    tax: { type: Number },
    deliveryCharges: { type: Number },
    rapidDeliveryFee: { type: Number, default: 0 },
    isRapidDelivery: { type: Boolean, default: false },

    
    appliedDiscountPercentage: {
      type: String, 
      default: "0" 
    },
  

    // Appointment modal में यह field add करें
    membershipCutoff: {
      type: Number,
      default: 0
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
    },
    vendorAcceptedAt: Date,
    orderCompletedAt: Date
  },
  {
    Timestamp: true, // Note: Standard mongoose is "timestamps" (lowercase 's'), but I kept yours as is.
    timestamps: true 
  }
);
module.exports = model("Appointment", appointmentSchema);