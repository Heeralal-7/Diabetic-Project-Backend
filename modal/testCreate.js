const { Schema, model } = require("mongoose");

const testSchema = Schema({
    name:{
        type:String,
        default:""
    },
    category:{
        type:String,
        default:""
    }
},{timestamps:true})

module.exports = model('TestCreate' , testSchema)