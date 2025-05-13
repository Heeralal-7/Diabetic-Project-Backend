const { Schema, model } = require("mongoose");

const states = Schema({
    name:{
        type:String
    },
    countryCode:{
        type:String
    },
})
module.exports=model("states", states)