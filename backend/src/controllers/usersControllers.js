import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATA,
};

const query = async (sql, params) => {
  const connection = await mysql.createConnection(config);
  const [rows] = await connection.execute(sql, params);
  connection.end();
  return rows;
};

export const createUser = async ({ username, password, role_id = 1 }) => {
  const hashPassword = await bcrypt.hash(password, 10);

  const checkSql = "SELECT username FROM users WHERE username = ?";
  const existingUsers = await query(checkSql, [username]);
  if (existingUsers.length > 0) {
    throw new Error("อีเมลนี้ถูกใช้ไปแล้ว");
  }

  const insertSql =
    "INSERT INTO users (username, password, role_id) VALUES (?, ?, ?)";
  try {
    const result = await query(insertSql, [username, hashPassword, role_id]);
    return result;
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw new Error("อีเมลนี้ถูกใช้ไปแล้ว");
    }
    throw error;
  }
};

export const updateUserIp = async (userId, ip) => {
  const sql = "UPDATE users SET ip = ? WHERE user_id = ?";
  await query(sql, [ip, userId]);
};

export const getUserByusername = async (username) => {
  const sql = "SELECT * FROM users WHERE username = ?";
  const result = await query(sql, [username]);
  return result[0];
};

export const getusernameById = async (id) => {
  const sql = "SELECT username FROM users WHERE user_id = ?";
  const result = await query(sql, [id]);
  return result[0]?.username || null;
};

export const getRoleNamebyUserId = async (id) => {
  try {
    const sql = `
      SELECT r.role_name AS role
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = ?
    `;
    const result = await query(sql, [id]);
    console.log("SQL result:", result);
    return result[0]?.role || "Unknown Role";
  } catch (err) {
    console.error("Error in getRoleNamebyUserId:", err);
    throw err;
  }
};
export const getAllUsers = async () => {
  const sql = "SELECT user_id AS id, username, role_id FROM users";
  const result = await query(sql);
  return result;
};

export const deleteUser = async (id) => {
  const sql = "DELETE FROM users WHERE user_id = ?";
  await query(sql, [id]);
};
