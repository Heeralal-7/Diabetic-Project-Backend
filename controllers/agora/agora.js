const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const Admin = require("../../modal/adminlogin");
const Chat = require("../../modal/chat")
const Doctor = require("../../modal/docter")
const User = require("../../modal/user")
const APP_ID = process.env.AGORA_APP_ID;
const path = require('path');
const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');
const FCM_URL = 'https://fcm.googleapis.com/v1/projects/dibeteswala/messages:send';

const APP_CERTIFICATE = process.env.AGORA_CERTIFICATE;
// const sendChatMessageNotification = require("../app/Docter/firebase")
// Pure function to generate Agora token
function getAgoraToken(channelName, uid = "0", role = RtcRole.PUBLISHER, expireTime = 3600) {
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;

  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    role,
    privilegeExpireTime
  );

  return token;
}


// Express route handler (optional API endpoint)
const generateAccessToken = async (req, res) => {
  try {
    res.header("Access-Control-Allow-Origin", "*");

    const channelName = req.query.channelName;
    if (!channelName) {
      return res.status(400).json({ success: false, message: "channelName is required" });
    }

    const uid = "0";  // Always use uid = "0"
    const role = req.query.role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    const expireTime = parseInt(req.query.expireTime || "3600", 10);

    const token = getAgoraToken(channelName, uid, role, expireTime);

    return res.json({
      success: true,
      message: "Token created successfully",
      details: { token },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

async function generateFirebaseToken() {
  try {
    const serviceAccountPath = path.resolve('./notificationfirebase.json');
    const auth = new GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });
    const client = await auth.getClient();
    const { token } = await client.getAccessToken();
    return token;
  } catch (err) {
    console.error('Error generating access token:', err.message);
    return null;
  }
}



async function sendChatMessageNotification(regId, senderName, senderImage, message, chatType = 'text') {
  try {
    console.log('🔔 Sending notification to regId:', regId);

    const accessToken = await generateFirebaseToken();
    if (!accessToken) throw new Error('Access token not generated');

    const title = `New Message from ${senderName}`;
    const body  = chatType === 'image' ? '📷 Image' : message;

    const dataPayload = { senderName, senderImage, message, chatType };
    const messagePayload = {
      message: {
        token: regId,
        notification: { title, body },
        android: { notification: { sound: 'default' } },
        data: Object.fromEntries(
          Object.entries(dataPayload).map(([k,v]) => [k, String(v)])
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
  } catch (err) {
    console.error('❌ Error sending chat notification:', err.response?.data || err.message);
    // Do NOT auto-remove the token—just log it so you can address it
  }
}


// agora/chatuser
const chatuser = async (req, res) => {
  try {
    const { senderId, receiverId, message, senderType, channelId } = req.body;
    if (!senderId || !receiverId || !message || !senderType) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    let userId, doctorId;
    if (senderType === 'doctor') {
      doctorId = senderId;
      userId   = receiverId;
    } else if (senderType === 'user') {
      userId   = senderId;
      doctorId = receiverId;
    } else {
      return res.status(400).json({ success:false, message:'Invalid senderType' });
    }

    // Fetch sender for notification metadata
    const sender = senderType === 'doctor'
      ? await Doctor.findById(senderId).select('name image')
      : await User.findById(senderId).select('name image');
    if (!sender) return res.status(404).json({ success:false, message:'Sender not found' });

    // Upsert the chat document
    let chat = await Chat.findOne({ userId, doctorId });
    if (!chat) {
      chat = new Chat({ userId, doctorId, channelId: channelId||null, messages:[{ senderId, message }] });
    } else {
      chat.messages.push({ senderId, message });
    }
    await chat.save();

    // Update chatStatus
    if (senderType === 'doctor') {
      await Doctor.findByIdAndUpdate(doctorId, { chatStatus:'1' });
      await User.findByIdAndUpdate(userId,   { chatStatus:'2' });
    } else {
      await User.findByIdAndUpdate(userId,   { chatStatus:'1' });
      await Doctor.findByIdAndUpdate(doctorId,{ chatStatus:'2' });
    }

    // Fetch receiver record—including regId—and log it
    let receiver;
    if (senderType === 'doctor') {
      receiver = await User.findById(userId).select('regId name');
    } else {
      receiver = await Doctor.findById(doctorId).select('regId name');
    }
    console.log('🔍 Receiver record:', receiver);

    // Now attempt notification if regId truly exists
    if (receiver && typeof receiver.regId === 'string' && receiver.regId.trim() !== '') {
      console.log('🔔 Sending notification to regId:', receiver.regId);
      await sendChatMessageNotification(
        receiver.regId,
        sender.name,
        sender.image,
        message,
        'text'
      );
    } else {
      console.warn('⚠️ Receiver.regId is missing or empty—skipping notification');
    }

    return res.json({ success:true, message:'Message saved, statuses updated, notification attempted' });
  }
  catch (err) {
    console.error('Error in chatuser:', err);
    return res.status(500).json({ success:false, message:err.message });
  }
};


   
// const getchat 
// agora/getChat
const getChat = async (req, res) => {
  try {
    const { userId, doctorId } = req.query;

    if (!userId || !doctorId) {
      return res.status(400).json({ success: false, message: "Missing userId or doctorId" });
    }

    const chat = await Chat.findOne({ userId, doctorId }).lean();

    if (!chat) {
      return res.status(200).json({ success: false, message: "No chat found between user and doctor" });
    }

    // Fetch user and doctor to get their chatStatus
    const user = await User.findById(userId).select("chatStatus");
    const doctor = await Doctor.findById(doctorId).select("chatStatus");

    // Add senderType to each message
    const formattedMessages = chat.messages.map((msg) => ({
      ...msg,
      senderType: msg.senderId.toString() === doctorId ? "doctor" : "user"
    }));

    return res.status(200).json({
      success: true,
      message: "Chat fetched successfully",
      data: {
        channelId: chat.channelId,
        messages: formattedMessages,
        chatStatus: {
          user: user?.chatStatus || "",
          doctor: doctor?.chatStatus || ""
        }
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};



module.exports = { generateAccessToken, getAgoraToken, RtcRole, chatuser,getChat };
