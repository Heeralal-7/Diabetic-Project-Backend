const {Router} = require("express");
const { firebaseNotification, EndCall, sendChatNotification } = require("../../../controllers/app/Docter/firebase");
const { doctorMiddleware } = require("../../../middleware/auth");
const User = require("../../../modal/user")
const route = Router()

route.post("/firebaseNotification",firebaseNotification)
route.post("/EndCall",doctorMiddleware,EndCall)
route.post("/sendChatNotification",sendChatNotification)

// end point /fire/updatetoken
route.post("/update-token", async (req, res) => {
  try {
    const { userId, regId } = req.body;
    
    // User dhundo aur uska regId field update kardo
    await User.findByIdAndUpdate(userId, { regId: regId });

    res.status(200).json({ success: true, message: "Token saved in Database" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
module.exports = route 