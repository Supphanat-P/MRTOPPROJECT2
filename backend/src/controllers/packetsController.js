import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATA,
};

const pool = mysql.createPool({
  ...config,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const savePackets = async (packets, userId) => {
  if (!packets || packets.length === 0) return;

  const values = packets.map((p) => [
    userId,
    p.src,
    p.dst,
    p.protocol,
    p.length,
    p.encrypted,
    new Date(p.timestamp),
    p.srcPort || null,
    p.dstPort || null,
  ]);

  try {
    await pool.query(
      `INSERT INTO packets 
      (user_id, src, dst, protocol, length, encrypted, timestamp, src_port, dst_port)
      VALUES ?`,
      [values],
    );
  } catch (err) {
    console.error("DB insert error:", err);
  }
};
