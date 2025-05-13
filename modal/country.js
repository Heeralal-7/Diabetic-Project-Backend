const { Schema,  model } = require("mongoose");

const cntry = Schema({
    name:String, 
     phone_code:String,
     state:[String],
     cities:[String]
})
module.exports= model("countrydata", cntry)