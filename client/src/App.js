import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Wallet from "./components/Wallet";
import "./App.css";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const navigate = useNavigate();

  const logout = () => {
    setToken("");
    localStorage.removeItem("token");
    localStorage.removeItem("address");
    navigate("/login");
  };

  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/" element={<Register />} />
        <Route
          path="/wallet"
          element={
            token ? (
              <Wallet token={token} logout={logout} /> // Pass logout to Wallet
            ) : (
              <p>Please login to access your wallet.</p>
            )
          }
        />
      </Routes>
    </div>
  );
}

export default App;