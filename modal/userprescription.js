const { Schema, model } = require("mongoose");

const prescriptionSchema = new Schema(
  {
    image: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["Prescription", "Medical Reports", "Lab Reports"],
      default: "",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = model("Prescription", prescriptionSchema);
