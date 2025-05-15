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
          required: true,
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
    }

  },
  { timestamps: true }
);

module.exports = model("FoodOrder", foodOrderSchema);
