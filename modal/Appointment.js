const { Schema, model } = require("mongoose");

const appointmentSchema = Schema(
  {

    serviceType: {
      type: String,
      default: "",
    },
    packageName:{
      type:String,
      default:""
    },
    testName:{
      type:String,
      default:""
    },
    name: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    pinCode: {
      type: String,
      default: "",
    },
    dob: {
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
    image: {
      type: String,
      deafult: "",
    },
    sampleRequired:{
      type:[String],
      default:[]
    },
    sampleCollected:{
      type:[String],
      default:[]
    },
    phone: {
      type: String,
      default: "",
    },
    date: {
      type: String,
      default: "",
    },
    timeSlot: {
      type: String,
      default: "",
    },
    price: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      default: null,
    },
    prescribe: {
      type: Schema.Types.ObjectId,
      ref: "Prescribe",
      default: null,
    },
    status: {
      type: String,
      default: "0",
    },
    report: {
      type: String,
      default: "",
    },
    prescription: {
      type: String,
      default: "",
    },
    test: {
      type: [String],
      default: [],
    },
    gender: {
      type: String,
      default: "",
    },
    packageId: {
      type: Schema.Types.ObjectId,
      ref: "AddPackage",
      default: null,
    },
    testId: [{
      type: Schema.Types.ObjectId,
      ref: "Addtest",
      default: null
    }],
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "vandor",
      default: null,
    },
    type: {
      type: String, // "online" or "offline"
      required: true
    },
    callStatus: {
      type: String, 
      default: "0"
    },
    
    driverId: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "AddMember",
      default: null,
    },
   problemDescription: {
      type: String,
      default: "",
    },
    day: {
      type: String,
      default: "",
    },
    prescriptionImage: {
      type: String,
      default: "",
    },
    galleryImage: {
      type: String,
      default: "",
    },
    method:{
      type:String,
      default:""
    },
    age: {
      type: Number,
      required: false, // or true if you want it mandatory
    },
    // couponId
    couponId: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
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
    rejectionReason: {
      type: String,
      default: null,
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      default: null,
    },
    clinicStatus:{
      type:String,
      defaut:""
    },
    AddMemberId: {
      type: Schema.Types.ObjectId,
      ref: "AddMember",
      default: null,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    
    paymentDetails: {
      type: Object,
      default: {}, // Optional: ensures it's initialized as an object
    }

  },
  {
    Timestamp: true,
  }
);
module.exports = model("Appointment", appointmentSchema);
