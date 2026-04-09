import "../App.css";
import "./History.css";
import React, { useState, useEffect } from "react";
import axios from "axios";

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedPacket, setSelectedPacket] = useState(null);
  const PAGE_SIZE = 12;
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get("/api/user-role/history", {
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
        await axios.delete("/api/user-role/history", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setHistory([]);
        setCurrentPage(0);
        setSelectedPacket(null);
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

  const sanitizePayload = (raw, maxLen = 80) => {
    if (!raw) return null;
    if (typeof raw !== "string") return JSON.stringify(raw).slice(0, maxLen);
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
    <div className="history-container">
      <div className="history-header">
        <h1>Your Packet History</h1>
        <button
          className="btn-clear"
          onClick={handleClearHistory}
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
        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Source IP</th>
                <th>Destination IP</th>
                <th>Protocol</th>
                <th>Flags</th>
                <th>Length</th>
                <th>Encrypted</th>
                <th>Payload</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPackets.map((packet, idx) => (
                <tr
                  key={packet.id || idx}
                  className={selectedPacket === packet ? "selected" : ""}
                  onClick={() =>
                    setSelectedPacket(selectedPacket === packet ? null : packet)
                  }
                >
                  <td>{new Date(packet.timestamp).toLocaleString()}</td>
                  <td>{packet.src}</td>
                  <td>{packet.dst}</td>
                  <td>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 20,
                        background:
                          (protocolColors[packet.protocol] || "#ccc") + "33",
                        color: protocolColors[packet.protocol] || "#000",
                        border:
                          "1px solid " + (protocolColors[packet.protocol] || "#ccc"),
                        fontWeight: "600",
                        fontSize: "12px",
                      }}
                    >
                      {packet.protocol}
                    </span>
                  </td>
                  <td>
                    {packet.flags ? (
                      Object.entries(packet.flags)
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
                  <td>{packet.length} B</td>
                  <td>{packet.encrypted ? "Yes" : "No"}</td>
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
                    title={sanitizePayload(packet.payload, 500) || ""}
                  >
                    {sanitizePayload(packet.payload) || (
                      <span style={{ color: "#ccc" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination-container">
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
              Page {currentPage + 1} of {totalPages || 1}
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
            <button
              className="btn-pagination"
              onClick={() => setCurrentPage(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
            >
              Last
            </button>
          </div>
        </div>
      )}

      {selectedPacket && (
        <div className="packet-detail-panel">
          <h3>Packet Details</h3>
          <table className="packet-detail-table">
            <tbody>
              <tr>
                <td>Time:</td>
                <td>{new Date(selectedPacket.timestamp).toLocaleString()}</td>
              </tr>
              <tr>
                <td>Source IP:</td>
                <td>{selectedPacket.src}</td>
              </tr>
              <tr>
                <td>Destination IP:</td>
                <td>{selectedPacket.dst}</td>
              </tr>
              <tr>
                <td>Protocol:</td>
                <td>
                  <span className="protocol-badge">
                    {selectedPacket.protocol}
                  </span>
                </td>
              </tr>
              <tr>
                <td>Length:</td>
                <td>{selectedPacket.length} B</td>
              </tr>
              <tr>
                <td>Encrypted:</td>
                <td>{selectedPacket.encrypted ? "Yes" : "No"}</td>
              </tr>
              {selectedPacket.srcPort && (
                <tr>
                  <td>Source Port:</td>
                  <td>{selectedPacket.srcPort}</td>
                </tr>
              )}
              {selectedPacket.dstPort && (
                <tr>
                  <td>Destination Port:</td>
                  <td>{selectedPacket.dstPort}</td>
                </tr>
              )}
              {selectedPacket.flags && (
                <tr>
                  <td>TCP Flags:</td>
                  <td>
                    {typeof selectedPacket.flags === "object"
                      ? JSON.stringify(selectedPacket.flags)
                      : selectedPacket.flags}
                  </td>
                </tr>
              )}
              {selectedPacket.payload && (
                <tr>
                  <td>Payload:</td>
                  <td>
                    <pre className="payload-pre">
                      {typeof selectedPacket.payload === "string"
                        ? selectedPacket.payload
                            .replace(/[^\x20-\x7E\n\r\t]/g, ".")
                            .slice(0, 1000)
                        : JSON.stringify(selectedPacket.payload)}
                    </pre>
                    <div className="payload-meta">
                      <span>
                        printable ASCII · non-printable &rarr; <code>.</code>
                      </span>
                      {typeof selectedPacket.payload === "string" && (
                        <span>
                          <strong>{selectedPacket.payload.length}</strong> chars
                          shown
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default History;
