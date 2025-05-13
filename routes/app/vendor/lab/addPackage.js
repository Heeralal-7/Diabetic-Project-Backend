const { Router } = require("express");
const {
  createPackage,
  getAllPackages,
  deletePackage,
  updatePackage,
  getSinglePackage,
  updatePackageStatus,
  getpackagecategory,
  packagecategory,
  createPackageCategory,
  getPackagecollection,
} = require("../../../../controllers/app/vandor/lab/addPackage");
const { VendorMiddleware } = require("../../../../middleware/auth");

const router = Router();

router.post("/create-package", VendorMiddleware, createPackage);
router.get("/all-package", VendorMiddleware, getAllPackages);
router.delete("/delete", VendorMiddleware, deletePackage);
router.patch("/", VendorMiddleware, updatePackage);
router.get("/", VendorMiddleware, getSinglePackage);
router.patch("/status/:id", VendorMiddleware, updatePackageStatus);
router.get("/category" , getpackagecategory)
router.get("/allcategory" ,packagecategory )
router.post("/create-collectionPackage", VendorMiddleware, createPackageCategory);


module.exports = router;
