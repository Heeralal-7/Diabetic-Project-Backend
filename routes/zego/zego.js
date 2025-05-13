const { Router } = require("express");
const { generateTokenZego } = require("../../controllers/zego/zego");

const router = Router();

router.post("/", generateTokenZego);

module.exports = router;
