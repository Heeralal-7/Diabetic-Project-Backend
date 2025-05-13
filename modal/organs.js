const { Schema,  model } = require("mongoose");

const org = Schema({
    organName:{
        type:String,
        default:""
    },
    organImage:{
        type:String,
        default:""
    }
  
})
module.exports= model("Organs", org)