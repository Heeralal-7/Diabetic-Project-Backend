const { Schema, model } = require("mongoose");

const consultatiotFeesSchema = Schema(
  {
    onlineFees: {
      type: String,
      default: "",
    },
    offlineFees: {
      type: String,
      default: "",
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
    },
    status: {
      type: String,
      default: "0",
    },
  },
  {
    Timestamp: true,
  }
);
module.exports = model("ConsultationFees", consultatiotFeesSchema);
