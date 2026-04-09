// Jo: สร้าง Component นี้ขึ้นมาใหม่สำหรับ Admin เพื่อดูประวัติการใช้งาน (Packets) ของผู้ใช้ทั้งหมด และสามารถกรองตาม User ได้
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./PacketDashboard.css"; // Reuse styling if applicable
import "../App.css";

function HistoryAdmin() {
  const [packets, setPackets] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const PAGE_SIZE = 50;

  useEffect(() => {
    const fetchData = async () => {
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
    fetchData();
  }, []);

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

            <div className="paginationControls">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
                disabled={currentPage === 0}
              >
                Prev
              </button>
              <span>
                Page {filteredPackets.length > 0 ? currentPage + 1 : 0} of{" "}
                {totalPages || 1}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages - 1))
                }
                disabled={currentPage >= totalPages - 1}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoryAdmin;
