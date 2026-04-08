import { useEffect, useState } from "react";
import axios from "axios";
import "../App.css";

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get("http://localhost:3000/user-role/history");
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

  return (
    <div className="History" style={{ padding: "20px" }}>
      <h1>Your Packet History</h1>
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
            </tr>
          </thead>
          <tbody>
            {history.map((packet, idx) => (
              <tr key={packet.id || idx}>
                <td>{new Date(packet.timestamp).toLocaleString()}</td>
                <td>{packet.src}</td>
                <td>{packet.dst}</td>
                <td>{packet.protocol}</td>
                <td>{packet.length}</td>
                <td>{packet.encrypted ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default History;
