const express = require("express");
const router = express.Router();
const sciencePageController = require("../../../controllers/subadmin/user/Science");
const upload = require("../../../middleware/Science");
const { subAdminMiddleware } = require("../../../middleware/auth");

// Get science page
router.get("/", subAdminMiddleware, sciencePageController.getSciencePageSubadmin);

// Update science page
router.put("/", subAdminMiddleware, sciencePageController.updateSciencePageSubadmin);

// Add item
router.post("/add-item", subAdminMiddleware, sciencePageController.addSciencePageItemSubadmin);

// Remove item
router.delete("/remove-item", subAdminMiddleware, sciencePageController.removeSciencePageItemSubadmin);

// Upload images
router.post(
  "/upload",
  subAdminMiddleware,
  upload.fields([
    { name: "heroBackgroundImage", maxCount: 1 },
    { name: "grantBackgroundImage", maxCount: 1 },
    { name: "researchImages", maxCount: 10 },
  ]),
  sciencePageController.uploadScienceImagesSubadmin
);

module.exports = router;
