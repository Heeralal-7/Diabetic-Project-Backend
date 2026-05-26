const mongoose = require('mongoose');

const payoutRequestSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'vendorModel' // Dynamic reference to Vendor, Doctor, or Clinic
  },
  vendorModel: {
    type: String,
    required: true,
    enum: ['vandor', 'Doctor', 'Clinic'] // Matches your collection names
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  totalAmount: {
    type: Number,
    required: true
  },
  adminEarnings: {
    type: Number,
    default: 0
  },
  totalOrders: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'], // approved means Paid
    default: 'pending'
  },
  transactionId: {
    type: String, // Admin can enter bank transaction ID here
    default: ""
  },
  adminNote: {
    type: String,
    default: ""
  },
  // Arrays to store IDs of orders included in this request
  foodOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FoodOrder' }],
  pharmacyOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'OrderPharmacy' }],
  appointments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }]
}, { timestamps: true });

module.exports = mongoose.model('PayoutRequest', payoutRequestSchema);