const mongoose = require("mongoose");

const shopTimingSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "vandor",
      required: true,
    },
    day: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      required: true,
    },
    openingTime: {
      type: String, // Format: "HH:MM AM/PM" (e.g., "09:00 AM")
      required: function () {
        return !this.isClosed;
      },
    },
    closingTime: {
      type: String, // Format: "HH:MM AM/PM" (e.g., "08:00 PM")
      required: function () {
        return !this.isClosed;
      },
    },
    isClosed: {
      type: Boolean,
      default: false,
    },
    description: { type: String, default: "" }, // Added description field
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShopTiming", shopTimingSchema);