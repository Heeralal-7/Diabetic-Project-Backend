const {Router} = require("express");
const { Usermembersship, getUserMembership } = require("../../../controllers/app/user/referal");

const {middlewere} = require("../../../middleware/auth")

const route = Router();

route.post("/Usermembersship",middlewere,Usermembersship)
route.get("/getUserMembership",middlewere,getUserMembership)
module.exports = route