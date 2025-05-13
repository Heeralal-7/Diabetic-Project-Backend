const { Schema, model } = require("mongoose");

const commentSchema = new Schema({

    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      postId: {
        type: Schema.Types.ObjectId,
        ref: "Mainform",
      },
      comment:{
        type:String,
        default:""
      }
},{timestamps:true})

module.exports = model('Comment' , commentSchema)