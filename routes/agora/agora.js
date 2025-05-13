const { Router } = require("express");
const { generateAccessToken } = require("../../controllers/agora/agora");

const router = Router();
const nocache = (req, resp, next) => {
  resp.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  resp.header("Expires", "-1");
  resp.header("Pragma", "no-cache");
  next();
};

router.get("/access_token", nocache, generateAccessToken);

module.exports = router;
