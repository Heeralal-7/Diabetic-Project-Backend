const axios = require('axios');
const { GoogleAuth } = require('google-auth-library');
const path = require('path');
const {  getAgoraToken,RtcRole } = require("../../agora/agora")
const Admin = require("../../../modal/adminlogin")
const FCM_URL = 'https://fcm.googleapis.com/v1/projects/genericdavawala-b5d62/messages:send';
const Doctor = require("../../../modal/docter")
const Appointment = require("../../../modal/Appointment");
const mongoose   = require("mongoose");
const User = require("../../../modal/user")
// 🔐 Function to generate Firebase Access Token
async function generateFirebaseToken() {
  try {
    const serviceAccountPath = path.resolve('./notificationfirebase.json');

    const auth = new GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });

    const client = await auth.getClient();
    const accessTokenResponse = await client.getAccessToken();
    return accessTokenResponse.token;
  } catch (error) {
    console.error('Error generating access token:', error.message);
    return null;
  }
}
  
async function sendNotification(regId, title, body, dataPayload) {
  try {
    const accessToken = await generateFirebaseToken();
    if (!accessToken) throw new Error("Access token not generated");

    const messagePayload = {
      message: {
        token: regId,
        notification: {
          title,
          body,
        },
        android: {
          notification: {
            sound: 'default'
          }
        },
        data: Object.fromEntries(
          Object.entries(dataPayload).map(([key, value]) => [key, String(value)])
        )
      }
    };

    console.log("📦 Final FCM Payload:", JSON.stringify(messagePayload, null, 2));

    const response = await axios.post(FCM_URL, messagePayload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Notification sent successfully:', response.data);
  } catch (error) {
    console.error('❌ Error sending notification:', error.response?.data || error.message);
  }
}

// 🔗 API Controller
const firebaseNotification = async (req, res) => {
  try {
    const { regId, channelName, doctorId, type, appointmentId } = req.body;

    if (!regId || !channelName || !doctorId || !type || !appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'regId, channelName, doctorId, type, and appointmentId are required',
      });
    }

    const doctorData = await Doctor.findById(doctorId);
    if (!doctorData) throw new Error("Doctor not found");

    const uid = "0"; // Fixed UID for Agora token
    const agoraToken = getAgoraToken(channelName, uid, RtcRole.PUBLISHER, 3600);

    const title = type === "video" ? "Video Call Invitation" : "Audio Call Invitation";
    const body = `Dr. ${doctorData.name || "Unknown"} invited you for a ${type} consultation`;

    const dataPayload = {
      agoraToken,
      channelName,
      doctorName: doctorData.name || '',
      doctorId: doctorData._id.toString(),
      profileImage: doctorData.image || '',
      type,
      appointmentId,
    };

    console.log("🚀 Sending Payload:", dataPayload);

    await sendNotification(regId, title, body, dataPayload);

    return res.status(200).json({
      success: true,
      message: 'Notification sent successfully.',
      details: dataPayload
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
 //     fire/EndCall
 const EndCall = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const doctorId = req.user.id;  // मानिए auth middleware ने req.user.id सेट किया है

    // Validate appointmentId
    if (
      !appointmentId ||
      !mongoose.Types.ObjectId.isValid(appointmentId)
    ) {
      return res.status(400).send({
        success: 0,
        message: "Valid appointmentId is required.",
      });
    }

    // Convert to ObjectId with `new`
    const appointmentObjId = new mongoose.Types.ObjectId(appointmentId);
    const doctorObjId      = new mongoose.Types.ObjectId(doctorId);

    // Fetch appointment and verify doctor
    const appt = await Appointment.findOne({
      _id: appointmentObjId,
      doctorId: doctorObjId,
    });
    if (!appt) {
      return res.status(404).send({
        success: 0,
        message: "Appointment not found or unauthorized.",
      });
    }

    // Update callStatus to "1" (ended)
    appt.callStatus = "1";  // अगर आपका schema Number है, use `1` instead of `"1"`
    await appt.save();

    return res.send({
      success: 1,
      message: "Call ended successfully.",
      appointmentId,
      callStatus: appt.callStatus,
    });
  } catch (error) {
    console.error("EndCall error:", error);
    return res.status(500).send({
      success: 0,
      message: error.message,
    });
  }
};
 

async function sendChatMessageNotification(regId, senderName, senderImage, message, chatType = "text") {
  try {
    const accessToken = await generateFirebaseToken();
    if (!accessToken) throw new Error("Access token not generated");

    const title = `New Message from ${senderName}`;
    const body = chatType === "image" ? "📷 Image" : message;

    const dataPayload = {
      senderName,
      senderImage,
      message,
      chatType,
    };

    const messagePayload = {
      message: {
        token: regId,
        notification: {
          title,
          body,
        },
        android: {
          notification: {
            sound: 'default'
          }
        },
        data: Object.fromEntries(
          Object.entries(dataPayload).map(([key, value]) => [key, String(value)])
        )
      }
    };

    await axios.post(FCM_URL, messagePayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Chat notification sent successfully.');
  } catch (error) {
    console.error('❌ Error sending chat notification:', error.response?.data || error.message);
  }
}
// fire/sendChatNotification

const sendChatNotification = async (req, res) => {
  try {
    const { regId, senderId, senderType, message, chatType } = req.body;

    if (!regId || !senderId || !senderType || !message) {
      return res.status(400).json({
        success: false,
        message: 'regId, senderId, senderRole, and message are required',
      });
    }

    let sender;
    if (senderType === "doctor") {
      sender = await Doctor.findById(senderId);
    } else if (senderType === "user") {
      sender = await User.findById(senderId);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid sender role' });
    }

    if (!sender) {
      return res.status(404).json({ success: false, message: 'Sender not found' });
    }

    await sendChatMessageNotification(
      regId,
      sender.name || "Unknown",
      sender.image || "",
      message,
      chatType || "text"
    );

    return res.status(200).json({
      success: true,
      message: "Chat message notification sent successfully"
    });

  } catch (error) {
    console.error("❌ Error in chat notification API:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



module.exports = { firebaseNotification ,EndCall, sendChatNotification,sendChatMessageNotification};
