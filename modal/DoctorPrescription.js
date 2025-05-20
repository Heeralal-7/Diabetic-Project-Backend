const {Schema,model} = require("mongoose");

const doctorPrescriptionschema = new Schema({
    Advice:{
        type: String,
        default:""
    },
    AnyAdvice:{
        type: String,
        default:""
    },
    SpecialInstruction:{
        type:String,
        default:""
    },
    Medicine:{
        type:String
    },
    Dose:{
        type:String,
        default:""
    },
    Days:{
        type:String,
        default:""
    }
},
{ timestamps: true }
);

module.exports = model("doctorPrescription",doctorPrescriptionschema)