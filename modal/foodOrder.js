// models/FoodOrder.js
const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const foodOrderSchema = new Schema(
  {
    items: [
      {
        FoodItem: {
          type: Schema.Types.ObjectId,
          ref: "Food",
          required: false,
        },
        quantity: {
          type: Number,
          default: 0,
        },
        extraItems: [
          {
            name: { type: String },
            price: { type: Number },
            extrastatus: { type: Number, default: 0 },
          }
        ],
        Amount: {
          type: Number,
          default: 0,
        },
        // ✅ NEW FIELD: Store the Unit Price after Discount
        discountedPrice: { 
          type: Number, 
          default: 0 
        },
        finalprice: {
          type: Number,
          default: 0,
        },
        cutlery: {
          type: Boolean,
          default: false,
        },
        // अब address एक array of strings
        address: {
          type: [String],
          default: [],
        },
        date: {
          type: String,
          default: "",
        },
        foodTime: {
          type: String,
          default: "",
        },
        foodSlot: {
          type: String,
          default: "",
        },
        week: {
          type: String,
          default: "",
        },
        type: {
          type: String,
          default: "",
        },
        request: {
          type: String,
          default: "",
        },
      }
    ],
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "vandor",
      required: true,
    },
    rapid: {
      type: Boolean,
      default: false,
    },
    price: {
      type: String,
      default: "",
    },
     deliveryCharges: {
        baseDeliveryCharge: { type: Number, default: 0 },    // e.g., 95
        distanceCharge: { type: Number, default: 0 },        // e.g., 28 (Extra Distance Charges)
        rapidDeliveryCharge: { type: Number, default: 0 },   // e.g., 50 or 0
        taxAmount: { type: Number, default: 0 },             // Tax on food/delivery
        totalDeliveryCharge: { type: Number, default: 0 },   // Sum of Base + Distance + Rapid
        
        // Configuration Snapshot (To know what rules were applied)
        distance: { type: Number, default: 0 },              // e.g., 13.88 km
        freeDeliveryRadius: { type: Number, default: 0 },    // e.g., 10 km
        perKmCharge: { type: Number, default: 0 },           // e.g., 7 per km
        taxPercentage: { type: Number, default: 0 },         // e.g., 5%
        freeDeliveryThreshold: { type: Number, default: 0 }, // e.g., 500
        isFreeDelivery: { type: Boolean, default: false }    // If base delivery was free
    },
    status: {
      type: String,
      default: "0",
    },
    orderType: {
      type: String,
      default: "",
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    foodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
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

vendorAcceptedAt: Date,
    

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
    
    



  },
  { timestamps: true }
);

module.exports = model("FoodOrder", foodOrderSchema);
