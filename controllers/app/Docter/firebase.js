const axios = require('axios');
const { GoogleAuth } = require('google-auth-library');
const path = require('path');
const fs = require('fs'); // File system import karein
const { getAgoraToken, RtcRole } = require("../../agora/agora");
const Doctor = require("../../../modal/docter");
const Appointment = require("../../../modal/Appointment");
const mongoose = require("mongoose");
const User = require("../../../modal/user");

// 🔐 Load Service Account once and get Project ID
const serviceAccountPath = path.resolve('./notificationfirebase.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
const PROJECT_ID = serviceAccount.project_id;
const FCM_URL = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

async function generateFirebaseToken() {
  try {
    const auth = new GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });
    const client = await auth.getClient();
    const accessTokenResponse = await client.getAccessToken();
    return accessTokenResponse.token;
  } catch (error) {
    console.error('❌ Error generating access token:', error.message);
    return null;
  }
}

// 📨 Generic helper for sending any notification
async function sendFcmMessage(messagePayload) {
  try {
    const accessToken = await generateFirebaseToken();
    if (!accessToken) throw new Error("Access token not generated");

    const response = await axios.post(FCM_URL, { message: messagePayload }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('❌ FCM Send Error:', error.response?.data || error.message);
    throw error; // Re-throw so the controller knows it failed
  }
}

// 🔗 API Controller for Calls
const firebaseNotification = async (req, res) => {
  try {
    const { regId, channelName, doctorId, type, appointmentId } = req.body;

    if (!regId || !channelName || !doctorId || !type || !appointmentId) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const doctorData = await Doctor.findById(doctorId);
    if (!doctorData) throw new Error("Doctor not found");

    const uid = "0"; 
    const agoraToken = getAgoraToken(channelName, uid, RtcRole.PUBLISHER, 3600);

    const title = type === "video" ? "Video Call Invitation" : "Audio Call Invitation";
    const body = `Dr. ${doctorData.name || "Unknown"} invited you for a ${type} consultation`;

    const messagePayload = {
      token: regId,
      notification: { title, body },
      android: { notification: { sound: 'default' } },
      data: {
        agoraToken: String(agoraToken),
        channelName: String(channelName),
        doctorName: String(doctorData.name || ''),
        doctorId: String(doctorData._id),
        profileImage: String(doctorData.image || ''),
        type: String(type),
        appointmentId: String(appointmentId),
        callAction: "incoming_call"
      }
    };

    await Appointment.findByIdAndUpdate(appointmentId, { callStatus: "0" });
    await sendFcmMessage(messagePayload);

    return res.status(200).json({
      success: true,
      message: 'Notification sent successfully.',
      details: messagePayload.data
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const sendChatNotification = async (req, res) => {
  try {
    const { regId, senderId, senderType, message, chatType } = req.body;

    if (!regId || !senderId || !senderType || !message) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    let sender = senderType === "doctor" ? await Doctor.findById(senderId) : await User.findById(senderId);
    if (!sender) return res.status(404).json({ success: false, message: 'Sender not found' });

    const title = `New Message from ${sender.name}`;
    const body = chatType === "image" ? "📷 Image" : message;

    const messagePayload = {
      token: regId,
      notification: { title, body },
      android: { notification: { sound: "default" } },
      webpush: { notification: { icon: "/logo192.png" } },
      data: {
        senderName: String(sender.name || "Unknown"),
        senderImage: String(sender.image || ""),
        message: String(message),
        chatType: String(chatType || "text"),
      }
    };

    await sendFcmMessage(messagePayload);

    return res.status(200).json({ success: true, message: "Chat notification sent" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// EndCall logic unchanged but ensuring req.user.id exists
const EndCall = async (req, res) => {
    try {
      const { appointmentId } = req.body;
      if (!req.user || !req.user.id) throw new Error("Unauthorized");
      
      const appointmentObjId = new mongoose.Types.ObjectId(appointmentId);
      const doctorObjId      = new mongoose.Types.ObjectId(req.user.id);
  
      const appt = await Appointment.findOneAndUpdate(
        { _id: appointmentObjId, doctorId: doctorObjId },
        { callStatus: "2" },
        { new: true }
      );
  
      if (!appt) return res.status(404).send({ success: 0, message: "Appointment not found" });
  
      return res.send({ success: 1, message: "Call ended successfully.", appointmentId });
    } catch (error) {
      return res.status(500).send({ success: 0, message: error.message });
    }
};

module.exports = { firebaseNotification, EndCall, sendChatNotification };