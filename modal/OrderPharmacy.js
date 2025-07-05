const { Schema, model } = require('mongoose');
 
const orderItemSchema = new Schema({
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: 'PharmacyProduct' },
    productName: String,
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vandor' },
    vendorName: String,
    quantity: Number,
    unitPrice: Number,  
    discount: Number,
    totalPrice: Number,
    itemType: String // 'product' or 'medicine'
  }],
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  status: { type: Number, default: 0 },
  driverAssignedId: { type: Schema.Types.ObjectId, ref: 'Driver' },
  address: String,
  timeSlot: String,
  dateSlot: String,
  coupon: String,
  subTotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  deliveryCharges: { type: Number, required: true },
  rapidDeliveryFee: { type: Number, default: 0 },
  isRapidDelivery: { type: Boolean, default: false },
  grandTotal: { type: Number, required: true },
  orderStatus: { type: String, default: 'confirmed' },
  vendorAcceptedAt: Date,
  expectedDeliveryTime: Date,
  rejectionReason: String
}, { timestamps: true });
 
module.exports = model('OrderPharmacy', orderItemSchema);
 