const { Schema, model } = require("mongoose");

const likeSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Mainform",
    },
  },
  { timestamps: true }
);

module.exports = model("Like", likeSchema);
