const { Schema, model } = require("mongoose");

const doctorPrescriptionschema = new Schema(
  {
    Advice: {
      
      type: String,
      default: "",
    },
    AnyAdvice: {
      type: String,
      default: "",
    },
    SpecialInstruction: {
      type: String,
      default: "",
    },
// in models/doctorPrescription.js
MedicineId: [{
  type: Schema.Types.ObjectId,
  ref: "Medicine"
}],

    Dose: {
      type: String,
      default: "",
    },
    Timeing: {
      type: String,
      default: "", // 🛠️ Fixed typo: `deault` → `default`
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      default: null,
    },
    UserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    Days: {
      type: Number,
      default: null, // 🛠️ Recommended: use `null` instead of empty string for Number
    },
    NextAppoinment: {
        type: String,
      default: null,
    },
    PrescriptionStatus: {
        type: String,
        default: "0",
      },
      AppointmentId: {
        type: Schema.Types.ObjectId,
        ref: "Appointment",
        default: null,
      },
      PostponeStaus:{
        type:String,
        default:"0"
      },
      selectavailbilty: {
        type: String,
        enum: ['morning', 'afternoon', 'evening'],
      },
      DietChart:{
        type:String,
        default:""
      },
      DietChartImage:{
        type:String,
        default:""
      },
      pdfUrl: {
        type: String,
        default: "",
      },
      insuranceImage:{
        type:String,
        default:""
      },
      // addInsuranceType
      addInsuranceTypeId: {
        type: Schema.Types.ObjectId,
        ref: "addInsuranceType",
        default: null,
      },
  
  },
  { timestamps: true }
);

module.exports = model("doctorPrescription", doctorPrescriptionschema);
