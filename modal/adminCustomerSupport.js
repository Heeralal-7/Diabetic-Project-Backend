const { Schema, model } = require("mongoose");

const customerSchema = Schema({
  phone: {
    type: String,
    default: "",
  },
});

module.exports = new model("Customer", customerSchema);
