import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom"; // Import Link for navigation
import "./Register.css";

function Register() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [panCard, setPanCard] = useState("");
  const [password, setPassword] = useState("");
  const [mpin, setMpin] = useState("");
  const [linkBank, setLinkBank] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    // Client-side validation
    if (!email || !name || !mobileNo || !panCard || !password || !mpin) {
      setMessage(
        "All fields (email, name, mobile number, PAN card, password, MPIN) are required"
      );
      return;
    }

    const mobileNoRegex = /^\d{10}$/;
    if (!mobileNoRegex.test(mobileNo)) {
      setMessage("Mobile number must be 10 digits");
      return;
    }

    const panCardRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panCardRegex.test(panCard)) {
      setMessage("PAN card must be in the format ABCDE1234F");
      return;
    }

    const mpinRegex = /^\d{6}$/;
    if (!mpinRegex.test(mpin)) {
      setMessage("MPIN must be a 6-digit number");
      return;
    }

    let bankDetails = {};
    if (linkBank) {
      if (!accountNumber || !ifscCode || !bankName) {
        setMessage(
          "All bank details (account number, IFSC code, bank name) must be provided if linking a bank account"
        );
        return;
      }

      const accountNumberRegex = /^\d{9,18}$/;
      if (!accountNumberRegex.test(accountNumber)) {
        setMessage("Account number must be between 9 and 18 digits");
        return;
      }

      const ifscCodeRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscCodeRegex.test(ifscCode)) {
        setMessage("IFSC code must be in the format ABCD0XXXXXX");
        return;
      }

      bankDetails = { accountNumber, ifscCode, bankName };
    }

    try {
      const response = await axios.post("http://localhost:5000/register", {
        email,
        name,
        mobileNo,
        panCard,
        password,
        mpin,
        bankDetails,
      });
      setMessage(response.data.message);
      setTimeout(() => navigate("/login"), 1000);
    } catch (error) {
      setMessage(error.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2 className="register-title">Create Account</h2>
        <p className="register-subtitle">Join eRupee Wallet today</p>

        <form onSubmit={handleRegister} className="register-form">
          <div className="input-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={email ? "filled" : ""}
            />
            <label>Email</label>
          </div>

          <div className="input-group">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={name ? "filled" : ""}
            />
            <label>Name</label>
          </div>

          <div className="input-group">
            <input
              type="text"
              placeholder="Mobile Number (10 digits)"
              value={mobileNo}
              onChange={(e) => setMobileNo(e.target.value)}
              required
              className={mobileNo ? "filled" : ""}
            />
            <label>Mobile Number</label>
          </div>

          <div className="input-group">
            <input
              type="text"
              placeholder="PAN Card (e.g., ABCDE1234F)"
              value={panCard}
              onChange={(e) => setPanCard(e.target.value)}
              required
              className={panCard ? "filled" : ""}
            />
            <label>PAN Card</label>
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={password ? "filled" : ""}
            />
            <label>Password</label>
          </div>

          <div className="input-group">
            <input
              type="text"
              placeholder="MPIN (6 digits)"
              value={mpin}
              onChange={(e) => setMpin(e.target.value)}
              required
              className={mpin ? "filled" : ""}
            />
            <label>MPIN</label>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={linkBank}
                onChange={(e) => setLinkBank(e.target.checked)}
              />
              <span>Link Bank Account (Optional)</span>
            </label>
          </div>

          {linkBank && (
            <div className="bank-details">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Account Number (9-18 digits)"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className={accountNumber ? "filled" : ""}
                />
                <label>Account Number</label>
              </div>

              <div className="input-group">
                <input
                  type="text"
                  placeholder="IFSC Code (e.g., ABCD0XXXXXX)"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  className={ifscCode ? "filled" : ""}
                />
                <label>IFSC Code</label>
              </div>

              <div className="input-group">
                <input
                  type="text"
                  placeholder="Bank Name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className={bankName ? "filled" : ""}
                />
                <label>Bank Name</label>
              </div>
            </div>
          )}

          <button type="submit" className="register-button">
            Register
          </button>

          {/* Add the link to Login below the button */}
          <p className="login-link">
            Already have an account? <Link to="/login">Login here</Link>
          </p>

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
      </div>
    </div>
  );
}

export default Register;