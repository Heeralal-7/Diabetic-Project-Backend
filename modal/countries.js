const { Schema, model } = require("mongoose");

const countries = Schema({
    name:{
        type:String
    },
    isoCode:{
        type:String
    },
})
module.exports=model("countries", countries)