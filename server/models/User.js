const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  mobileNo: { type: String, required: true, unique: true },
  panCard: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mpin: { type: String, required: true }, // MPIN field, will be hashed
  balance: { type: Number, default: 0 },
  bankDetails: {
    accountNumber: { type: String, required: false },
    ifscCode: { type: String, required: false },
    bankName: { type: String, required: false },
  },
});

module.exports = mongoose.model('User', userSchema);