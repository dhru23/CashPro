import React, { useState, useEffect } from "react";
import axios from "axios";
import QRCode from "qrcode";
import "./Wallet.css";

function Wallet({ token }) {
  const [address] = useState(localStorage.getItem("address") || "");
  const [receiver, setReceiver] = useState("");
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [message, setMessage] = useState("");
  const [convertAmount, setConvertAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferMethod, setTransferMethod] = useState("");
  const [transferStatus, setTransferStatus] = useState("");
  const [showTransferSection, setShowTransferSection] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isTransferInitiated, setIsTransferInitiated] = useState(false);

  const fetchData = async () => {
    try {
      const [balanceRes, transRes] = await Promise.all([
        axios.get("http://localhost:5000/balance", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/transactions", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setBalance(balanceRes.data.balance);
      setTransactions(transRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setMessage(error.response?.data?.error || "Error fetching data");
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token, fetchData]);

  const convertToECash = async () => {
    try {
      if (!convertAmount || isNaN(convertAmount) || convertAmount <= 0) {
        setMessage("Please enter a valid amount to convert");
        return;
      }
      const response = await axios.post(
        "http://localhost:5000/deposit",
        { amount: convertAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(response.data.message);
      setBalance(response.data.balance);
      setConvertAmount("");
      fetchData();
    } catch (error) {
      console.error("Error converting to E-Cash:", error);
      setMessage(error.response?.data?.error || "Error converting to E-Cash");
    }
  };

  const createToken = async (method = "") => {
    if (!receiver) {
      console.log("Validation failed: Receiver address is required");
      setTransferStatus("Please enter a receiver address");
      setIsTransferInitiated(false);
      setQrCodeData(null);
      setQrCodeUrl("");
      return false;
    }
    if (!transferAmount || isNaN(transferAmount) || transferAmount <= 0) {
      console.log("Validation failed: Invalid transfer amount", {
        transferAmount,
      });
      setTransferStatus("Please enter a valid amount to transfer");
      setIsTransferInitiated(false);
      setQrCodeData(null);
      setQrCodeUrl("");
      return false;
    }

    try {
      setIsTransferInitiated(true);
      console.log("Sending request to /createToken:", {
        receiver,
        amount: transferAmount,
        method,
      });

      const response = await axios.post(
        "http://localhost:5000/createToken",
        {
          receiver,
          amount: transferAmount,
          method: method || "default",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("API Response from /createToken:", response.data);

      if (!response.data.tokenId) {
        throw new Error("Token ID is missing in the response");
      }
      if (response.data.amount === undefined) {
        console.warn(
          "Amount is missing in the response, using fallback:",
          transferAmount
        );
        response.data.amount = parseInt(transferAmount);
      }
      if (!response.data.timestamp) {
        console.warn(
          "Timestamp is missing in the response, using fallback:",
          new Date().toISOString()
        );
        response.data.timestamp = new Date().toISOString();
      }
      if (!response.data.senderAddress) {
        console.warn(
          "Sender address is missing in the response, using fallback:",
          address
        );
        response.data.senderAddress = address || "unknown";
      }
      if (!response.data.name) {
        console.warn(
          "Name is missing in the response, using fallback:",
          "unknown"
        );
        response.data.name = "unknown";
      }

      if (method === "qr") {
        const qrData = {
          tokenId: response.data.tokenId,
          amount: response.data.amount,
          timestamp: response.data.timestamp,
          senderAddress: response.data.senderAddress,
          name: response.data.name,
        };
        setQrCodeData(qrData);

        console.log("qrData before encoding:", qrData);

        for (const [key, value] of Object.entries(qrData)) {
          if (value === undefined) {
            throw new Error(`Field ${key} is undefined in qrData`);
          }
        }

        const qrString = JSON.stringify(qrData);
        const qrCodeDataUrl = await QRCode.toDataURL(qrString, { width: 256 });
        setQrCodeUrl(qrCodeDataUrl);

        console.log("QR Code String:", qrString);
        console.log("QR Code Data URL:", qrCodeDataUrl);
      } else {
        setQrCodeData(null);
        setQrCodeUrl("");
      }

      setMessage(response.data.message || "Token created");
      setTransferStatus(
        method
          ? `Transfer via ${method.toUpperCase()} successful`
          : "Token created successfully"
      );
      setReceiver("");
      setTransferAmount("");
      setTransferMethod(method);
      setIsTransferInitiated(false);
      fetchData();
      return true;
    } catch (error) {
      console.error("Error creating token:", error);
      setTransferStatus(
        error.response?.data?.error || `Error creating token: ${error.message}`
      );
      setQrCodeData(null);
      setQrCodeUrl("");
      setIsTransferInitiated(false);
      return false;
    }
  };

  const showTransferOptions = (method) => {
    setTransferMethod(method);
    setShowTransferSection(true);
    setTransferStatus("");
    setQrCodeData(null);
    setQrCodeUrl("");
    setIsTransferInitiated(false);
  };

  const initiateTransfer = async () => {
    const success = await createToken(transferMethod);
    if (!success) {
      return;
    }
  };

  const claimToken = async (tokenId) => {
    try {
      if (!tokenId) {
        setMessage("Please provide a valid token ID to claim");
        return;
      }
      const response = await axios.post(
        "http://localhost:5000/claimToken",
        { tokenId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(response.data.message);
      setBalance(response.data.balance);
      fetchData();
    } catch (error) {
      console.error("Error claiming token:", error);
      setMessage(error.response?.data?.error || "Error claiming token");
    }
  };

  const tokens = transactions
    .filter((tx) => tx.tokenId && tx.type === "token_sent")
    .map((tx) => tx.tokenId);
  const receivableTokens = transactions
    .filter(
      (tx) =>
        tx.tokenId && tx.type === "token_sent" && tx.userAddress !== address
    )
    .map((tx) => tx.tokenId);

  return (
    <div className="wallet-container">
      <header className="wallet-header">
        <h1>e-Rupee Wallet</h1>
        <p className="wallet-address">Address: {address}</p>
      </header>

      <div className="wallet-card">
        <div className="wallet-balance">
          <h2>Balance: ₹{balance !== null ? balance : 0}</h2>
          <p className="wallet-tokens">Tokens Sent: {tokens.length || 0}</p>
          <p className="wallet-transactions">
            Transactions: {transactions.length}
          </p>
        </div>

        <div className="convert-section">
          <h3>Convert to E-Cash</h3>
          <div className="input-group">
            <input
              type="number"
              placeholder="Enter amount (e.g., 1000)"
              value={convertAmount}
              onChange={(e) => setConvertAmount(e.target.value)}
              className={convertAmount ? "filled" : ""}
            />
            <label>Amount</label>
          </div>
          <button onClick={convertToECash} className="action-button">
            Convert via UPI
          </button>
          {message && (
            <p
              className={`message ${
                message.includes("successful") ? "success" : "error"
              }`}
            >
              {message}
            </p>
          )}
        </div>

        <div className="actions-section">
          <h3>Transfer E-Cash</h3>
          <div className="transfer-options">
            <button
              onClick={() => showTransferOptions("qr")}
              className="action-tile"
            >
              <span className="action-icon">📷</span>
              <span className="action-label">QR Code</span>
            </button>
            <button
              onClick={() => showTransferOptions("bluetooth")}
              className="action-tile"
            >
              <span className="action-icon">📡</span>
              <span className="action-label">Bluetooth</span>
            </button>
            <button
              onClick={() => showTransferOptions("nfc")}
              className="action-tile"
            >
              <span className="action-icon">📱</span>
              <span className="action-label">NFC (Mock)</span>
            </button>
          </div>
        </div>

        {showTransferSection && (
          <div className="transfer-section">
            <h3>Transfer via {transferMethod.toUpperCase()}</h3>
            <div className="input-group">
              <input
                type="number"
                placeholder="Enter amount (e.g., 500)"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className={transferAmount ? "filled" : ""}
              />
              <label>Amount</label>
            </div>
            <div className="input-group">
              <input
                placeholder="Receiver Address"
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                className={receiver ? "filled" : ""}
              />
              <label>Receiver Address</label>
            </div>
            <button onClick={initiateTransfer} className="action-button">
              Initiate Transfer
            </button>
            {transferMethod === "qr" && qrCodeUrl && (
              <div className="qr-code">
                <p>{isTransferInitiated ? "Processing..." : "Scan to Claim"}</p>
                <img src={qrCodeUrl} alt="QR Code" />
              </div>
            )}
            {transferStatus && (
              <p
                className={`message ${
                  transferStatus.includes("successful") ? "success" : "error"
                }`}
              >
                {transferStatus}
              </p>
            )}
          </div>
        )}

        <div className="incentives-section">
          <h3>Incentives</h3>
          <p>Consumer: Earn 2% cashback on every transfer!</p>
          <p>Merchant: 0% MDR on first 100 transactions!</p>
        </div>

        <div className="claim-section">
          <h3>Claim Received Tokens</h3>
          {receivableTokens.length ? (
            receivableTokens.map((tokenId) => (
              <div key={tokenId} className="claim-item">
                <span>{tokenId}</span>
                <button
                  onClick={() => claimToken(tokenId)}
                  className="claim-button"
                >
                  Claim
                </button>
              </div>
            ))
          ) : (
            <p>No tokens to claim</p>
          )}
        </div>

        <div className="transactions-section">
          <h3>Transaction History</h3>
          {transactions.length ? (
            <ul className="transaction-list">
              {transactions.map((tx) => (
                <li key={tx._id} className="transaction-item">
                  <span>
                    {tx.type} - ₹{tx.amount}
                  </span>
                  <span>{tx.tokenId ? `(Token: ${tx.tokenId})` : ""}</span>
                  <span>{tx.method ? `(Method: ${tx.method})` : ""}</span>
                  <span>{new Date(tx.timestamp).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No transactions yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Wallet;
