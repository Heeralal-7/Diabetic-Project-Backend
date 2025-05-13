const Comment = require("../../../modal/comment");

//Get comment
//Method:Get
//Endpoint:/create-comment/:id
const getAllComments = async (req, res) => {
  try {
    const { id } = req.params;
    const allComents = await Comment.find({ postId: id });

    const finalResult = await Promise.all(
      allComents.map(async (d) => {
        let commentStatus = false;
        if (req.user._id.toString() === d.userId.toString()) {
          commentStatus = true;
        }
        return { ...d.toObject(), commentStatus };
      })
    );

    return res.send({
      success: 1,
      message: "All comments fetched successfully",
      details: finalResult,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//create comment
//Method:Post
//Endpoint:/create-comment/create-post

const comm = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { comment } = req.body;

    const newComment = await Comment.create({
      comment,
      userId,
      postId: id,
    });

    return res.send({
      success: 1,
      message: "Created successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Update comment
//Method:Patch
//Endpoint:/create-comment/update-post/id
const update = async (req, res) => {
  try {
    const { comment } = req.body;
    const { id } = req.params;

    const updateComment = await Comment.findByIdAndUpdate(
      id,
      {
        comment: comment,
      },
      { new: true }
    );

    return res.send({
      success: 1,
      message: "Updated successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Delete comment
//Method:Delete
//Endpoint:/create-comment/delete-post/id
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const deleteComm = await Comment.findByIdAndDelete(
      id,
      {
        delete: "",
      },
      { new: true }
    );

    return res.send({
      success: 1,
      message: "Deleted successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = { comm, update, deleteComment, getAllComments };
