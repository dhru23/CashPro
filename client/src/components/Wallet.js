import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import QRCode from "qrcode";
import "./Wallet.css";

function Wallet({ token, logout }) {
  const [address] = useState(localStorage.getItem("address") || "");
  const [receiver, setReceiver] = useState("");
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [message, setMessage] = useState("");
  const [convertAmount, setConvertAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferMethod, setTransferMethod] = useState("");
  const [transferStatus, setTransferStatus] = useState("");
  const [qrCodeData, setQrCodeData] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isTransferInitiated, setIsTransferInitiated] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [storedQrCode, setStoredQrCode] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [testInput, setTestInput] = useState(""); // Separate state for test input

  // Refs for input fields
  const receiverInputRef = useRef(null);
  const transferAmountInputRef = useRef(null);
  const convertAmountInputRef = useRef(null);

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
  }, [token]);

  // Log state changes to confirm updates
  useEffect(() => {
    console.log("Receiver State Updated:", receiver);
    if (receiverInputRef.current) {
      console.log("Receiver Input DOM Value:", receiverInputRef.current.value);
      // Force DOM update
      receiverInputRef.current.value = receiver;
    }
  }, [receiver]);

  useEffect(() => {
    console.log("Transfer Amount State Updated:", transferAmount);
    if (transferAmountInputRef.current) {
      console.log("Transfer Amount Input DOM Value:", transferAmountInputRef.current.value);
      transferAmountInputRef.current.value = transferAmount;
    }
  }, [transferAmount]);

  useEffect(() => {
    console.log("Test Input State Updated:", testInput);
  }, [testInput]);

  // Add a global event listener to debug input events
  useEffect(() => {
    const handleInputEvent = (e) => {
      console.log("Input Event Captured:", e.type, e.target);
    };

    const handleKeyDown = (e) => {
      console.log("KeyDown Event Captured:", e.key, e.target);
    };

    const handleKeyPress = (e) => {
      console.log("KeyPress Event Captured:", e.key, e.target);
    };

    document.addEventListener("input", handleInputEvent);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keypress", handleKeyPress);

    return () => {
      document.removeEventListener("input", handleInputEvent);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keypress", handleKeyPress);
    };
  }, []);

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
      setTransferStatus("Please enter a receiver address or phone number");
      setIsTransferInitiated(false);
      setQrCodeData(null);
      setQrCodeUrl("");
      setPaymentDetails(null);
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
      setPaymentDetails(null);
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

      const details = {
        method,
        amount: transferAmount,
        senderAddress: address,
        receiverAddress: receiver,
        tokenId: response.data.tokenId,
        timestamp: response.data.timestamp,
      };

      if (method === "qr" || method === "number") {
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
        details.qrCodeUrl = qrCodeDataUrl;

        setStoredQrCode({
          url: qrCodeDataUrl,
          amount: transferAmount,
          receiver,
        });

        console.log("QR Code String:", qrString);
        console.log("QR Code Data URL:", qrCodeDataUrl);
      } else {
        setQrCodeData(null);
        setQrCodeUrl("");
      }

      setPaymentDetails(details);
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
      setPaymentDetails(null);
      setIsTransferInitiated(false);
      return false;
    }
  };

  const showTransferOptions = (method) => {
    setTransferMethod(method);
    setTransferStatus("");
    setQrCodeData(null);
    setQrCodeUrl("");
    setPaymentDetails(null);
    setIsTransferInitiated(false);

    let content;
    if (method === "convert") {
      content = (
        <>
          <h3>Convert to E-Cash</h3>
          <div className="input-group">
            <input
              type="number"
              placeholder="Enter amount (e.g., 1000)"
              value={convertAmount}
              onChange={(e) => {
                console.log("Convert Amount Input:", e.target.value);
                setConvertAmount(e.target.value);
              }}
              ref={convertAmountInputRef}
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
        </>
      );
    } else if (method === "request") {
      content = (
        <>
          <h3>Request Money</h3>
          <p>Feature coming soon: Request money from contacts.</p>
        </>
      );
    } else if (method === "change_mpin") {
      content = (
        <>
          <h3>Change MPIN</h3>
          <p>Feature coming soon: Change your MPIN for secure transactions.</p>
        </>
      );
    } else if (method === "pay_upi") {
      content = (
        <>
          <h3>Pay via UPI ID</h3>
          <div className="input-group">
            {/* Switch to uncontrolled input with ref */}
            <input
              type="text"
              placeholder="Enter UPI ID (e.g., user@bank)"
              defaultValue={receiver}
              ref={receiverInputRef}
              onInput={(e) => {
                console.log("Receiver Input (Uncontrolled):", e.target.value);
                setReceiver(e.target.value);
              }}
            />
            <label>UPI ID</label>
          </div>
          <div className="input-group">
            <input
              type="number"
              placeholder="Enter amount (e.g., 500)"
              defaultValue={transferAmount}
              ref={transferAmountInputRef}
              onInput={(e) => {
                console.log("Transfer Amount Input (Uncontrolled):", e.target.value);
                setTransferAmount(e.target.value);
              }}
            />
            <label>Amount</label>
          </div>
          <button onClick={initiateTransfer} className="action-button">
            Initiate Transfer
          </button>
          {transferStatus && !paymentDetails && (
            <p
              className={`message ${
                transferStatus.includes("successful") ? "success" : "error"
              }`}
            >
              {transferStatus}
            </p>
          )}
        </>
      );
    } else {
      content = (
        <>
          <h3>
            {method === "qr"
              ? "Scan QR Code"
              : method === "number"
              ? "Pay with Number"
              : method === "bank"
              ? "Bank Transfer"
              : method === "e_money"
              ? "e-Money Transfer"
              : "Offline Transfer"}
          </h3>
          <div className="input-group">
            <input
              type="number"
              placeholder="Enter amount (e.g., 500)"
              defaultValue={transferAmount}
              ref={transferAmountInputRef}
              onInput={(e) => {
                console.log("Transfer Amount Input (Uncontrolled):", e.target.value);
                setTransferAmount(e.target.value);
              }}
            />
            <label>Amount</label>
          </div>
          <div className="input-group">
            <input
              placeholder={
                method === "number"
                  ? "Enter Phone Number"
                  : method === "bank"
                  ? "Enter Bank Account Details"
                  : "Receiver Address"
              }
              defaultValue={receiver}
              ref={receiverInputRef}
              onInput={(e) => {
                console.log("Receiver Input (Uncontrolled):", e.target.value);
                setReceiver(e.target.value);
              }}
            />
            <label>
              {method === "number"
                ? "Phone Number"
                : method === "bank"
                ? "Bank Account"
                : "Receiver Address"}
            </label>
          </div>
          <button onClick={initiateTransfer} className="action-button">
            Initiate Transfer
          </button>
          {transferStatus && !paymentDetails && (
            <p
              className={`message ${
                transferStatus.includes("successful") ? "success" : "error"
              }`}
            >
              {transferStatus}
            </p>
          )}
        </>
      );
    }

    setModalContent(content);
    setIsModalOpen(true);
  };

  const showBottomOptions = (option) => {
    let content;
    if (option === "history") {
      content = (
        <>
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
        </>
      );
    } else if (option === "bank_balance") {
      content = (
        <>
          <h3>Bank Balance</h3>
          <p>Feature coming soon: Check your bank balance here.</p>
          <p>Current Bank Balance: ₹10,000 (mock data)</p>
        </>
      );
    } else if (option === "ecash_balance") {
      content = (
        <>
          <h3>eCash Balance</h3>
          {balance !== null ? (
            <p>Current eCash Balance: ₹{balance}</p>
          ) : (
            <p>Loading balance...</p>
          )}
        </>
      );
    }

    setModalContent(content);
    setIsModalOpen(true);
  };

  const initiateTransfer = async () => {
    const success = await createToken(transferMethod);
    if (!success) {
      return;
    }
  };

  const paymentDetailsContent = paymentDetails && (
    <>
      {(paymentDetails.method === "qr" || paymentDetails.method === "number") &&
        paymentDetails.qrCodeUrl && (
          <div className="qr-code">
            <p>Scan to Claim</p>
            <img src={paymentDetails.qrCodeUrl} alt="QR Code" />
          </div>
        )}
      {paymentDetails.method === "bank" && (
        <p>Bank Transfer Initiated: Please check your bank account.</p>
      )}
      {paymentDetails.method === "e_money" && (
        <p>e-Money Transfer Initiated: Please confirm with the receiver.</p>
      )}
      {paymentDetails.method === "offline" && (
        <p>Offline Transfer Initiated: Please complete the transfer offline.</p>
      )}
      {paymentDetails.method === "pay_upi" && (
        <p>UPI Transfer Initiated: Please confirm with the receiver.</p>
      )}
      <p>Amount: ₹{paymentDetails.amount}</p>
      <p>Sender Address: {paymentDetails.senderAddress}</p>
      <p>Receiver Address: {paymentDetails.receiverAddress}</p>
      <p>Token ID: {paymentDetails.tokenId}</p>
      <button
        onClick={() => {
          setPaymentDetails(null);
          setModalContent(null);
          setIsModalOpen(false);
        }}
        className="action-button"
      >
        Back to Transfer Options
      </button>
    </>
  );

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
    setPaymentDetails(null);
    setTransferStatus("");
    setMessage("");
  };

  return (
    <div className="wallet-container">
      <header className="wallet-header">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Pay friends and merchants"
            disabled
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        <div className="profile-icon">👤</div>
        <button onClick={logout} className="logout-button">
          Logout
        </button>
      </header>

      <div className="banner">
        <h2>e-Rupee Wallet: Go Cashless!</h2>
        <button className="banner-button">Apply Now</button>
      </div>

      <div className="wallet-content">
        {/* Test input field with separate state */}
        <div style={{ margin: "1rem 0", textAlign: "center" }}>
          <input
            type="text"
            placeholder="Test input field (separate state)"
            value={testInput}
            onChange={(e) => {
              console.log("Test Input (Separate State):", e.target.value);
              setTestInput(e.target.value);
            }}
            className="test-input"
          />
        </div>

        <div className="actions-section">
          <div className="transfer-options">
            <button
              onClick={() => showTransferOptions("qr")}
              className="action-tile"
            >
              <span className="action-icon">📷</span>
              <span className="action-label">Scan any QR code</span>
            </button>
            <button
              onClick={() => showTransferOptions("number")}
              className="action-tile"
            >
              <span className="action-icon">👥</span>
              <span className="action-label">Pay with number</span>
            </button>
            <button
              onClick={() => showTransferOptions("request")}
              className="action-tile"
            >
              <span className="action-icon">📞</span>
              <span className="action-label">Request money</span>
            </button>
            <button
              onClick={() => showTransferOptions("bank")}
              className="action-tile"
            >
              <span className="action-icon">🏦</span>
              <span className="action-label">Bank transfer</span>
            </button>
            <button
              onClick={() => showTransferOptions("pay_upi")}
              className="action-tile"
            >
              <span className="action-icon">💳</span>
              <span className="action-label">Pay UPI ID</span>
            </button>
            <button
              onClick={() => showTransferOptions("e_money")}
              className="action-tile"
            >
              <span className="action-icon">💸</span>
              <span className="action-label">e-Money transfer</span>
            </button>
            <button
              onClick={() => showTransferOptions("change_mpin")}
              className="action-tile"
            >
              <span className="action-icon">🔒</span>
              <span className="action-label">Change MPIN</span>
            </button>
            <button
              onClick={() => showTransferOptions("offline")}
              className="action-tile"
            >
              <span className="action-icon">📱</span>
              <span className="action-label">Offline transfer</span>
            </button>
          </div>
        </div>

        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button className="modal-close-button" onClick={closeModal}>
                ✕
              </button>
              <div className="modal-body">
                {paymentDetails ? paymentDetailsContent : modalContent}
              </div>
            </div>
          </div>
        )}

        <div className="send-money-section">
          {storedQrCode ? (
            <div className="stored-qr">
              <p>Stored QR Code for Transfer:</p>
              <img src={storedQrCode.url} alt="Stored QR Code" />
              <p>Amount: ₹{storedQrCode.amount}</p>
              <p>Receiver: {storedQrCode.receiver}</p>
              <div className="more-options">
                <button className="option-button">Share QR</button>
                <button className="option-button">Download QR</button>
                <button
                  className="option-button"
                  onClick={() => setStoredQrCode(null)}
                >
                  Clear QR
                </button>
              </div>
            </div>
          ) : (
            <p>UPI ID: {address}</p>
          )}
        </div>

        <div className="bottom-options-section">
          <button
            onClick={() => showBottomOptions("history")}
            className="bottom-option-tile"
          >
            <span className="bottom-option-icon">📜</span>
            <span className="bottom-option-label">Transaction History</span>
          </button>
          <button
            onClick={() => showBottomOptions("bank_balance")}
            className="bottom-option-tile"
          >
            <span className="bottom-option-icon">🏦</span>
            <span className="bottom-option-label">Bank Balance</span>
          </button>
          <button
            onClick={() => showBottomOptions("ecash_balance")}
            className="bottom-option-tile"
          >
            <span className="bottom-option-icon">💰</span>
            <span className="bottom-option-label">eCash Balance</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Wallet;