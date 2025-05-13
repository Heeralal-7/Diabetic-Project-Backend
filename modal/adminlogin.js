const { Schema, model } = require("mongoose");

const admin = Schema(
  {
    name: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      unique: true,
    },
    image: {
      type: String,
      default: "",
    },
    password: {
      type: String,
    },
    token: {
      type: String,
      default: "",
    },
  },
  { Timestamps: true }
);
module.exports = model("Admin", admin);
