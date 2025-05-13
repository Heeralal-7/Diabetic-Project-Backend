const Like = require("../../../modal/like");
const MainForm = require("../../../modal/mainForm");

//like or dislike
//Method:Put
//Endpoint:/like-dislike/likepost/:id
const likeordislike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Like.findOne({ postId: id });

    if (post) {
      await post.deleteOne();
      return res.send({
        success: 1,
        message: "User disliked the post",
      });
    } else {
      await Like.create({ userId, postId: id });

      return res.send({
        success: 1,
        message: "User liked the post",
      });
    }
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = { likeordislike };
