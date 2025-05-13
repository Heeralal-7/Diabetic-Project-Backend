// const { type } = require("@testing-library/user-event/dist/type");
const { Schema, model, SchemaType } = require("mongoose");

const doctorSchema = new Schema(
  {
    name: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    posterimage: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    phoneNumber: {
      type: String,
      default: "",
    },
    alternatePhoneNumber: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    ctrCode: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    phnOtp: {
      type: String,
      default: "234567",
    },
    qualification: {
      type: Schema.Types.ObjectId,
    ref:"Qualification",
      default: null,
    },
    altphnctrcode: {
      type: String,
      default: "",
    },
    specialist: {
      type: Schema.Types.ObjectId,
      ref:"Specialists",
      default: null,
    },
    experience: {
      type: String,
      default: "",
    },
    licenceNumber: {
      type: String,
      default: "",
    },
   patientstreated:{
    type:Number,
    default:""
   },
   Award:{
    type:String
   },
    councilNumber: {
      type: String,
      default: "",
    },
    clinicName: {
      type: String,
      default: "",
    },
    // certificateImage: {
    //   type: String,
    //   default: "",
    // },
    // licenceCertificate: {
    //   type: String,
    //   default: "",
    // },
    password: {
      type: String,
      default: "", 
    },
    myDocumentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
     },
    amount: {
      type: String
    },
    token: {
      type: String,
      default: "",
    },
    About:{
      type:String
    },
    Verified:{
      type:String,
      default:"false"
    }
    
  },
  { timestamps: true }
);
module.exports = model("Doctor", doctorSchema);
 