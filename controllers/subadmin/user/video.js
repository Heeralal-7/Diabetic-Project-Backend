const Video = require("../../../modal/adminVideo");

// =============================================
// HELPER FUNCTION FOR PERMISSION CHECKING
// =============================================
const checkVideoPermission = (subAdmin, permissionType) => {
  if (!subAdmin) {
    return {
      allowed: false,
      message: "Sub-admin not authenticated"
    };
  }
  
  // Check for video-specific permissions
  if (subAdmin.permissions?.videos?.[permissionType]) {
    return { allowed: true };
  }
  
  // OR check for general users permissions
  if (subAdmin.permissions?.users?.[permissionType]) {
    return { allowed: true };
  }
  
  // OR check for content permissions
  if (subAdmin.permissions?.content?.[permissionType]) {
    return { allowed: true };
  }
  
  return {
    allowed: false,
    message: `No permission to ${permissionType} videos`
  };
};

// =============================================
// CREATE VIDEO (ADMIN/SUBADMIN)
// method: post
// Endpoints: /video/video/subAdmin
// =============================================
const createVideo = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkVideoPermission(subAdmin, 'create');
      if (!permissionCheck.allowed) {
        return res.status(403).send({
          success: 0,
          message: permissionCheck.message || "No permission to upload videos"
        });
      }
    }
    // Note: Admin doesn't need permission check

    console.log('📹 Video upload request:', {
      files: req.files,
      subAdmin: subAdmin ? { id: subAdmin._id, name: subAdmin.name } : 'Admin'
    });

    // Prepare video data
    const videoData = {
      createdBy: subAdmin?._id || req.admin?._id, // Track who created
      createdByRole: subAdmin ? 'subadmin' : 'admin'
    };

    // Add videos and thumbnails if files exist
    for (let i = 1; i <= 6; i++) {
      const videoField = `video${i}`;
      const thumbnailField = `thumbnail${i}`;
      
      if (req.files && req.files[videoField] && req.files[videoField][0]) {
        videoData[videoField] = `/admin/user/video/${req.files[videoField][0].filename}`;
      }
      
      if (req.files && req.files[thumbnailField] && req.files[thumbnailField][0]) {
        videoData[thumbnailField] = `/admin/user/thumbnail/${req.files[thumbnailField][0].filename}`;
      }
    }

    // Create video entry
    const data = await Video.create(videoData);

    return res.status(201).send({
      success: 1,
      message: "Video uploaded successfully",
      data: {
        id: data._id,
        createdBy: videoData.createdBy,
        createdByRole: videoData.createdByRole,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Create Video Error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// =============================================
// UPDATE VIDEO (ADMIN/SUBADMIN)
// method: put
// Endpoints: /video/update/subAdmin/:id
// =============================================
const upadateVideo = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('📝 Update video request for ID:', id);
    console.log('📁 Files received:', req.files);

    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkVideoPermission(subAdmin, 'edit');
      if (!permissionCheck.allowed) {
        return res.status(403).send({
          success: 0,
          message: permissionCheck.message || "No permission to edit videos"
        });
      }
    }

    // Find existing video
    const existingVideo = await Video.findById(id);
    if (!existingVideo) {
      return res.status(404).send({
        success: 0,
        message: "Video not found",
      });
    }

    // Check if subadmin is allowed to edit this video
    if (subAdmin && existingVideo.createdBy && existingVideo.createdBy.toString() !== subAdmin._id.toString()) {
      // Option: Allow edit only if created by same subadmin
      // return res.status(403).send({
      //   success: 0,
      //   message: "You can only edit videos uploaded by you"
      // });
    }

    // Prepare update data
    const updateData = {
      updatedBy: subAdmin?._id || req.admin?._id,
      updatedByRole: subAdmin ? 'subadmin' : 'admin',
      updatedAt: new Date()
    };

    // Update video fields if new files are provided
    for (let i = 1; i <= 6; i++) {
      const videoField = `video${i}`;
      const thumbnailField = `thumbnail${i}`;
      
      if (req.files && req.files[videoField] && Array.isArray(req.files[videoField]) && req.files[videoField].length > 0) {
        const file = req.files[videoField][0];
        if (file && file.filename) {
          updateData[videoField] = `/admin/user/video/${file.filename}`;
          console.log(`🔄 Updating ${videoField} with:`, updateData[videoField]);
        }
      }
      
      if (req.files && req.files[thumbnailField] && Array.isArray(req.files[thumbnailField]) && req.files[thumbnailField].length > 0) {
        const file = req.files[thumbnailField][0];
        if (file && file.filename) {
          updateData[thumbnailField] = `/admin/user/thumbnail/${file.filename}`;
          console.log(`🖼️ Updating ${thumbnailField} with:`, updateData[thumbnailField]);
        }
      }
    }

    console.log('📦 Final update data:', updateData);

    // If no files to update, return early
    if (Object.keys(updateData).length <= 3) { // Only has updatedBy, updatedByRole, updatedAt
      return res.send({
        success: 0,
        message: "No video/thumbnail files provided for update",
      });
    }

    // Update video in database
    const updatedVideo = await Video.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedVideo) {
      return res.send({
        success: 0,
        message: "Failed to update video in database",
      });
    }

    return res.send({
      success: 1,
      message: "Video updated successfully",
      data: {
        id: updatedVideo._id,
        updatedFields: Object.keys(updateData).filter(key => !['updatedBy', 'updatedByRole', 'updatedAt'].includes(key)),
        updatedAt: updateData.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Update Video Error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// =============================================
// GET VIDEOS (PUBLIC/USER/ADMIN/SUBADMIN)
// method: get
// Endpoints: /video/getVideo/subAdmin
// =============================================
const getVideo = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN (if needed)
    const subAdmin = req.subAdmin;
    
    // If you want to restrict view access for subadmins
    if (subAdmin) {
      const permissionCheck = checkVideoPermission(subAdmin, 'view');
      if (!permissionCheck.allowed) {
        return res.status(403).send({
          success: 0,
          message: permissionCheck.message || "No permission to view videos"
        });
      }
    }
    
    // Fetch all videos
    const data = await Video.find({}).sort({ createdAt: -1 });
    
    if (!data || data.length === 0) {
      return res.send({
        success: 0,
        message: "No videos found",
      });
    }

    // Format response based on user role
    const formattedVideos = data.map(video => {
      const videoObj = video.toObject();
      
      // Add full URLs if needed
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      // Generate video URLs
      for (let i = 1; i <= 6; i++) {
        const videoField = `video${i}`;
        const thumbnailField = `thumbnail${i}`;
        
        if (videoObj[videoField]) {
          videoObj[`${videoField}Url`] = `${baseUrl}${videoObj[videoField]}`;
        }
        
        if (videoObj[thumbnailField]) {
          videoObj[`${thumbnailField}Url`] = `${baseUrl}${videoObj[thumbnailField]}`;
        }
      }
      
      // Hide sensitive info for non-admins
      if (!req.admin && !subAdmin) {
        delete videoObj.createdBy;
        delete videoObj.updatedBy;
        delete videoObj.createdByRole;
        delete videoObj.updatedByRole;
      }
      
      return videoObj;
    });

    return res.send({
      success: 1,
      message: "Videos fetched successfully",
      count: formattedVideos.length,
      videos: formattedVideos,
      userRole: subAdmin ? 'subadmin' : (req.admin ? 'admin' : 'user')
    });
  } catch (error) {
    console.error('❌ Get Video Error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};

// =============================================
// DELETE VIDEO (ADMIN/SUBADMIN)
// =============================================
// const deleteVideo = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // 🔐 PERMISSION CHECK FOR SUBADMIN
//     const subAdmin = req.subAdmin;
//     if (subAdmin) {
//       const permissionCheck = checkVideoPermission(subAdmin, 'delete');
//       if (!permissionCheck.allowed) {
//         return res.status(403).send({
//           success: 0,
//           message: permissionCheck.message || "No permission to delete videos"
//         });
//       }
//     }

//     // Find video
//     const video = await Video.findById(id);
//     if (!video) {
//       return res.status(404).send({
//         success: 0,
//         message: "Video not found",
//       });
//     }

//     // Check if subadmin can delete this video
//     if (subAdmin && video.createdBy && video.createdBy.toString() !== subAdmin._id.toString()) {
//       // Option: Restrict deletion to own videos
//       return res.status(403).send({
//         success: 0,
//         message: "You can only delete videos uploaded by you"
//       });
//     }

//     // Delete video
//     await Video.findByIdAndDelete(id);

//     return res.send({
//       success: 1,
//       message: "Video deleted successfully",
//       deletedId: id
//     });
//   } catch (error) {
//     console.error('❌ Delete Video Error:', error);
//     return res.status(500).send({
//       success: 0,
//       message: error.message,
//     });
//   }
// };

// =============================================
// HELPER: EXTRACT YOUTUBE VIDEO ID
// =============================================
const extractYouTubeId = (url) => {
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
};

// =============================================
// 1. ADD YOUTUBE LINK (SUBADMIN)
// method: post
// Endpoints: /video/add-youtube-link/subAdmin
// =============================================
const addYoutubeLink = async (req, res) => {
  try {
    const { youtubeUrl, title } = req.body;

    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkVideoPermission(subAdmin, 'create');
      if (!permissionCheck.allowed) {
        return res.status(403).send({
          success: 0,
          message: permissionCheck.message || "No permission to add YouTube links"
        });
      }
    } else {
      return res.status(401).send({
        success: 0,
        message: "Authentication required"
      });
    }

    // Validate input
    if (!youtubeUrl) {
      return res.status(400).send({
        success: 0,
        message: "YouTube URL is required"
      });
    }

    // Extract YouTube video ID
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
      videoDoc = await Video.create({
        createdBy: subAdmin._id,
        createdByRole: 'subadmin'
      });
    }

    // Initialize youtubeLinks array if not exists
    if (!videoDoc.youtubeLinks) {
      videoDoc.youtubeLinks = [];
    }

    // Check if video already exists
    const existingLink = videoDoc.youtubeLinks.find(
      link => link.videoId === videoId
    );
    
    if (existingLink) {
      return res.status(400).send({
        success: 0,
        message: "This YouTube video is already added"
      });
    }

    // Create YouTube link object
    const youtubeLink = {
      url: youtubeUrl,
      videoId: videoId,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      title: title || `YouTube Video ${videoDoc.youtubeLinks.length + 1}`,
      addedBy: subAdmin._id,
      addedByRole: 'subadmin',
      addedAt: new Date()
    };

    // Add to array
    videoDoc.youtubeLinks.push(youtubeLink);
    await videoDoc.save();

    // Get the saved link
    const savedLink = videoDoc.youtubeLinks[videoDoc.youtubeLinks.length - 1];

    return res.status(201).send({
      success: 1,
      message: "YouTube link added successfully",
      data: {
        _id: savedLink._id,
        url: savedLink.url,
        videoId: savedLink.videoId,
        thumbnail: savedLink.thumbnail,
        title: savedLink.title,
        addedAt: savedLink.addedAt,
        addedBy: savedLink.addedBy
      },
      totalLinks: videoDoc.youtubeLinks.length
    });

  } catch (error) {
    console.error('❌ Add YouTube Link Error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message || "Failed to add YouTube link"
    });
  }
};

// =============================================
// 2. GET YOUTUBE LINKS (SUBADMIN)
// method: get
// Endpoints: /video/get-youtube-links/subAdmin
// =============================================
const getYoutubeLinks = async (req, res) => {
  try {
    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkVideoPermission(subAdmin, 'view');
      if (!permissionCheck.allowed) {
        return res.status(403).send({
          success: 0,
          message: permissionCheck.message || "No permission to view YouTube links"
        });
      }
    } else {
      return res.status(401).send({
        success: 0,
        message: "Authentication required"
      });
    }

    // Find video document
    const videoDoc = await Video.findOne();
    
    if (!videoDoc) {
      return res.send({
        success: 1,
        message: "No video document found",
        youtubeLinks: [],
        total: 0
      });
    }

    const youtubeLinks = videoDoc.youtubeLinks || [];

    // Filter links if subadmin can only see their own
    let filteredLinks = youtubeLinks;
    
    // If subadmin can only view their own links
    // filteredLinks = youtubeLinks.filter(link => 
    //   link.addedBy && link.addedBy.toString() === subAdmin._id.toString()
    // );

    return res.send({
      success: 1,
      message: "YouTube links fetched successfully",
      youtubeLinks: filteredLinks,
      total: filteredLinks.length,
      userInfo: {
        role: 'subadmin',
        userId: subAdmin._id,
        canEdit: checkVideoPermission(subAdmin, 'edit').allowed,
        canDelete: checkVideoPermission(subAdmin, 'delete').allowed
      }
    });

  } catch (error) {
    console.error('❌ Get YouTube Links Error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message || "Failed to fetch YouTube links"
    });
  }
};

