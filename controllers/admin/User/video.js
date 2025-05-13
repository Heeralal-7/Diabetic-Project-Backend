const Video = require("../../../modal/adminVideo");

//admin upload video
//method:post
//Endpoints:/upload-videos/video
const createVideo = async (req, res) => {
  try {
    console.log(req.files);
    const data = await Video.create({
      video1:
        req.files.video1 && `/admin/user/video/${req.files.video1[0].filename}`,
      thumbnail1:
        req.files.thumbnail1 &&
        `/admin/user/thumbnail/${req.files.thumbnail1[0].filename}`,
      video2:
        req.files.video2 && `/admin/user/video/${req.files.video2[0].filename}`,
      thumbnail2:
        req.files.thumbnail2 &&
        `/admin/user/thumbnail/${req.files.thumbnail2[0].filename}`,
      video3:
        req.files.video3 && `/admin/user/video/${req.files.video3[0].filename}`,
      thumbnail3:
        req.files.thumbnail3 &&
        `/admin/user/thumbnail/${req.files.thumbnail3[0].filename}`,
      video4:
        req.files.video4 && `/admin/user/video/${req.files.video4[0].filename}`,
      thumbnail4:
        req.files.thumbnail4 &&
        `/admin/user/thumbnail/${req.files.thumbnail4[0].filename}`,
      video5:
        req.files.video5 && `/admin/user/video/${req.files.video5[0].filename}`,
      thumbnail5:
        req.files.thumbnail5 &&
        `/admin/user/thumbnail/${req.files.thumbnail5[0].filename}`,
      video6:
        req.files.video6 && `/admin/user/video/${req.files.video6[0].filename}`,
      thumbnail6:
        req.files.thumbnail6 &&
        `/admin/user/thumbnail/${req.files.thumbnail6[0].filename}`,
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

const upadateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Video.findById(id);
    if (!admin) {
      return res.send({
        success: 0,
        message: "id not authorized",
      });
    }

    const data = await Video.findByIdAndUpdate(
      id,
      {
        video1:
          `/admin/user/video/${req.files.video1[0].filename}` || admin.video1,
        video2:
          `/admin/user/video/${req.files.video2[0].filename}` || admin.video2,
        video3:
          `/admin/user/video/${req.files.video3[0].filename}` || admin.video3,
        video4:
          `/admin/user/video/${req.files.video4[0].filename}` || admin.video4,
        video5:
          `/admin/user/video/${req.files.video5[0].filename}` || admin.video5,
        video6:
          `/admin/user/video/${req.files.video6[0].filename}` || admin.video6,
      },
      { new: true }
    );

    console.log(data);
    if (!data) {
      return res.send({
        success: 0,
        message: "Data error",
      });
    }

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

//user gey uploaded videos
//method:get
//Endpoints:/upload-videos/getVideo
const getVideo = async (req, res) => {
  try {
    const data = await Video.find({});
    if (!data) {
      return res.send({
        success: 0,
        message: "Data error",
      });
    }

    return res.send({
      success: 1,
      message: "Fetched",
      details: data,
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = { createVideo, getVideo, upadateVideo };
