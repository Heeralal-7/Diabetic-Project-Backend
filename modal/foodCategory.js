const { Schema, model } = require("mongoose");

const foodCategorySchema = Schema({
    name:{
        type:String,
        default:""
    },
    category:{
        type:String,
        default:""
    },
    foodImage:{
        type:String,
        default:""
    }
},{timestamps:true})

module.exports = model('FoodCategory' , foodCategorySchema)