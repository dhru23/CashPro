const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const { tokenize } = require("./blockchain");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/eRupeeWallet", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  mobileNo: { type: String, required: true, unique: true },
  panCard: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mpin: { type: String, required: true }, // Already exists, no change needed
  balance: { type: Number, default: 0 },
  bankDetails: {
    accountNumber: { type: String, required: false },
    ifscCode: { type: String, required: false },
    bankName: { type: String, required: false },
  },
});

const transactionSchema = new mongoose.Schema({
  userAddress: { type: String, required: true },
  type: {
    type: String,
    enum: ["deposit", "token_sent", "token_received"],
    required: true,
  },
  amount: { type: Number, required: true },
  tokenId: { type: String },
  method: { type: String, enum: ["qr", "bluetooth", "nfc"] },
  timestamp: { type: Date, default: Date.now },
});

const tokenSchema = new mongoose.Schema({
  tokenId: { type: String, required: true, unique: true },
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ["qr", "bluetooth", "nfc"] },
  isClaimed: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Transaction = mongoose.model("Transaction", transactionSchema);
const Token = mongoose.model("Token", tokenSchema);

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, "secret");
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

app.post("/register", async (req, res) => {
  const { email, name, mobileNo, panCard, password, mpin, bankDetails } =
    req.body;
  try {
    // Validate mandatory fields
    if (!email || !name || !mobileNo || !panCard || !password || !mpin) {
      return res
        .status(400)
        .json({
          error:
            "All fields (email, name, mobile number, PAN card, password, MPIN) are required",
        });
    }

    // Validate mobile number (10 digits)
    const mobileNoRegex = /^\d{10}$/;
    if (!mobileNoRegex.test(mobileNo)) {
      return res.status(400).json({ error: "Mobile number must be 10 digits" });
    }

    // Validate PAN card (format: ABCDE1234F)
    const panCardRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panCardRegex.test(panCard)) {
      return res
        .status(400)
        .json({ error: "PAN card must be in the format ABCDE1234F" });
    }

    // Validate MPIN (6 digits)
    const mpinRegex = /^\d{6}$/;
    if (!mpinRegex.test(mpin)) {
      return res.status(400).json({ error: "MPIN must be a 6-digit number" });
    }

    // Validate bank details if provided
    if (bankDetails) {
      const { accountNumber, ifscCode, bankName } = bankDetails;
      if (accountNumber || ifscCode || bankName) {
        if (!accountNumber || !ifscCode || !bankName) {
          return res
            .status(400)
            .json({
              error:
                "All bank details (account number, IFSC code, bank name) must be provided if linking a bank account",
            });
        }
        const accountNumberRegex = /^\d{9,18}$/;
        if (!accountNumberRegex.test(accountNumber)) {
          return res
            .status(400)
            .json({ error: "Account number must be between 9 and 18 digits" });
        }
        const ifscCodeRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (!ifscCodeRegex.test(ifscCode)) {
          return res
            .status(400)
            .json({ error: "IFSC code must be in the format ABCD0XXXXXX" });
        }
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedMpin = await bcrypt.hash(mpin, 10); // Hash the MPIN for security
    const user = new User({
      address: email,
      email,
      name,
      mobileNo,
      panCard,
      password: hashedPassword,
      mpin: hashedMpin, // Store the hashed MPIN
      bankDetails: bankDetails || {},
    });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res
      .status(400)
      .json({ error: "User registration failed: " + error.message });
  }
});

// Verify user with old MPIN or PAN card number
app.post("/verify-user", authMiddleware, async (req, res) => {
  const { oldMpin, panCard } = req.body;
  const userAddress = req.user.address;

  try {
    const user = await User.findOne({ address: userAddress });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let verified = false;
    if (oldMpin) {
      // Verify old MPIN (compare with hashed MPIN in the database)
      verified = await bcrypt.compare(oldMpin, user.mpin);
    } else if (panCard) {
      // Verify PAN card number
      verified = user.panCard === panCard;
    } else {
      return res.status(400).json({ error: "Please provide either old MPIN or PAN card number" });
    }

    if (!verified) {
      return res.status(400).json({ verified: false, error: "Invalid MPIN or PAN card number" });
    }

    res.json({ verified: true });
  } catch (error) {
    console.error("Error verifying user:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update MPIN
app.post("/update-mpin", authMiddleware, async (req, res) => {
  const { newMpin } = req.body;
  const userAddress = req.user.address;

  try {
    // Validate new MPIN (6 digits)
    const mpinRegex = /^\d{6}$/;
    if (!newMpin || !mpinRegex.test(newMpin)) {
      return res.status(400).json({ error: "New MPIN must be a 6-digit number" });
    }

    const user = await User.findOne({ address: userAddress });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Hash the new MPIN before saving
    const hashedMpin = await bcrypt.hash(newMpin, 10);
    user.mpin = hashedMpin;
    await user.save();

    res.json({ message: "MPIN updated successfully" });
  } catch (error) {
    console.error("Error updating MPIN:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  const { mobileNo, password } = req.body;
  try {
    const user = await User.findOne({ mobileNo });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ address: user.address }, "secret", {
      expiresIn: "1h",
    });
    res.status(200).json({ token, address: user.address });
  } catch (error) {
    res.status(500).json({ error: "Login failed: " + error.message });
  }
});

app.get("/balance", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ address: req.user.address });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json({ balance: user.balance });
  } catch (error) {
    res.status(500).json({ error: "Error fetching balance: " + error.message });
  }
});

app.post("/deposit", authMiddleware, async (req, res) => {
  const { amount } = req.body;
  try {
    if (!amount || isNaN(amount) || amount <= 0) {
      return res
        .status(400)
        .json({ error: "Invalid amount: Amount must be a positive number" });
    }

    const user = await User.findOne({ address: req.user.address });
    if (!user) return res.status(404).json({ error: "User not found" });

    user.balance += parseInt(amount);
    await user.save();

    const transaction = new Transaction({
      userAddress: user.address,
      type: "deposit",
      amount,
    });
    await transaction.save();

    res
      .status(200)
      .json({ message: "Deposit successful", balance: user.balance });
  } catch (error) {
    res.status(500).json({ error: "Deposit failed: " + error.message });
  }
});

app.get("/transactions", authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userAddress: req.user.address,
    });
    res.status(200).json(transactions);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching transactions: " + error.message });
  }
});

