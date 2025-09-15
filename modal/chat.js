const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: {
    type: Date,
    default: () => {
      const now = new Date();
      const istOffset = 330 * 60 * 1000; // IST is UTC +5:30
      return new Date(now.getTime() + istOffset);
    }
  }
  });

const chatSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  doctorId: { type: String, required: true },
  channelId: { type: String, default: null },
  messages: [messageSchema]
});

chatSchema.index({ userId: 1, doctorId: 1 }, { unique: true });

module.exports = mongoose.model('Chat', chatSchema);
