const { Router } = require("express");
const { updateDriver } = require("../controllers/test");

const router = Router();

router.post("/", updateDriver);
// router.post("/generate", generateTokenZego);

module.exports = router;
