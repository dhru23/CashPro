const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userAddress: { type: String, required: true },
  type: { type: String, enum: ['deposit', 'token_sent', 'token_received'], required: true },
  amount: { type: Number, required: true },
  tokenId: { type: String },
  method: { type: String, enum: ['qr', 'bluetooth', 'nfc'] },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);