const { Schema, model } = require("mongoose");

const cities = Schema({
    name:{
        type:String
    },
    stateCode:{
        type:String
    },
})
module.exports=model("cities", cities)