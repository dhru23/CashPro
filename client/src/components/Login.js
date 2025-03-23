import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

function Login({ setToken }) {
  const [mobileNo, setMobileNo] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    // Client-side validation
    const mobileNoRegex = /^\d{10}$/;
    if (!mobileNoRegex.test(mobileNo)) {
      setMessage("Mobile number must be 10 digits");
      return;
    }

    if (!password) {
      setMessage("Password is required");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/login", {
        mobileNo,
        password,
      });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("address", response.data.address);
      setToken(response.data.token);
      navigate("/wallet");
    } catch (error) {
      setMessage(error.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Welcome Back</h2>
        <p className="login-subtitle">Log in to your eRupee Wallet</p>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <input
              type="text"
              placeholder="Mobile Number (10 digits)"
              value={mobileNo}
              onChange={(e) => setMobileNo(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-button">
            Login
          </button>

          <p className="register-link">
            New user? <Link to="/">Register here</Link>
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

export default Login;