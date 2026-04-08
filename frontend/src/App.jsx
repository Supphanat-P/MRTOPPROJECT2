import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Home from "./components/Home";
import Dashboard from "./components/Dashboard";
import PacketDashboard from "./components/PacketDashboard";
import History from "./components/History";
import HistoryAdmin from "./components/HistoryAdmin"; // Jo: นำเข้า HistoryAdmin component สำหรับ Admin
import NavBar from "./components/Navbar";
import "./App.css";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";

function App() {
  const [currUser, setCurrUser] = useState({ username: "", role: "" });
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [alertMsg, setAlertMsg] = useState(null);

  const socketRef = useRef(null);

  //  สร้าง socket แค่ครั้งเดียว
  useEffect(() => {
    if (!token) return;

    socketRef.current = io("http://localhost:3000", {
      auth: { token },
    });

    // ฟัง alert
    socketRef.current.on("securityAlert", (data) => {
      console.log("🔥 ALERT:", data);

      setAlertMsg(`${data.message} (${data.total || data.rate})`);

      setTimeout(() => {
        setAlertMsg(null);
      }, 3000);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [token]);

  //  verify user
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      axios
        .get("/api/users/verify")
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

      {/* alert โผล่ทุกหน้า */}
      {alertMsg && (
        <div className="alert-box">
          ⚠️ {alertMsg}
        </div>
      )}

      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pdashboard" element={<PacketDashboard />} />
        <Route path="/history" element={<History />} />
        <Route path="/historyadmin" element={<HistoryAdmin />} /> {/* Jo: เพิ่ม Route สำหรับหน้า HistoryAdmin */}

        {/* ส่ง socket ลงไป */}
        <Route
          path="/pdashboard"
          element={<PacketDashboard socket={socketRef.current} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;