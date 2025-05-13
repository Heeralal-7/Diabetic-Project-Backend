const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const Admin = require("../../modal/adminlogin");

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_CERTIFICATE;

const generateAccessToken = async (req, res) => {
  try {
    res.header("Access-Control-Allow-Origin", "*");
    const channelName = req.query.channelName;
    if (!channelName) {
      return res.status(500).json({ error: "channel is required" });
    }
    // get uid

    // get role
    let role = RtcRole.SUBSCRIBER;
    if (req.query.role == "publisher") {
      role = RtcRole.PUBLISHER;
    }
    // get the expire time
    let expireTime = req.query.expireTime;
    if (!expireTime || expireTime == "") {
      expireTime = 3600;
    } else {
      expireTime = parseInt(expireTime, 10);
    }

    // calculate privilege expire time
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expireTime;
    // find admin
    const isExist = await Admin.find({});

    let uid = isExist[0]._id;
    if (!uid || uid == "") {
      uid = 0;
    }
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      role
      //   privilegeExpireTime
    );
    return res.send({
      success: 0,
      message: "Token created successfully",
      details: {
        token,
      },
    });
  } catch (error) {
    return res.send({
      success: 0,
      message: error.message,
    });
  }
};

module.exports = { generateAccessToken };
