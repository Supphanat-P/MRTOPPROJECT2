import { Router } from "express";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATA,
};

const pool = mysql.createPool({
  config,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const userRoleRouter = Router();

// Middleware to verify JWT and extract user_id
const jwtMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user_id = payload.id;
    next();
  });
};

userRoleRouter.get("/history", jwtMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM packets WHERE user_id = ? ORDER BY timestamp DESC",
      [req.user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ message: "Failed to get history" });
  }
});

export default userRoleRouter;
