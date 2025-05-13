const Banner = require("../../../modal/adminBanner");

//admin upload the banner
//method:post
//Endpoints:/banner-image/banner
const banner = async (req, res) => {
  try {
    const data = await Banner.create({
      image1: req.files.image1 && `/admin/user/banner/${req.files.image1[0].filename}`,
      image2: req.files.image2 && `/admin/user/banner/${req.files.image2[0].filename}`,
      image3: req.files.image3 && `/admin/user/banner/${req.files.image3[0].filename}`,
      image4: req.files.image4 && `/admin/user/banner/${req.files.image4[0].filename}`,
      image5: req.files.image5 && `/admin/user/banner/${req.files.image5[0].filename}`,
      image6: req.files.image6 && `/admin/user/banner/${req.files.image6[0].filename}`,
    });

    return res.send({
      success: 1,
      message: "Uploaded successfully",
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

//admin update the  uploaded banner
//method:patch
//Endpoints:/banner-image/banner-update/id
const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id)
;
    if (!banner) {
      return res.send({
        success: 0,
        message: "Banner not found",
      });
    }

    await Banner.findByIdAndUpdate(
      id,
      {
        image1: `/admin/user/banner/${req.files.filename}` || banner.image1,
        image2:
          `/admin/user/banner/${req.files.image2[0].filename}` || banner.image2,
        image3:
          `/admin/user/banner/${req.files.image3[0].filename}` || banner.image3,
        image4:
          `/admin/user/banner/${req.files.image4[0].filename}` || banner.image4,
        image5:
          `/admin/user/banner/${req.files.image5[0].filename}` || banner.image5,
        image6:
          `/admin/user/banner/${req.files.image6[0].filename}` || banner.image6,
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

//user get the banner
//method:get
//Endpoints:/banner-image/get-banner
const getBanner = async (req, res) => {
  try {
    const data = await Banner.find({});
    if (!data) {
      return res.send({
        success: 0,
        message: "No data",
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

//upload banner managing through type
//Method:Post
//Endpoints:/banner-image/
const labBanner = async (req, res) => {
  try {
    const { type } = req.body;

    if (!type) {
      return res.status(400).send({
        success: 0,
        message: "Type is required",
      });
    }

    if (!req.files) {
      return res.status(400).send({
        success: 0,
        message: "No files uploaded",
      });
    }

    const bannerData = {
      image1: req.files.image1 ? `/admin/user/banner/${req.files.image1[0].filename}` : null,
      image2: req.files.image2 ? `/admin/user/banner/${req.files.image2[0].filename}` : null,
      image3: req.files.image3 ? `/admin/user/banner/${req.files.image3[0].filename}` : null,
      image4: req.files.image4 ? `/admin/user/banner/${req.files.image4[0].filename}` : null,
      image5: req.files.image5 ? `/admin/user/banner/${req.files.image5[0].filename}` : null,
      image6: req.files.image6 ? `/admin/user/banner/${req.files.image6[0].filename}` : null,
      type,
    };

    await Banner.create(bannerData);

    return res.send({
      success: 1,
      message: "Uploaded successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send({
      success: 0,
      message: error.message || "Internal Server Error",
    });
  }
};

const removeBanner = async (req, res) => {
  try {
   
    const { bannerId, imageField } = req.body; 



    const validFields = ['image1', 'image2', 'image3', 'image4', 'image5', 'image6'];  
    if (!validFields.includes(imageField)) {
      return res.status(400).send({
        success: 0,
        message: "Invalid image field."
      });
    }


    const updatedBanner = await Banner.findByIdAndUpdate(
      bannerId,
      { $set: { [imageField]: "" } }, 
      { new: true }
    );

    if (!updatedBanner) {
      return res.status(404).send({
        success: 0,
        message: "Banner not found."
      });
    }

    return res.send({
      success: 1,
      message: `${imageField} removed successfully.`,
      data: updatedBanner
    });

  } catch (error) {
    return res.status(500).send({
      success: 0,
      message: error.message
    });
  }
};


//update banner managing through type
//Method:patch
//Endpoints:/updated-banner/


const updatebanner = async(req,res)=>{

  try {
    const { type } = req.body; // Extract type from request body

    if (!type) {
      return res.status(400).send({
        success: 0,
        message: "Type is required",
      });
    }

    if (!req.files) {
      return res.status(400).send({
        success: 0,
        message: "No files uploaded",
      });
    }

    // Find the existing banner by type
    const existingBanner = await Banner.findOne({ type });
    if (!existingBanner) {
      return res.status(404).send({
        success: 0,
        message: "Banner not found",
      });
    }

    // Update only with provided files; keep existing values otherwise
    const updatedData = {
      image1: req.files.image1
        ? `/admin/user/banner/${req.files.image1[0].filename}`
        : existingBanner.image1,
      image2: req.files.image2
        ? `/admin/user/banner/${req.files.image2[0].filename}`
        : existingBanner.image2,
      image3: req.files.image3
        ? `/admin/user/banner/${req.files.image3[0].filename}`
        : existingBanner.image3,
      image4: req.files.image4
        ? `/admin/user/banner/${req.files.image4[0].filename}`
        : existingBanner.image4,
      image5: req.files.image5
        ? `/admin/user/banner/${req.files.image5[0].filename}`
        : existingBanner.image5,
      image6: req.files.image6
        ? `/admin/user/banner/${req.files.image6[0].filename}`
        : existingBanner.image6,
    };

    // Update the banner document by type
    const updatedBanner = await Banner.findOneAndUpdate(
      { type },
      updatedData,
      { new: true } // Return the updated document
    );

    return res.status(200).send({
      success: 1,
      message: "Updated successfully",
      details: updatedBanner,
    });
  } catch (error) {
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};




module.exports = { banner, updateBanner, getBanner, labBanner, removeBanner , updatebanner };