// =============================================
// 3. UPDATE YOUTUBE LINK (SUBADMIN)
// method: put
// Endpoints: /video/update-youtube-link/subAdmin/:linkId
// =============================================
const updateYoutubeLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { youtubeUrl, title } = req.body;

    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkVideoPermission(subAdmin, 'edit');
      if (!permissionCheck.allowed) {
        return res.status(403).send({
          success: 0,
          message: permissionCheck.message || "No permission to edit YouTube links"
        });
      }
    } else {
      return res.status(401).send({
        success: 0,
        message: "Authentication required"
      });
    }

    // Validate input
    if (!youtubeUrl) {
      return res.status(400).send({
        success: 0,
        message: "YouTube URL is required"
      });
    }

    // Extract YouTube video ID
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      return res.status(400).send({
        success: 0,
        message: "Invalid YouTube URL"
      });
    }

    // Find video document
    const videoDoc = await Video.findOne();
    if (!videoDoc) {
      return res.status(404).send({
        success: 0,
        message: "Video document not found"
      });
    }

    const youtubeLinks = videoDoc.youtubeLinks || [];
    
    // Find the link to update
    const linkIndex = youtubeLinks.findIndex(
      link => link._id.toString() === linkId
    );

    if (linkIndex === -1) {
      return res.status(404).send({
        success: 0,
        message: "YouTube link not found"
      });
    }

    // Check if subadmin can edit this link
    const linkToUpdate = youtubeLinks[linkIndex];
    
    // If subadmin can only edit their own links
    if (linkToUpdate.addedBy && linkToUpdate.addedBy.toString() !== subAdmin._id.toString()) {
      return res.status(403).send({
        success: 0,
        message: "You can only edit YouTube links added by you"
      });
    }

    // Check if new video ID already exists (excluding current link)
    const duplicateLink = youtubeLinks.find(
      (link, index) => index !== linkIndex && link.videoId === videoId
    );
    
    if (duplicateLink) {
      return res.status(400).send({
        success: 0,
        message: "This YouTube video is already added"
      });
    }

    // Update the link
    youtubeLinks[linkIndex].url = youtubeUrl;
    youtubeLinks[linkIndex].videoId = videoId;
    youtubeLinks[linkIndex].thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    if (title) youtubeLinks[linkIndex].title = title;
    youtubeLinks[linkIndex].updatedAt = new Date();

    await videoDoc.save();

    return res.send({
      success: 1,
      message: "YouTube link updated successfully",
      data: youtubeLinks[linkIndex],
      updatedAt: youtubeLinks[linkIndex].updatedAt
    });

  } catch (error) {
    console.error('❌ Update YouTube Link Error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message || "Failed to update YouTube link"
    });
  }
};

