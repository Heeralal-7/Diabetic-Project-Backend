const {Router} = require("express");
const { getClinic, getDoctor, getuserclinic, getAllClinic } = require("../../../../controllers/app/user/Clinic/clinic");
const {middlewere} = require("../../../../middleware/auth")
const router = Router();

router.post("/getAllClinic",getAllClinic)
router.get("/getClinic",getClinic)
router.get("/getDoctor",getDoctor)
router.get("/getuserclinic",getuserclinic)

module.exports = router ;