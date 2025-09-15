// const { type } = require("@testing-library/user-event/dist/type");
const { Schema, model } = require("mongoose");

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
      default: "",
    },
    qualification: {
      type: String,
      default: "",
    },
    altphnctrcode: {
      type: String,
      default: "",
    },
    specialist: {
      type: String,
      default: "",
    },
    experience: {
      type: String,
      default: "",
    },
    licenceNumber: {
      type: String,
      default: "",
    },
    councilNumber: {
      type: String,
      default: "",
    },
    clinicName: {
      type: String,
      default: "",
    },
    certificateImage: {
      type: String,
      default: "",
    },
    CertificateStatus: {
      type: String,
      default: "0",
    },
    licenceCertificate: {
      type: String,
      default: "",
    },
    licenceCertificateStatus: {
      type: String,
      default: "0",
    },
    signature:{
      type: String,
      defalut:""
    },
    signatureStatus: {
      type: String,
      default: "0",
    },

    password: {
      type: String,
      default: "",
    },
    myDocumentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      default: null,
    },
    amount: {
      type: String,
      default: "0",
    },
    token: {
      type: String,
      default: "",
    },
    Accountverify:{
      type:String,
      default:"0"
    },
    ConsultationFeesId: {
      type: Schema.Types.ObjectId,
      ref: "ConsultationFees",
      default: null,
    },
    rejectReason: {
      type: String,
      default: "",
    },
    regId: {
      type: String,
      default: "",
    },
    loginType: { 
      type: String, 
      enum: ["app", "clinic"], 
      default: "app" 
    },
    chatStatus:{
      type:String,
      default:""
    },
    ClinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      default: null,
    },
    longitude:{
        type:String,
        default:""
      },
      latitude:{
        type:String,
        default:""
      },
   location: {
  type: {
    type: String,
    enum: ['Point'],
    required: true,
    default: 'Point',
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true,
    default: [0, 0], // optional, or set null and validate
    validate: {
      validator: function (value) {
        return Array.isArray(value) && value.length === 2;
      },
      message: 'Coordinates must be [longitude, latitude]',
    },
  },
},

  },
  { timestamps: true }
);
doctorSchema.index({ location: "2dsphere" });

module.exports = model("Doctor", doctorSchema);

// 