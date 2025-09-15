const {Router} = require("express");
const { firebaseNotification, EndCall, sendChatNotification } = require("../../../controllers/app/Docter/firebase");
const { doctorMiddleware } = require("../../../middleware/auth");

const route = Router()

route.post("/firebaseNotification",firebaseNotification)
route.post("/EndCall",doctorMiddleware,EndCall)
route.post("/sendChatNotification",sendChatNotification)
module.exports = route 