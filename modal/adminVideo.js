const { Schema, model } = require("mongoose");

const videoSchema = new Schema(
  {
    video1: {
      type: String,
      default: "",
    },
    thumbnail1: {
      type: String,
      default: "",
    },
    video2: {
      type: String,
      default: "",
    },
    thumbnail2: {
      type: String,
      default: "",
    },
    video3: {
      type: String,
      default: "",
    },
    thumbnail3: {
      type: String,
      default: "",
    },
    video4: {
      type: String,
      default: "",
    },
    thumbnail4: {
      type: String,
      default: "",
    },
    video5: {
      type: String,
      default: "",
    },
    thumbnail5: {
      type: String,
      default: "",
    },
    video6: {
      type: String,
      default: "",
    },
    thumbnail6: {
      type: String,
      default: "",
    },
  },
  { new: true }
);

module.exports = model("Video", videoSchema);
