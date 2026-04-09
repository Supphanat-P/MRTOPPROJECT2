// Jo: สร้าง Router นี้ขึ้นมาใหม่สำหรับจัดการ API ของ Admin (ดึงข้อมูล Packets ทั้งหมด, ดึงผู้ใช้ทั้งหมด)
import { Router } from "express";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATA,
};

const adminRoleRouter = Router();

adminRoleRouter.get("/packets", async (req, res) => {
  try {
    const connection = await mysql.createConnection(config);
    // Fetch all packets and join with users table to get the username
    const sql = `
      SELECT p.*, u.username
      FROM packets p
      LEFT JOIN users u ON p.user_id = u.user_id
      ORDER BY p.timestamp DESC
    `;
    const [rows] = await connection.execute(sql);
    connection.end();
    
    // We send back all packets. Let the frontend do the filtering.
    // In a production app, we would use pagination.
    res.json(rows);
  } catch (error) {
    console.error("Failed to fetch admin packets:", error);
    res.status(500).json({ message: "Server error" });
  }
});

adminRoleRouter.get("/users", async (req, res) => {
  try {
     const connection = await mysql.createConnection(config);
     const sql = "SELECT user_id, username FROM users";
     const [rows] = await connection.execute(sql);
     connection.end();
     res.json(rows);
  } catch (error) {
     console.error("Failed to fetch users:", error);
     res.status(500).json({ message: "Server error" });
  }
});

// Jo: เพิ่ม Route สำหรับให้ Admin เคลียร์ Packets ของ User รายคนตามที่ระบุใน userId
adminRoleRouter.delete("/packets/user/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const connection = await mysql.createConnection(config);
    const sql = "DELETE FROM packets WHERE user_id = ?";
    await connection.execute(sql, [userId]);
    connection.end();
    res.json({ message: "Packets cleared for user" });
  } catch (error) {
    console.error("Failed to clear user packets:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default adminRoleRouter;