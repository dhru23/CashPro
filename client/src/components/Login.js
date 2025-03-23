import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

function Login({ onLogin }) {
  const [mobileNo, setMobileNo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mobileNo || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/login", {
        mobileNo,
        password,
      });

      const { token, address } = response.data;
      onLogin(token, address);
      setError("");
      navigate("/wallet");
    } catch (error) {
      console.error("Login error:", error);
      setError(error.response?.data?.error || "Login failed. Please try again.");
    }
  };

  return (
    <div className="register-container">
      <div className="register-form">
        <h2>Login</h2>
        <p className="subheading">Access your eRUPEE Wallet</p>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              placeholder="Mobile Number (10 digits)"
              value={mobileNo}
              onChange={(e) => setMobileNo(e.target.value)}
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="register-button">
            Login
          </button>
        </form>
        <p className="login-link">
          Don't have an account?{" "}
          <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;