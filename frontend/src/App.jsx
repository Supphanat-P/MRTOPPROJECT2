import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Home from "./components/Home";
import Dashboard from "./components/Dashboard";
import PacketDashboard from "./components/PacketDashboard";
import NavBar from "./components/Navbar";
import "./App.css";
import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [currUser, setCurrUser] = useState({ username: "", role: "" });
  const [token, setToken] = useState(localStorage.getItem("token")); // <-- init here

  // Whenever token changes, fetch user info
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      axios
        .get("http://localhost:3000/users/verify")
        .then((res) => {
          setCurrUser({
            role: res.data.role,
            username: res.data.username,
          });
        })
        .catch((err) => {
          console.error("Token verification failed", err);
          setCurrUser({ username: "", role: "" });
          localStorage.removeItem("token");
          setToken(null);
        });
    } else {
      setCurrUser({ username: "", role: "" });
    }
  }, [token]);

  return (
    <BrowserRouter>
      <NavBar currUser={currUser} token={token} setToken={setToken} />
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pdashboard" element={<PacketDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
