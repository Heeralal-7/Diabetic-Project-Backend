const { Schema, model } = require("mongoose");

const bpSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      date:{
        type:String,
        default:""
      },
      systolic:{
        type:Number,
        default:""
      },
      diastolic:{
        type:Number,
        default:""
      }
},{timestamps:true})

module.exports = model('BP' , bpSchema)