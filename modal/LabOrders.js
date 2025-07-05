// // models/FoodOrder.js
// const mongoose = require('mongoose');
// const { Schema, model } = mongoose;

// const LabOrderSchema = new Schema(
//   {
//     userId: {
//       type: Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     vendorId: {
//       type: Schema.Types.ObjectId,
//       ref: "vandor",
//       required: true,
//     },
//     price: {
//       type: String,
//       default: "",
//     },
//     status: {
//       type: String,
//       default: "0",
//     },
//     orderType: {
//       type: String,
//       default: "",
//     },
//     driverId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Driver",
//     },
//     rejectionReason: {
//       type: String,
//       default: null,
//     },
//     address: {
//         type: [String],
//         default: [],
//       },
//       date: {
//         type: String,
//         default: "",
//       },
//       Time: {
//         type: String,
//         default: "",
//       },
//       Slot: {
//         type: String,
//         default: "",
//       },
//       week: {
//         type: String,
//         default: "",
//       },
//     Description :{
//         type:String,
//         default:""
//     },
//     // Addtest
//     AddtestId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Addtest",
//       },

//   },
//   { timestamps: true }
// );

// module.exports = model("LabOrder", LabOrderSchema);
