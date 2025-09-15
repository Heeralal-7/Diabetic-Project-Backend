const { Schema, model } = require("mongoose");

const membershipschema = Schema({
  BloodSugar: {
    type: [String],
    default: []
  },
  AgeGroup: {
    type: [String],
    default: []
  },
  HadDiabetes: {
    type: [String],
    default: []
  },
  LifeStyle: {
    type: [String],
    default: []
  },
  adminId: {
    type: Schema.Types.ObjectId,
    ref: "Admin", // assuming your Admin model is named 'Admin'
  },
  UserId: {
    type: Schema.Types.ObjectId,
    ref: "User", // assuming your Admin model is named 'Admin'
  },
  Price:{
    type:Number,
    default:""
  }
});

module.exports = model("MemberShip", membershipschema);
