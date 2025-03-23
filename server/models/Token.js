const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  tokenId: { type: String, required: true, unique: true },
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['qr', 'bluetooth', 'nfc'], required: true },
  status: { type: String, enum: ['active', 'redeemed'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Token', tokenSchema);