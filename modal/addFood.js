const { Schema, model } = require("mongoose");

const addFood = Schema(
  {
    foodName: {
      type: String,
      default: "",
    },
    foodSubCategory: {
      type: String,
      default: "",
    },
    ingredients: {
      type: String,
      default: "",
    },
    image: {
      type: [String],
      default: [],
    },
    foodCategory: {
      type: String,
      default: "",
    },
    sugarFree: {
      type: String,
      default: "",
    },
    addons: {
      type: [{
        name: { type: String}, 
        price: { type: Number },  
        quantity: { type: Number , default: 0 },
        cartStatus: { type: Number, default: 0 },
        calorie:{type:String,default:""}
      }],
      default: []  
    },
    status: {
      type: String,
      default: "0",
    },
    amount: {
      type: String,
      default: "",
    },
    discountPercentage: {
      type: String,
      default: "",
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "vandor",
    },
    quantity: {
      type: Number,
      default: 0,
    },
    cartStatus:{
      type: Number,
      default: 0,
    },
    MealId: {
      type: Schema.Types.ObjectId,
      ref: "Meal",
      required: false, // <-- make it optional
    }, 
    calorie :{
      type:String,
      default:""
  },   
    admin:{
      
    },
  
  },
  { timestamps: true }
);
module.exports = model("Food", addFood);
