const {Schema,model} = require("mongoose");

const UsermemberSchema = Schema({
    BloodSugar: {
    type: String,
    default: ""
  },
  AgeGroup: {
    type: String,
    default: ""
  },
  HadDiabetes: {
    type: String,
    default: ""
  },
  LifeStyle: {
    type: String,
    default: ""
  },
   UserId: {
    type: Schema.Types.ObjectId,
    ref: "User", // assuming your Admin model is named 'Admin'
  },
  finalPrice:{
    type:Number,
    default:""
  }

},{ timestamps: true }

)

module.exports = model("UserMemberShip",UsermemberSchema)