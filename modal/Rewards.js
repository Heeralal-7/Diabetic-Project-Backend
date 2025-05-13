const { Schema, model } = require("mongoose");

const rewardSchema = new Schema({
   userId:{
    type: Schema.Types.ObjectId,
    ref: "User",
   },
   coins:{
    type:Number,
    default:""
   },

},{timestamps:true})

module.exports = model('Reward' , rewardSchema)