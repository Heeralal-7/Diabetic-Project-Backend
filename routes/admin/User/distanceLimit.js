const express = require("express");
const { setDistanceLimit, getDistanceLimit, updateDistanceLimit } = require("../../../controllers/admin/User/distanceLimit");
const { adminMiddleware, middlewere, subAdminMiddleware } = require("../../../middleware/auth");
const { getUserDistanceLimit } = require("../../../controllers/app/user/distanceLimit");
const { setSubadDistanceLimit, getSubadDistanceLimit, updateSubadDistanceLimit } = require("../../../controllers/subadmin/user/distanceLimit");
const router = express.Router();
 
router.post("/post-distance-limit", adminMiddleware,setDistanceLimit)
router.get("/get-distance-limit", adminMiddleware,getDistanceLimit)
router.put("/update-distance-limit/:id", adminMiddleware,updateDistanceLimit)
 
 
router.post("/subadmin/post-distance-limit", subAdminMiddleware,setSubadDistanceLimit)
router.get("/subadmin/get-distance-limit", subAdminMiddleware,getSubadDistanceLimit)
router.put("/subadmin/update-distance-limit/:id", subAdminMiddleware,updateSubadDistanceLimit)
// for user
router.get("/getUser-distance-limit", middlewere,getUserDistanceLimit)
module.exports = router;
 