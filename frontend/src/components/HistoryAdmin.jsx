// Jo: สร้าง Component นี้ขึ้นมาใหม่สำหรับ Admin เพื่อดูประวัติการใช้งาน (Packets) ของผู้ใช้ทั้งหมด และสามารถกรองตาม User ได้
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./PacketDashboard.css"; // Reuse styling if applicable
import "./History.css"; // Jo: เพิ่มการ import style จาก History.css เพื่อให้ปุ่มเหมือนกัน
import "../App.css";

function HistoryAdmin() {
  const [packets, setPackets] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const PAGE_SIZE = 50;

  // Jo: แยกฟังก์ชัน fetchData ออกมาเพื่อให้สามารถเรียกใช้ตอนกดปุ่ม Refresh และทำงานหลังลบข้อมูลได้ทันที
  const fetchData = async () => {
    setLoading(true);
    try {
      const [packetsRes, usersRes] = await Promise.all([
        axios.get("/api/admin/packets"),
        axios.get("/api/admin/users"),
      ]);
      setPackets(packetsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Jo: เพิ่มฟังก์ชันสำหรับลบ Packets โดยระบุ User ID ของผู้ใช้คนนั้นๆ
  const handleClearUserPackets = async () => {
    if (!selectedUser) {
      alert("กรุณาเลือก User ที่ต้องการเคลียร์ข้อมูล");
      return;
    }
    const userToClear = users.find(u => u.user_id === Number(selectedUser));
    if (window.confirm(`Are you sure you want to clear packets for user: ${userToClear?.username}?`)) {
      setLoading(true);
      try {
        await axios.delete(`/api/admin/packets/user/${selectedUser}`);
        await fetchData();
      } catch (error) {
        console.error("Failed to clear packets for user:", error);
        alert("Failed to clear packets");
        setLoading(false);
      }
    }
  };

  const handleUserChange = (e) => {
    setSelectedUser(e.target.value);
    setCurrentPage(0);
  };

  const filteredPackets = selectedUser
    ? packets.filter((p) => p.user_id === Number(selectedUser))
    : packets;

  const totalPages = Math.ceil(filteredPackets.length / PAGE_SIZE);
  const paginatedPackets = filteredPackets.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );
  const sanitizePayload = (raw, maxLen = 80) => {
    if (!raw) return null;
    return raw.replace(/[^\x20-\x7E]/g, ".").slice(0, maxLen);
  };

  const protocolColors = {
    HTTP: "#1d9e75",
    HTTPS: "#ff9900",
    SSH: "#4a90e2",
    DNS: "#f5a623",
    TCP: "#50e3c2",
    UDP: "#bd10e0",
    ICMP: "#f8e71c",
    OTHER: "#9b9b9b",
  };
  const tcpColors = {
    SYN: "#ff9800",
    ACK: "#4caf50",
    FIN: "#f44336",
    RST: "#9c27b0",
    OTHER: "#ccc",
  };
  return (
    <div className="page" style={{ padding: "20px" }}>
      <div className="topbar">
        <div className="logo">
          <span className="dot" /> History Admin Panel
        </div>
      </div>

      <div className="controls">
        <div className="ctrlGroup">
          <span className="label">Filter by User</span>
          <select
            className="select"
            value={selectedUser}
            onChange={handleUserChange}
          >
            <option value="">-- All Users --</option>
            {users.map((user) => (
              <option key={user.user_id} value={user.user_id}>
                {user.username}
              </option>
            ))}
          </select>
          {/* Jo: ปุ่ม Clear User Packets จะแสดงให้กดได้ก็ต่อเมื่อมีการเลือก User ก่อนจากแท็บ Filter */}
          {selectedUser && (
            <button 
              className="btn-clear"
              onClick={handleClearUserPackets} 
              style={{ marginLeft: "10px" }}
            >
              Clear User Packets
            </button>
          )}
          {/* Jo: ปุ่ม Refresh เพื่อสั่ง fetch ข้อมูล Packets และ Users ใหม่ทันที */}
          <button 
            className="btn-pagination"
            onClick={fetchData} 
            style={{ marginLeft: "10px" }}
          >
            Refresh
          </button>
        </div>
        <div
          className="metricCard"
          style={{
            marginLeft: "auto",
            padding: "10px 20px",
            minWidth: "150px",
          }}
        >
          <div className="metricLabel">Total Packets</div>
          <div className="metricValue">{filteredPackets.length}</div>
        </div>
      </div>

      <div className="tableCard">
        <div className="tableHeader">
          <span>Packets History</span>
        </div>
        {loading ? (
          <p style={{ padding: "20px", textAlign: "center" }}>
            Loading packets...
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table width="100%">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Protocol</th>
                  <th>TCP</th>
                  <th>Length</th>
                  <th>Encrypted</th>
                  <th>Payload</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPackets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="emptyCell">
                      No packets found.
                    </td>
                  </tr>
                ) : (
                  paginatedPackets.map((p, i) => (
                    <tr key={i}>
                      <td>{new Date(p.timestamp).toLocaleString()}</td>
                      <td>{p.username || `User ID: ${p.user_id}`}</td>
                      <td>{p.src}</td>
                      <td>{p.dst}</td>
                      <td>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 20,
                            background:
                              (protocolColors[p.protocol] || "#ccc") + "33",
                            color: protocolColors[p.protocol] || "#000",
                            border:
                              "1px solid " +
                              (protocolColors[p.protocol] || "#ccc"),
                            fontWeight: "600",
                            fontSize: "12px",
                          }}
                        >
                          {p.protocol}
                        </span>
                      </td>
                      <td>
                        {p.flags ? (
                          Object.entries(p.flags)
                            .filter(([flag, val]) => val)
                            .map(([flag], idx) => (
                              <span
                                key={idx}
                                style={{
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  backgroundColor: tcpColors[flag] || "#ccc",
                                  color: "#fff",
                                  fontWeight: "bold",
                                  fontSize: 12,
                                  marginRight: 4,
                                }}
                              >
                                {flag}
                              </span>
                            ))
                        ) : (
                          <span style={{ color: "#999" }}>—</span>
                        )}
                      </td>
                      <td>{p.length} B</td>
                      <td className={p.encrypted ? "enc-yes" : "enc-no"}>
                        {p.encrypted ? "Yes" : "No"}
                      </td>
                      <td
                        style={{
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontSize: "11px",
                          fontFamily: "monospace",
                          color: "#888",
                        }}
                        title={sanitizePayload(p.payload, 500) || ""}
                      >
                        {sanitizePayload(p.payload) || (
                          <span style={{ color: "#ccc" }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="pagination-container">
              {/* Jo: ปุ่มหน้าแรก */}
              <button
                className="btn-pagination"
                onClick={() => setCurrentPage(0)}
                disabled={currentPage === 0}
              >
                First
              </button>
              <button
                className="btn-pagination"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
                disabled={currentPage === 0}
              >
                Prev
              </button>
              <span className="pagination-text">
                Page {filteredPackets.length > 0 ? currentPage + 1 : 0} of{" "}
                {totalPages || 1}
              </span>
              <button
                className="btn-pagination"
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages - 1))
                }
                disabled={currentPage >= totalPages - 1}
              >
                Next
              </button>
              {/* Jo: ปุ่มหน้าสุดท้าย */}
              <button
                className="btn-pagination"
                onClick={() => setCurrentPage(Math.max(0, totalPages - 1))}
                disabled={currentPage >= totalPages - 1 || totalPages === 0}
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoryAdmin;
