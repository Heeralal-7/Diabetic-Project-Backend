const { Schema, model } = require("mongoose");
const subheadingSchema = new Schema(
  {
    title: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    mainFormId: {
      type: Schema.Types.ObjectId,
      ref: "Mainform",
    },
  },
  { timestamps: true }
);

module.exports = model("Subheading", subheadingSchema);
