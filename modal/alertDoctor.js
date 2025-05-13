const { Schema, model } = require("mongoose");

const alertDoctorSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    name:{
        type:String,
        default:""
    },
    phone:{
        type:String,
        default:""
    }
},{timestamps:true})

module.exports = model('AlertDoctor' , alertDoctorSchema)