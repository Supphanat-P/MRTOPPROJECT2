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
          axios.get("/api/admin/users")
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
    (currentPage + 1) * PAGE_SIZE
  );

  return (
    <div className="page" style={{ padding: '20px' }}>
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
        <div className="metricCard" style={{ marginLeft: 'auto', padding: '10px 20px', minWidth: '150px' }}>
          <div className="metricLabel">Total Packets</div>
          <div className="metricValue">{filteredPackets.length}</div>
        </div>
      </div>

      <div className="tableCard">
        <div className="tableHeader">
          <span>Packets History</span>
        </div>
        {loading ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>Loading packets...</p>
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
                  <th>Length</th>
                  <th>Encrypted</th>
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
                            background: "#e1f5ee",
                            color: "#0f6e56",
                            border: "1px solid #9fe1cb",
                          }}
                        >
                          {p.protocol}
                        </span>
                      </td>
                      <td>{p.length} B</td>
                      <td className={p.encrypted ? "enc-yes" : "enc-no"}>
                        {p.encrypted ? "Yes" : "No"}
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
                Page {filteredPackets.length > 0 ? currentPage + 1 : 0} of {totalPages || 1}
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