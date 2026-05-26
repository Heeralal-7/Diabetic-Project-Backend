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

    console.log('Update request received for ID:', id);

    console.log('Files received:', req.files);
 
    const admin = await Video.findById(id);

    if (!admin) {

      return res.status(404).send({

        success: 0,

        message: "Video not found",

      });

    }
 
    // Start with existing data

    const updateData = {};
 
    // Only update fields that have new files

    if (req.files) {

      // Check each possible video field

      for (let i = 1; i <= 6; i++) {

        const fieldName = `video${i}`;

        // Check if the file exists and has at least one file

        if (req.files[fieldName] && Array.isArray(req.files[fieldName]) && req.files[fieldName].length > 0) {

          const file = req.files[fieldName][0];

          if (file && file.filename) {

            updateData[fieldName] = `/admin/user/video/${file.filename}`;

            console.log(`Updating ${fieldName} with:`, updateData[fieldName]);

          }

        }

      }

    }
 
    console.log('Final update data:', updateData);
 
    // If no files to update, return early

    if (Object.keys(updateData).length === 0) {

      return res.send({

        success: 0,

        message: "No files provided for update",

      });

    }
 
    const data = await Video.findByIdAndUpdate(

      id,

      updateData,

      { new: true }

    );
 
    if (!data) {

      return res.send({

        success: 0,

        message: "Failed to update video in database",

      });

    }
 
    return res.send({

      success: 1,

      message: "Updated successfully",

      data: data

    });

  } catch (error) {

    console.error('Update error:', error);

    return res.status(500).send({

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

// ==================== YOUTUBE FUNCTIONS (NEW) ====================
 
// Helper function to extract YouTube ID

function extractYouTubeId(url) {

  if (!url || typeof url !== 'string') return null;

  // Remove query parameters first

  const cleanUrl = url.split('?')[0].split('#')[0];

  const patterns = [

    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,

    /youtube\.com\/watch\?v=([^"&?\/\s]{11})/,

    /youtu\.be\/([^"&?\/\s]{11})/

  ];

  for (const pattern of patterns) {

    const match = cleanUrl.match(pattern);

    if (match && match[1]) {

      return match[1];

    }

  }

  return null;

}
 
// Add YouTube Link

const addYoutubeLink = async (req, res) => {

  try {

    const { youtubeUrl, title } = req.body;
 
    if (!youtubeUrl) {

      return res.status(400).send({

        success: 0,

        message: "YouTube URL is required"

      });

    }
 
    // Extract video ID

    const videoId = extractYouTubeId(youtubeUrl);

    if (!videoId) {

      return res.status(400).send({

        success: 0,

        message: "Invalid YouTube URL"

      });

    }
 
    // Find or create video document

    let videoDoc = await Video.findOne();

    if (!videoDoc) {

      videoDoc = await Video.create({});

    }
 
    // Create YouTube link object

    const youtubeLink = {

      url: youtubeUrl,

      videoId: videoId,

      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,

      title: title || `YouTube Video ${videoDoc.youtubeLinks ? videoDoc.youtubeLinks.length + 1 : 1}`,

      addedAt: new Date()

    };
 
    // Initialize youtubeLinks array if not exists

    if (!videoDoc.youtubeLinks) {

      videoDoc.youtubeLinks = [];

    }
 
    // Add to array

    videoDoc.youtubeLinks.push(youtubeLink);

    await videoDoc.save();
 
    // Get the saved link

    const savedLink = videoDoc.youtubeLinks[videoDoc.youtubeLinks.length - 1];
 
    return res.send({

      success: 1,

      message: "YouTube link added successfully",

      data: {

        _id: savedLink._id,

        url: savedLink.url,

        videoId: savedLink.videoId,

        thumbnail: savedLink.thumbnail,

        title: savedLink.title,

        addedAt: savedLink.addedAt

      },

      totalLinks: videoDoc.youtubeLinks.length

    });
 
  } catch (error) {

    console.error('Add YouTube error:', error);

    return res.status(500).send({

      success: 0,

      message: error.message || "Failed to add YouTube link"

    });

  }

};
 
// Get YouTube Links

const getYoutubeLinks = async (req, res) => {

  try {

    const videoDoc = await Video.findOne()

    .sort({ 'youtubeLinks.addedAt': -1 });

    if (!videoDoc) {

      return res.send({

        success: 1,

        message: "No videos found",

        youtubeLinks: [],

        total: 0

      });

    }
 
    const youtubeLinks = videoDoc.youtubeLinks || [];
 
    return res.send({

      success: 1,

      message: "YouTube links fetched",

      youtubeLinks: youtubeLinks,

      total: youtubeLinks.length

    });
 
  } catch (error) {

    console.error('Get YouTube links error:', error);

    return res.status(500).send({

      success: 0,

      message: error.message || "Failed to fetch YouTube links"

    });

  }

};
 
// Delete YouTube Link

const deleteYoutubeLink = async (req, res) => {

  try {

    const { linkId } = req.params;
 
    const videoDoc = await Video.findOne();

    if (!videoDoc) {

      return res.status(404).send({

        success: 0,

        message: "Video document not found"

      });

    }
 
    const youtubeLinks = videoDoc.youtubeLinks || [];

    const initialLength = youtubeLinks.length;

    // Filter out the link to delete

    videoDoc.youtubeLinks = youtubeLinks.filter(

      link => link._id.toString() !== linkId

    );
 
    if (videoDoc.youtubeLinks.length === initialLength) {

      return res.status(404).send({

        success: 0,

        message: "YouTube link not found"

      });

    }
 
    await videoDoc.save();
 
    return res.send({

      success: 1,

      message: "YouTube link deleted successfully",

      remainingLinks: videoDoc.youtubeLinks.length

    });
 
  } catch (error) {

    console.error('Delete YouTube link error:', error);

    return res.status(500).send({

      success: 0,

      message: error.message || "Failed to delete YouTube link"

    });

  }

};
 
// Update YouTube Link

const updateYoutubeLink = async (req, res) => {

  try {

    const { linkId } = req.params;

    const { youtubeUrl, title } = req.body;
 
    if (!youtubeUrl) {

      return res.status(400).send({

        success: 0,

        message: "YouTube URL is required"

      });

    }
 
    const videoId = extractYouTubeId(youtubeUrl);

    if (!videoId) {

      return res.status(400).send({

        success: 0,

        message: "Invalid YouTube URL"

      });

    }
 
    const videoDoc = await Video.findOne();

    if (!videoDoc) {

      return res.status(404).send({

        success: 0,

        message: "Video document not found"

      });

    }
 
    const youtubeLinks = videoDoc.youtubeLinks || [];

    const linkIndex = youtubeLinks.findIndex(

      link => link._id.toString() === linkId

    );
 
    if (linkIndex === -1) {

      return res.status(404).send({

        success: 0,

        message: "YouTube link not found"

      });

    }
 
    // Update the link

    youtubeLinks[linkIndex].url = youtubeUrl;

    youtubeLinks[linkIndex].videoId = videoId;

    youtubeLinks[linkIndex].thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    if (title) youtubeLinks[linkIndex].title = title;
 
    await videoDoc.save();
 
    return res.send({

      success: 1,

      message: "YouTube link updated successfully",

      data: youtubeLinks[linkIndex]

    });
 
  } catch (error) {

    console.error('Update YouTube link error:', error);

    return res.status(500).send({

      success: 0,

      message: error.message || "Failed to update YouTube link"

    });

  }

};

 

module.exports = { createVideo, getVideo, upadateVideo,  addYoutubeLink,
  getYoutubeLinks,
  deleteYoutubeLink,
  updateYoutubeLink
  };
