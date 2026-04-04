const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  room: { type: String, required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, default: '', trim: true },
  mediaUrl: { type: String, default: '' },
  mediaName: { type: String, default: '' },
  mediaSize: { type: Number, default: 0 },
  mimeType: { type: String, default: '' },
  read: { type: Boolean, default: false },
  type: { type: String, enum: ['text', 'image', 'video'], default: 'text' }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
