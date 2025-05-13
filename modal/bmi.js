const { Schema, model } = require("mongoose");

const bmiSchema = new Schema(
  {
    gender: {
      type: String,
      default: "",
    },
    height: {
      type: Number,
      default: "",
    },
    weight: {
      type: Number,
      default: "",
    },
    age: {
      type: Number,
      default: "",
    },
    category: {
      type: String,
      default: "",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    bmi:{
      type:Number,
      default:""
    }
  },
  { timestamps: true }
);

module.exports = model("BMI", bmiSchema);
