import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Wallet from "./components/Wallet";
import ChangeMPIN from "./components/ChangeMPIN";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  const handleLogin = (newToken, address) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("address", address);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("address");
    setToken("");
  };

  return (
      <Routes>
        <Route
          path="/login"
          element={
            token ? (
              <Navigate to="/wallet" />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/register"
          element={
            token ? (
              <Navigate to="/wallet" />
            ) : (
              <Register />
            )
          }
        />
        <Route
          path="/wallet"
          element={
            token ? (
              <Wallet token={token} logout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/change-mpin"
          element={
            token ? (
              <ChangeMPIN token={token} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/"
          element={<Navigate to={token ? "/wallet" : "/login"} />}
        />
      </Routes>
  );
}

export default App;