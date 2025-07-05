const { Schema, model } = require("mongoose");

const ratingSchema = Schema(
  {
    rating: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      default: null,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "vandor",
      default: null,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    ClinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
    },
  },

  { timestamps: true }
);

module.exports = model("Rating", ratingSchema);