// =============================================
// 4. DELETE YOUTUBE LINK (SUBADMIN)
// method: delete
// Endpoints: /video/delete-youtube-link/subAdmin/:linkId
// =============================================
const deleteYoutubeLink = async (req, res) => {
  try {
    const { linkId } = req.params;

    // 🔐 PERMISSION CHECK FOR SUBADMIN
    const subAdmin = req.subAdmin;
    if (subAdmin) {
      const permissionCheck = checkVideoPermission(subAdmin, 'delete');
      if (!permissionCheck.allowed) {
        return res.status(403).send({
          success: 0,
          message: permissionCheck.message || "No permission to delete YouTube links"
        });
      }
    } else {
      return res.status(401).send({
        success: 0,
        message: "Authentication required"
      });
    }

    // Find video document
    const videoDoc = await Video.findOne();
    if (!videoDoc) {
      return res.status(404).send({
        success: 0,
        message: "Video document not found"
      });
    }

    const youtubeLinks = videoDoc.youtubeLinks || [];
    const initialLength = youtubeLinks.length;
    
    // Find the link to delete
    const linkIndex = youtubeLinks.findIndex(
      link => link._id.toString() === linkId
    );

    if (linkIndex === -1) {
      return res.status(404).send({
        success: 0,
        message: "YouTube link not found"
      });
    }

    // Check if subadmin can delete this link
    const linkToDelete = youtubeLinks[linkIndex];
    
    // If subadmin can only delete their own links
    if (linkToDelete.addedBy && linkToDelete.addedBy.toString() !== subAdmin._id.toString()) {
      return res.status(403).send({
        success: 0,
        message: "You can only delete YouTube links added by you"
      });
    }

    // Remove the link
    videoDoc.youtubeLinks = youtubeLinks.filter(
      link => link._id.toString() !== linkId
    );

    await videoDoc.save();

    return res.send({
      success: 1,
      message: "YouTube link deleted successfully",
      deletedLink: linkToDelete,
      remainingLinks: videoDoc.youtubeLinks.length
    });

  } catch (error) {
    console.error('❌ Delete YouTube Link Error:', error);
    return res.status(500).send({
      success: 0,
      message: error.message || "Failed to delete YouTube link"
    });
  }
};




module.exports = { 
  createVideo, 
  getVideo, 
  upadateVideo, 
  addYoutubeLink,
  getYoutubeLinks,
  updateYoutubeLink,
  deleteYoutubeLink

};
