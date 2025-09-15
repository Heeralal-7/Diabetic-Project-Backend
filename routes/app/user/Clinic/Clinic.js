const {Router} = require("express");
const { getClinic, getDoctor, getuserclinic } = require("../../../../controllers/app/user/Clinic/clinic");
const {middlewere} = require("../../../../middleware/auth")
const router = Router();

router.get("/getClinic",getClinic)
router.get("/getDoctor",middlewere,getDoctor)
router.get("/getuserclinic",getuserclinic)

module.exports = router ;