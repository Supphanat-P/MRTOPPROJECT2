import { useEffect, useState } from "react";
import axios from "axios";
import "../App.css";

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const PAGE_SIZE = 12;

 useEffect(() => {
  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get("http://localhost:3000/user-role/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch history:", err);
      setError("Failed to fetch history or you are not authorized.");
    } finally {
      setLoading(false);
    }
  };
  fetchHistory();
}, []);

const handleClearHistory = async () => {
  if (window.confirm("Are you sure you want to clear your packet history?")) {
    try {
      const token = localStorage.getItem("token");
      await axios.delete("http://localhost:3000/user-role/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setHistory([]);
      setCurrentPage(0);
    } catch (err) {
      console.error("Failed to clear history:", err);
      alert("Failed to clear history.");
    }
  }
};

const paginatedPackets = history
    .slice()
    .reverse()
    .slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(history.length / PAGE_SIZE);

  return (
    <div className="History" style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Your Packet History</h1>
        <button 
          onClick={handleClearHistory} 
          style={{ 
            padding: "10px 20px", 
            backgroundColor: "#ff4d4f", 
            color: "white", 
            border: "none", 
            borderRadius: "6px", 
            cursor: "pointer",
            fontWeight: "bold"
          }}
          disabled={history.length === 0}
        >
          Clear History
        </button>
      </div>
      {loading ? (
        <p>Loading history...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : history.length === 0 ? (
        <p>No history found.</p>
      ) : (
        <table className="history-table" style={{ width: "100%", textAlign: "left", marginTop: "20px" }}>
          <thead>
            <tr>
              
              <th>Timestamp</th>
              <th>Source IP</th>
              <th>Destination IP</th>
              <th>Protocol</th>
              <th>Length</th>
              <th>Encrypted</th>
              <th>Payload</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPackets.map((packet, idx) => (
              <tr key={packet.id || idx}>
                <td>{new Date(packet.timestamp).toLocaleString()}</td>
                <td>{packet.src}</td>
                <td>{packet.dst}</td>
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
                        {packet.protocol}
                      </span>
                    </td>
                <td>{packet.length}</td>
                <td>{packet.encrypted ? "Yes" : "No"}</td>
                <td>{packet.payload}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
       <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "24px" }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
              disabled={currentPage === 0}
              style={{
                padding: "8px 16px",
                border: "none",
                borderRadius: "4px",
                backgroundColor: currentPage === 0 ? "#f0f0f0" : "#1890ff",
                color: currentPage === 0 ? "#a0a0a0" : "white",
                cursor: currentPage === 0 ? "not-allowed" : "pointer",
                fontWeight: "bold",
                boxShadow: "0 2px 0 rgba(0,0,0,0.015)"
              }}
            >
              Prev
            </button>
            <span style={{ fontSize: "14px", fontWeight: "500", color: "#333" }}>Page {currentPage + 1} of {totalPages || 1}</span>
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(p + 1, totalPages - 1))
              }
              disabled={currentPage >= totalPages - 1}
               style={{
                padding: "8px 16px",
                border: "none",
                borderRadius: "4px",
                backgroundColor: currentPage >= totalPages - 1 ? "#f0f0f0" : "#1890ff",
                color: currentPage >= totalPages - 1 ? "#a0a0a0" : "white",
                cursor: currentPage >= totalPages - 1 ? "not-allowed" : "pointer",
                fontWeight: "bold",
                boxShadow: "0 2px 0 rgba(0,0,0,0.015)"
              }}
            >
              Next
            </button>
          </div>
    </div>
  );
}

export default History;
