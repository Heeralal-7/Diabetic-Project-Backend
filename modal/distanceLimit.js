const {Schema, model} = require("mongoose");
 
const maxLimit = new Schema(
    {
        doctorLimit: {
            type: String,
        },
        clinicLimit: {
            type: String,
        },  
        foodLimit: {
            type: String,
        },
        pharmacyLimit: {
            type: String,
        },
        labLimit: {
            type: String,
        },  
    },
    { timestamps: true }
);  
module.exports = model("MaxLimit", maxLimit);            
 