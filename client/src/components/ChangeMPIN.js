import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Only import useNavigate
import "./ChangeMPIN.css";

function ChangeMPIN({ token }) {
  const [oldMpin, setOldMpin] = useState("");
  const [panCard, setPanCard] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [newMpin, setNewMpin] = useState("");
  const [confirmNewMpin, setConfirmNewMpin] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!oldMpin && !panCard) {
      setMessage("Please enter either your old MPIN or PAN card number.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/verify-user",
        {
          oldMpin: oldMpin || undefined,
          panCard: panCard || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.verified) {
        setIsVerified(true);
        setMessage("Verification successful! Please enter your new MPIN.");
      } else {
        setMessage("Verification failed. Please check your details.");
      }
    } catch (error) {
      console.error("Error verifying user:", error);
      setMessage(
        error.response?.data?.error || "Error verifying user. Please try again."
      );
    }
  };

  const handleChangeMpin = async (e) => {
    e.preventDefault();
    if (newMpin !== confirmNewMpin) {
      setMessage("New MPIN and Confirm MPIN do not match.");
      return;
    }

    if (!newMpin || newMpin.length !== 6 || isNaN(newMpin)) {
      setMessage("New MPIN must be a 6-digit number.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/update-mpin",
        { newMpin },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(response.data.message || "MPIN updated successfully!");
      setTimeout(() => {
        navigate("/wallet");
      }, 1500);
    } catch (error) {
      console.error("Error updating MPIN:", error);
      setMessage(
        error.response?.data?.error || "Error updating MPIN. Please try again."
      );
    }
  };

  return (
    <div className="change-mpin-container">
      <h2>Change MPIN</h2>

      {!isVerified ? (
        <form onSubmit={handleVerify} className="verify-form">
          <div className="input-group">
            <input
              type="text"
              placeholder="Enter Old MPIN"
              value={oldMpin}
              onChange={(e) => setOldMpin(e.target.value)}
            />
            <label>Old MPIN</label>
          </div>
          <div className="input-group">
            <input
              type="text"
              placeholder="Enter PAN Card Number"
              value={panCard}
              onChange={(e) => setPanCard(e.target.value)}
            />
            <label>PAN Card Number</label>
          </div>
          <button type="submit" className="action-button">
            Verify
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
        </form>
      ) : (
        <form onSubmit={handleChangeMpin} className="change-mpin-form">
          <div className="input-group">
            <input
              type="text"
              placeholder="Enter New MPIN"
              value={newMpin}
              onChange={(e) => setNewMpin(e.target.value)}
            />
            <label>New MPIN</label>
          </div>
          <div className="input-group">
            <input
              type="text"
              placeholder="Confirm New MPIN"
              value={confirmNewMpin}
              onChange={(e) => setConfirmNewMpin(e.target.value)}
            />
            <label>Confirm New MPIN</label>
          </div>
          <button type="submit" className="action-button">
            Change MPIN
          </button>
          {message && (
            <p
              className={`message ${
                message.includes("successfully") ? "success" : "error"
              }`}
            >
              {message}
            </p>
          )}
        </form>
      )}

      <button
        onClick={() => navigate("/wallet")}
        className="action-button back-button"
      >
        Back to Wallet
      </button>
    </div>
  );
}

export default ChangeMPIN;