const {Schema,model} = require("mongoose");

const addInsuranceTypeschema = Schema({
    addInsurance:{
        type:String,
        default:""
    }
})

module.exports = model("addInsuranceType",addInsuranceTypeschema)