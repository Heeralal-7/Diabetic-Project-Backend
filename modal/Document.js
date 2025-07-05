const { Schema, model } = require("mongoose");

const documentsSchema = Schema(
  {
    registrationNo: {
      type: String,
      default: "",
    },
    registrationNoStatus: {
      type: String,
      default: "0",
    },
    licenceNo: {
      type: String,
      default: "",
    },
    licenceNoStatus: {
      type: String,
      default: "0",
    },
    accreditation: {
      type: String,
      default: "",
    },
    accreditationStatus: {
      type: String,
      default: "0",
    },
    aadharCard: {
      type: [String],
      default: [],
    },
     aadharCardStatus: {
      type: String,
      default: "0",
    },
    panCard: {
      type: [String],
      default: [],
    },
    panCardStatus: {
      type: String,
      default: "0", // ✅ Corrected
    },
    
    drivingLicence: {
      type: [String],
      default: [],
    },
    drivingLicenceStatus: {
      type: String,
      default: "0",
    },
    doctorCertificate: {
      type: String,
      default: "",
    },
    doctorCertificateStatus: {
      type: String,
      default: "0",
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      default: null,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "vandor",
      default: null,
    },
    status: {
      type: String,
      default: "0",
    },
    type: {
      type: String,
      default: "0",
    },
    rejectReasons: {
      type: Map,
      of: String, // e.g., { "panCardStatus": "Not clear", "aadharCardStatus": "Invalid doc" }
      default: {},
    },
    ClinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = model("Document", documentsSchema);
