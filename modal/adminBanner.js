const { Schema, model } = require("mongoose");

const bannerSchema = new Schema({
    image1: {
      type: String,
      default: "",
    },
    image2: {
      type: String,
      default: "",
    },
    image3: {
      type: String,
      default: "",
    },
    image4: {
      type: String,
      default: "",
    },
    image5: {
      type: String,
      default: "",
    },
    image6: {
      type: String,
      default: "",
    },
    type:{
      type:String,
      default:""
    }
  },
  { timestamps: true }
);

module.exports = model("Banner", bannerSchema);
