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
 
  },
  { timestamps: true }
);
module.exports = model("Doctor", doctorSchema);