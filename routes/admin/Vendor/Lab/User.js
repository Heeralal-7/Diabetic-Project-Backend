const { Router } = require("express");
const { adminMiddleware } = require("../../../../middleware/auth");
const {
  getAllVendorsLists,
  searchVendor,
  getVendor,
  searchVendorTest,
  status,
  getlabstats,
  inActivlabs,
} = require("../../../../controllers/admin/Vendor/Lab/User");



const router = Router();

router.get("/", adminMiddleware, getAllVendorsLists);
router.get("/search", adminMiddleware, searchVendor);
router.get("/get-vendor/:id", adminMiddleware , getVendor)
router.get("/search-test" , adminMiddleware , searchVendorTest)
router.put("/active/:id" , adminMiddleware ,  status)
router.get("/getlabstats",adminMiddleware, getlabstats)
router.get("/inActivlabs", adminMiddleware,inActivlabs)
module.exports = router;
