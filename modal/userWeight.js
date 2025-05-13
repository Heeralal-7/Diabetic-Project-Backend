const { Schema, model } = require("mongoose");

const weightSchema = new Schema(
  {
    weight: {
      type: Number,
      default: "",
    },
    height: {
      type: Number,
      default: "",
    },
    date: {
      type: String,
      default: "",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = model("Weight", weightSchema);
