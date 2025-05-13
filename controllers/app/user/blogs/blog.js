const MainForm = require("../../../../modal/mainForm");
const Subheading = require("../../../../modal/subheading");
const Like = require("../../../../modal/like");
const Comment = require("../../../../modal/comment");

const getMoreDetailsOfPost = async (postId, userId) => {
  try {
    const likeCount = await Like.countDocuments({ postId });
    const commentCount = await Comment.countDocuments({
      $and: [{ postId }, { userId }],
    });
    return { likeCount: likeCount || 0, commentCount: commentCount || 0 };
  } catch (error) {
    console.log(error.message);
  }
};

//8 all blogs by admin
//Method:Get
//Endpoint:/blogs
const getblog = async (req, res) => {
  try {
    const { id, page = 1, limit = 5 } = req.query;

    if (id) {
      const blogpost = await MainForm.findByIdAndUpdate(
        id,
        { $inc: { viewCount: 1 } },
        { new: true }
      ).populate("subheadingId");

      if (!blogpost) {
        return res.send({
          success: 0,
          message: "Blog post not found",
        });
      }

      return res.send({
        success: 1,
        message: "Blog post fetched and view count incremented",
        details: blogpost,
      });
    } else {
      const currentDate = new Date();
      const sevenDaysAgo = new Date(
        currentDate.setDate(currentDate.getDate() - 7)
      );

      // Pagination calculations
      const skip = (page - 1) * limit;

      // Get older posts
      const olderPostsPromise = MainForm.find({
        createdAt: { $lte: sevenDaysAgo },
      })
        .populate("subheadingId")
        .sort({ viewCount: -1 })
        .skip(skip)
        .limit(limit);

      // Get recent posts
      const recentPostsPromise = MainForm.find({
        createdAt: { $gt: sevenDaysAgo },
      })
        .populate("subheadingId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(+limit);

      // Execute both queries in parallel
      const [olderPosts, recentPosts] = await Promise.all([
        olderPostsPromise,
        recentPostsPromise,
      ]);

      const data = [...recentPosts, ...olderPosts];
      const finalResult = await Promise.all(
        data.map(async (d) => {
          let userId = req.user._id;
          let { likeCount, commentCount } = await getMoreDetailsOfPost(
            d._id,
            userId
          );
          return {
            ...d.toObject(),
            likeCount,
            commentCount,
          };
        })
      );

      // Get total count for pagination
      const totalPosts = await MainForm.countDocuments();

      return res.send({
        success: 1,
        message: "Fetched all posts",
        totalPages: Math.ceil(totalPosts / limit),
        details: finalResult,
        // currentPage: page,
      });
    }
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Get filtered blogs
//Method:Get
//Endpoint:/user-blog/filterblog?type
const filterBlog = async (req, res) => {
  try {
    const { type } = req.query;
    if (!type) {
      return res.send({
        success: 0,
        message: "Type is required",
      });
    }
    const data = await MainForm.find({ type });
    if (!data) {
      return res.send({
        success: 0,
        message: "Result is not there",
      });
    }

    return res.send({
      success: 1,
      message: "fetched",
      details: data,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//Search blogs
//Method:Get
//Endpoint:/blogs/user-blog?q
const searchUserBlog = async (req, res) => {
  try {
    const { q } = req.query;
    let query = {};
    if (q) {
      const regex = new RegExp(q, "i");
      query = {
        $or: [{ title: { $regex: regex } }],
      };
    }
    const search = await MainForm.find(query);
   

    if (!search) {
      return res.send({
        success: 0,
        message: "No result found",
      });
    }
    return res.send({
      success: 1,
      message: "Results fetched successfully",
      details: search,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};



module.exports = { getblog, filterBlog, searchUserBlog };
