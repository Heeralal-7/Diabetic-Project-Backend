const { Schema, model } = require("mongoose");

const addMemberSchema = new Schema(
  {
    image: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      required: true,
    },
    yearOfBirth: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    pinCode: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vandor",
      default: null,
    },
   
    addtestId: [
      {
        type: Schema.Types.ObjectId,
        ref: "Addtest",
        default: null,
      },
    ],
    AddPackageId: [
      {
        type: Schema.Types.ObjectId,
        ref: "AddPackage",
        default: null,
      },
    ],
    AppointmentId: 
      {
        type: Schema.Types.ObjectId,
        ref: "Appointment",
        default: null,
      },
    price:{
      type:String,
      default:""
    }
      
  },
  {
    timestamps: true,
  }
);

module.exports = model("AddMember", addMemberSchema);
