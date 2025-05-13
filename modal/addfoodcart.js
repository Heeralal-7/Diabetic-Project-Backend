const { Schema, model } = require("mongoose");

const foodCart = Schema(
  {
    FoodItem: {
      type: Schema.Types.ObjectId,
      ref: "Food",
    },
    quantity: {
      type: Number,
      default:0
  
    },
    cartStatus:{
      type: Number,
      default:0
    },
    extraItems: {
      type: [{
        name: { type: String}, 
        price: { type: Number }, 
        extrastatus:{type:Number, default:0}
      }],
      default: []  
    },
    userId:{
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    cutlery:{
      type:Boolean,
      default:false
    },
    address:{
      type:String,
      default:""
    },
    date:{
      type:String,
      default:""
    },
    foodTime:{
      type:String,
      default:""
    },
    foodSlot:{
      type:String,
      default:""
    },
    week:{
      type:String,
      default:""
    },
    type:{
      type:String,
      default:""
    },
    request:{
      type:String,
      default:""
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "vandor",
    },
    Amount:{
      type: Number,
      default:0
    },
    finalprice:{
      type:Number,
      default:0
    }
    
  },
  { timestamps: true }
);

module.exports = model("FoodCart", foodCart);
