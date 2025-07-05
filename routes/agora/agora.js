const { Router } = require("express");
const { generateAccessToken, chatuser, getChat } = require("../../controllers/agora/agora");

const router = Router();
const nocache = (req, resp, next) => {
  resp.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  resp.header("Expires", "-1");
  resp.header("Pragma", "no-cache");
  next();
};

router.get("/access_token", nocache, generateAccessToken);
router.post("/chatuser",chatuser)
router.get("/getChat",getChat)
module.exports = router;
