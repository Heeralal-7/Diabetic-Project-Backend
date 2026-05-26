const { Schema, model } = require("mongoose");
 
const specialListsSchema = Schema(
  {
    specialists: {
      type: String,
      default: "",
    },
    specialistImage:{
      type: String,
      default: "",
    }
  },
  { timestamps: true }
);
 
module.exports = model("Specialists", specialListsSchema);
 
 