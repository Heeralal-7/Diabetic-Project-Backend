const { Schema, model } = require("mongoose");

const packageCategories = new Schema({
    id: {
       type:Number,
        default:""
      },
      test_category:{
        type:String,
        default:""
      },
      category_url:{
         type:String,
        default:""
      },
      test_name:{
       type:String,
        default:""
      },
      no_tests:{
        type:String,
       default:""
     },
     description:{
        type:String,
       default:""
     },
     test_type:{
        type:String,
       default:""
     },
     type:{
        type:String,
       default:""
     },
     mrp:{
        type:String,
       default:""
     },
     discounted_price:{
        type:String,
       default:""
     },
     laboratries:{
        type:String,
       default:""
     },
     test_list:{
        type:String,
       default:""
     },
     precaution:{
        type:String,
       default:""
     },
     provide:{
        type:String,
       default:""
     },
     image:{
        type:String,
       default:""
     },


},{timestamps:true})

module.exports = model('Package Categories' , packageCategories)