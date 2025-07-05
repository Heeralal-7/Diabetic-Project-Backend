const { Schema, model } = require("mongoose");

const paymentSchema = new Schema({
  clinicId: {
    type: Schema.Types.ObjectId,
    ref: "Clinic",
    default: null,
  },
  ClinicStatus:{
    type:String,
    default:"0"
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
  vendorId: {
    type: Schema.Types.ObjectId,
    ref: "vandor", // Consider correcting to "Vendor" if that's the intended model name
    default: null,
  },
  PaymentId: {
    type: String,
    required: true,
  }
,  
Amount: {
  type: Number,
  required: true,
  default: 0, // ✅ Use number not empty string
},

  Refund: {
    type: String,
    default: "",
  },
  timestamp: {
    type: Date,
    default: () => {
      const now = new Date();
      const istOffset = 330 * 60 * 1000; // IST is UTC +5:30
      return new Date(now.getTime() + istOffset);
    },
  },
});

module.exports = model("payment", paymentSchema);