app.post("/createToken", authMiddleware, async (req, res) => {
  const { receiver, amount, method } = req.body;
  const sender = req.user.address;

  console.log("Request body:", req.body);
  console.log("Sender from token:", sender);

  try {
    if (!receiver) {
      console.log("Validation failed: Receiver address is required");
      return res.status(400).json({ error: "Receiver address is required" });
    }
    if (!amount || isNaN(amount) || amount <= 0) {
      console.log("Validation failed: Invalid amount", { amount });
      return res
        .status(400)
        .json({ error: "Invalid amount: Amount must be a positive number" });
    }

    const senderUser = await User.findOne({ address: sender });
    if (!senderUser) {
      console.log("Sender not found:", sender);
      return res.status(404).json({ error: "Sender not found" });
    }
    console.log("Sender user data:", senderUser);

    if (senderUser.balance < amount) {
      console.log("Insufficient balance:", {
        balance: senderUser.balance,
        amount,
      });
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const tokenId = await tokenize(amount, sender);
    console.log("Generated tokenId:", tokenId);

    const receiverUser =
      (await User.findOne({ address: receiver })) ||
      new User({
        address: receiver,
        email: `${receiver}@temp.com`,
        name: "Temporary User",
        mobileNo: "0000000000",
        panCard: "ABCDE1234F",
        password: "temp",
        mpin: await bcrypt.hash("000000", 10), // Default 6-digit MPIN for temporary user, hashed
      });
    if (!receiverUser._id) {
      await receiverUser.save();
      console.log("Created new receiver user:", receiverUser);
    }

    senderUser.balance -= parseInt(amount);
    await senderUser.save();
    console.log("Updated sender balance:", senderUser.balance);

    const token = new Token({
      tokenId,
      sender,
      receiver,
      amount,
      method,
      isClaimed: false,
    });
    await token.save();
    console.log("Created token:", token);

    const transaction = new Transaction({
      userAddress: sender,
      type: "token_sent",
      amount,
      tokenId,
      method,
    });
    await transaction.save();
    console.log("Created transaction:", transaction);

    const responseData = {
      message: "Token created successfully",
      tokenId: tokenId || "unknown",
      amount: parseInt(amount) || 0,
      timestamp: transaction.timestamp
        ? transaction.timestamp.toISOString()
        : new Date().toISOString(),
      senderAddress: sender || "unknown",
      name: senderUser.name || "unknown",
    };

    console.log("Response from /createToken:", responseData);

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error in /createToken:", error);
    res.status(500).json({ error: `Token creation failed: ${error.message}` });
  }
});

app.post("/claimToken", authMiddleware, async (req, res) => {
  const { tokenId } = req.body;
  const receiver = req.user.address;
  try {
    if (!tokenId)
      return res.status(400).json({ error: "Token ID is required" });

    const token = await Token.findOne({ tokenId });
    if (!token) return res.status(404).json({ error: "Token not found" });
    if (token.isClaimed)
      return res.status(400).json({ error: "Token already claimed" });
    if (token.receiver !== receiver)
      return res
        .status(403)
        .json({ error: "You are not the intended receiver" });

    const receiverUser = await User.findOne({ address: receiver });
    if (!receiverUser)
      return res.status(404).json({ error: "Receiver not found" });

    receiverUser.balance += token.amount;
    token.isClaimed = true;
    await Promise.all([receiverUser.save(), token.save()]);

    const transaction = new Transaction({
      userAddress: receiver,
      type: "token_received",
      amount: token.amount,
      tokenId,
    });
    await transaction.save();

    res
      .status(200)
      .json({
        message: "Token claimed successfully",
        balance: receiverUser.balance,
      });
  } catch (error) {
    res.status(500).json({ error: "Token claim failed: " + error.message });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
