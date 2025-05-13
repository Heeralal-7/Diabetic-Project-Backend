const { Schema, model } = require("mongoose");
const mainFormSchema = new Schema(
  {
    title: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    blogimage: {
      type: String,
      default: "",
    },
    created_by: {
      type: String,
      default: "",
    },
    conclusion: {
      type: String,
      default: "",
    },
    subheadingId: [
      {
        type: Schema.Types.ObjectId,
        ref: "Subheading",
      }
    ],
    
    type: {
      type: String,
      enum: ["Doctor Tips", "Mind & Body", "Monitoring", "Food Lab", "Recipes", "Food & Nutrition"],
      default: "",
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = model("Mainform", mainFormSchema);
